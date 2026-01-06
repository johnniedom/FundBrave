// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/ISwapAdapter.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// Interface for the CoW Protocol Vault Relayer/Batcher
interface ICowBatcher {
    function sell(
        address sellToken,
        address buyToken,
        uint256 sellAmount,
        uint256 minBuyAmount,
        uint32 validTo,
        bytes32 appData,
        uint256 feeAmount
    ) external returns (uint256 buyAmount);
}


interface IWeth {
    function deposit() external payable;
    function withdraw(uint256 amount) external;
}

/**
 * @title CowSwapAdapter
 * @dev Implements ISwapAdapter by routing swaps through the CoW Protocol Batcher.
 * This provides MEV protection and price aggregation.
 */
contract CowSwapAdapter is ISwapAdapter, Ownable {
    using SafeERC20 for IERC20;

    ICowBatcher public immutable cowBatcher;
    address public immutable USDC;
    address public immutable WETH;

    // We can define a default slippage tolerance and order validity here
    uint256 public constant DEFAULT_SLIPPAGE_BPS = 50; // 0.5%
    uint32 public constant ORDER_VALIDITY_SECONDS = 300; // 5 minutes

    constructor(
        address _cowBatcher,
        address _usdc,
        address _weth,
        address _owner
    ) Ownable(_owner) {
        cowBatcher = ICowBatcher(_cowBatcher);
        USDC = _usdc;
        WETH = _weth;

        IERC20(USDC).forceApprove(address(cowBatcher), type(uint256).max);
    }

    /**
     * @dev Swaps an ERC20 token to USDT (USDC in this implementation) via CoW Swap.
     * Requires prior approval of the sellToken to the Batcher.
     * Note: In this architecture, the FundBraveBridge/Factory handles the approval.
     */
    function swapToUSDT(address tokenIn, uint256 amountIn)
        external
        override
        returns (uint256 usdcAmountOut)
    {
        if (tokenIn == USDC) return amountIn;

        IERC20(tokenIn).safeTransferFrom(msg.sender, address(cowBatcher), amountIn);

        uint256 minBuyAmount = _applySlippage(amountIn, DEFAULT_SLIPPAGE_BPS);

        usdcAmountOut = cowBatcher.sell(
            tokenIn, 
            USDC, 
            amountIn, 
            minBuyAmount, 
            uint32(block.timestamp + ORDER_VALIDITY_SECONDS), 
            bytes32(0),
            0
        );
        
        return usdcAmountOut;
    }

    /**
     * @dev Swaps native ETH/MATIC to USDT (USDC) via CoW Swap.
     */
    function swapNativeToUSDT()
        external
        payable
        override
        returns (uint256 usdcAmountOut)
    {
        IWeth(WETH).deposit{value: msg.value}();
        IERC20(WETH).forceApprove(address(cowBatcher), msg.value);

        // Estimate: 1 ETH ~ 2000 USDC (Mock calculation for slippage base)
        // In prod, you might use an oracle or rely on the batcher's best execution
        uint256 estimate = (msg.value * 2000 * 10**6) / 1e18; 
        uint256 minBuyAmount = _applySlippage(estimate, DEFAULT_SLIPPAGE_BPS * 4);
        
        usdcAmountOut = cowBatcher.sell(
            WETH, 
            USDC, 
            msg.value, 
            minBuyAmount, 
            uint32(block.timestamp + ORDER_VALIDITY_SECONDS), 
            bytes32(0),
            0
        );
        
        // Refund dust WETH if any remains
        uint256 remainingWeth = IERC20(WETH).balanceOf(address(this));
        if (remainingWeth > 0) {
            IWeth(WETH).withdraw(remainingWeth);
            (bool success, ) = msg.sender.call{value: remainingWeth}("");
            require(success, "ETH Refund failed");
        }

        return usdcAmountOut;
    }
    
    function _applySlippage(uint256 amount, uint256 bps) private pure returns (uint256) {
        return amount * (10000 - bps) / 10000;
    }
}