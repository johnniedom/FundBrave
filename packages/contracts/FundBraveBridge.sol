 // SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@axelar-network/axelar-gmp-sdk-solidity/contracts/executable/AxelarExecutable.sol";
import "@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol";
import "@axelar-network/axelar-gmp-sdk-solidity/contracts/utils/AxelarStrings.sol";

interface IUniswapRouter {
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);
}

interface IFundraiser {
    function creditDonation(address donor, uint256 usdtAmount) external;
}

/**
 * @title FundBraveBridge
 * @dev Handles cross-chain donations, swaps them to USDT,
 * and forwards to the correct Fundraiser contract.
 */
contract FundBraveBridge is AxelarExecutable, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using AxelarStrings for address;

    IAxelarGasService public immutable gasService;
    IUniswapRouter public immutable uniswapRouter;
    IERC20 public immutable usdtToken;
    address public immutable localFundraiserFactory;

    // Mappings for sending
    mapping(string => bool) public supportedChains;
    mapping(string => string) public destinationContractAddresses;
    mapping(string => mapping(string => bool)) public supportedTokens;

    struct CrossChainDonation {
        address donor;
        uint256 fundraiserId;
        uint256 amount;
        string tokenSymbol;
        string destinationChain;
        uint256 timestamp;
    }
    mapping(bytes32 => CrossChainDonation) public donations;
    mapping(address => bytes32[]) public donorTransactions;
 
    uint256 public totalCrossChainDonations;
    uint256 public totalCrossChainVolumeUSDT;

    event CrossChainDonationInitiated(
        bytes32 indexed transactionId,
        address indexed donor,
        uint256 indexed fundraiserId,
        uint256 amount,
        string tokenSymbol,
        string destinationChain
    );
    
    event CrossChainDonationFinalized(
        string sourceChain,
        address indexed donor,
        uint256 indexed fundraiserId,
        address tokenIn,
        uint256 amountIn,
        uint256 amountOutUSDT
    );

    constructor(
        address _gateway,
        address _gasService,
        address _uniswapRouter,
        address _usdtToken,
        address _localFundraiserFactory
    ) AxelarExecutable(_gateway) Ownable(msg.sender) {
        gasService = IAxelarGasService(_gasService);
        uniswapRouter = IUniswapRouter(_uniswapRouter);
        usdtToken = IERC20(_usdtToken);
        localFundraiserFactory = _localFundraiserFactory;
    }

    function sendCrossChainDonation(
        string calldata destinationChain,
        uint256 fundraiserId,
        address tokenAddress,
        string calldata tokenSymbol,
        uint256 amount
    ) external payable nonReentrant {
        require(supportedChains[destinationChain], "Chain not supported");
        require(supportedTokens[destinationChain][tokenSymbol], "Token not supported");
        require(amount > 0, "Amount must be > 0");
        require(msg.value > 0, "Must send gas for cross-chain call");
        
        IERC20(tokenAddress).safeTransferFrom(msg.sender, address(this), amount);
        
        bytes memory payload = abi.encode(msg.sender, fundraiserId);
        
        string memory destinationContract = destinationContractAddresses[destinationChain];
        require(bytes(destinationContract).length > 0, "No destination contract");
        
        IERC20(tokenAddress).safeApprove(address(gateway()), amount);
        
        gasService.payNativeGasForContractCallWithToken{value: msg.value}(
            address(this),
            destinationChain,
            destinationContract,
            payload,
            tokenSymbol,
            amount,
            msg.sender
        );
        
        gateway().callContractWithToken(
            destinationChain,
            destinationContract,
            payload,
            tokenSymbol,
            amount
        );
        
        bytes32 transactionId = keccak256(abi.encodePacked(msg.sender, fundraiserId, amount, block.timestamp));
        donations[transactionId] = CrossChainDonation({
            donor: msg.sender,
            fundraiserId: fundraiserId,
            amount: amount,
            tokenSymbol: tokenSymbol,
            destinationChain: destinationChain,
            timestamp: block.timestamp
        });
        donorTransactions[msg.sender].push(transactionId);
        totalCrossChainDonations++;

        emit CrossChainDonationInitiated(
            transactionId, msg.sender, fundraiserId, amount, tokenSymbol, destinationChain
        );
    }

    // --- FUNCTION TO RECEIVE A DONATION ---

    function _executeWithToken(
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes calldata payload,
        string calldata tokenSymbol,
        uint256 amount
    ) internal override nonReentrant {
        (address donor, uint256 fundraiserId) = abi.decode(payload, (address, uint256));
        
        // Get the address of the token Axelar just sent us
        address tokenIn = gateway().tokenAddress(tokenSymbol);
        require(tokenIn != address(0), "Token not registered");
        require(tokenIn != address(usdtToken), "Donation is already USDT");

        // Approve Uniswap Router to spend the received token
        IERC20(tokenIn).safeApprove(address(uniswapRouter), amount);

        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = address(usdtToken);

        // Execute swap
        uint256[] memory amountsOut = uniswapRouter.swapExactTokensForTokens(
            amount,
            0,
            path,
            address(this), 
            block.timestamp
        );
        
        uint256 usdtAmountOut = amountsOut[amountsOut.length - 1];

        // Approve the factory to spend the USDT we just received
        usdtToken.safeTransfer(localFundraiserFactory, usdtAmountOut);

        // Call the factory to handle the final step
        (bool success, ) = localFundraiserFactory.call(
            abi.encodeWithSignature(
                "handleCrossChainDonation(address,uint256,uint256)",
                donor,
                fundraiserId,
                usdtAmountOut
            )
        );
        require(success, "Donation forwarding failed");

        totalCrossChainVolumeUSDT += usdtAmountOut;

        emit CrossChainDonationFinalized(
            sourceChain, donor, fundraiserId, tokenIn, amount, usdtAmountOut
        );
    }

    /**
     * @dev This function is required by AxelarExecutable.
     * We don't expect messages without tokens, so we revert.
     */
    function _execute(
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes calldata payload
    ) internal override {
        revert("Messages without tokens are not supported");
    }

    /**
     * @dev Add support for a new chain
     */
    function addSupportedChain(
        string calldata chain,
        address destinationContract
    ) external onlyOwner {
        require(!supportedChains[chain], "Chain already supported");
        require(destinationContract != address(0), "Invalid contract address");
        
        supportedChains[chain] = true;
        destinationContracts[chain] = destinationContract;
        
        emit ChainAdded(chain, destinationContract);
    }

    /**
     * @dev Remove support for a chain
     */
    function removeSupportedChain(string calldata chain) external onlyOwner {
        require(supportedChains[chain], "Chain not supported");
        
        supportedChains[chain] = false;
        delete destinationContracts[chain];
        
        emit ChainRemoved(chain);
    }

    /**
     * @dev Add support for a token on a specific chain
     */
    function addSupportedToken(
        string calldata chain,
        address token,
        string calldata symbol
    ) external onlyOwner {
        require(supportedChains[chain], "Chain not supported");
        require(!supportedTokens[chain][token], "Token already supported");
        require(token != address(0), "Invalid token address");
        
        supportedTokens[chain][token] = true;
        tokenSymbols[chain][token] = symbol;
        
        emit TokenAdded(chain, token, symbol);
    }

    /**
     * @dev Remove support for a token on a specific chain
     */
    function removeSupportedToken(
        string calldata chain,
        address token
    ) external onlyOwner {
        require(supportedTokens[chain][token], "Token not supported");
        
        supportedTokens[chain][token] = false;
        delete tokenSymbols[chain][token];
        
        emit TokenRemoved(chain, token);
    }

    /**
     * @dev Get donor's transaction history
     */
    function getDonorTransactions(address donor) 
        external 
        view 
        returns (bytes32[] memory) 
    {
        return donorTransactions[donor];
    }

    /**
     * @dev Get donation details
     */
    function getDonation(bytes32 transactionId) 
        external 
        view 
        returns (CrossChainDonation memory) 
    {
        return donations[transactionId];
    }

    /**
     * @dev Estimate gas cost for cross-chain donation
     */
    function estimateGasCost(
        string calldata destinationChain,
        address token,
        uint256 amount
    ) external view returns (uint256) {
        require(supportedChains[destinationChain], "Chain not supported");
        require(supportedTokens[destinationChain][token], "Token not supported");
        
        // This is a simplified estimation
        // In production, you would query Axelar's gas service for accurate estimates
        return 0.01 ether; // Example fixed cost
    }

    /**
     * @dev Emergency withdraw function (only owner)
     */
    function emergencyWithdraw(address token) external onlyOwner {
        if (token == address(0)) {
            payable(owner()).transfer(address(this).balance);
        } else {
            uint256 balance = IERC20(token).balanceOf(address(this));
            IERC20(token).safeTransfer(owner(), balance);
        }
    }

    /**
     * @dev Convert address to string
     */
    function _addressToString(address _addr) private pure returns (string memory) {
        bytes32 value = bytes32(uint256(uint160(_addr)));
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(42);
        str[0] = "0";
        str[1] = "x";
        for (uint256 i = 0; i < 20; i++) {
            str[2 + i * 2] = alphabet[uint8(value[i + 12] >> 4)];
            str[3 + i * 2] = alphabet[uint8(value[i + 12] & 0x0f)];
        }
        return string(str);
    }

    receive() external payable {}
}