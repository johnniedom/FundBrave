// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/ISwapRouter.sol";
import "./interfaces/ISwapAdapter.sol";
import "./Fundraiser.sol";
import "./StakingPool.sol";
import "./MorphoStakingPool.sol";

/**
 * @title FundraiserFactory (Multi-Chain Instance)
 * @dev Deploys EITHER an Aave or Morpho staking pool based on chain config.
 * It creates local Fundraiser and StakingPool contracts that
 * interact with this chain's native DeFi protocols.
 */
contract FundraiserFactory is AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant VERIFIED_CREATOR_ROLE = keccak256("VERIFIED_CREATOR_ROLE");
    using SafeERC20 for IERC20;
    
    Fundraiser[] private _fundraisers;
    
    mapping(address => Fundraiser[]) private _fundraisersByOwner;
    mapping(address => bool) public verifiedCreators;
    mapping(uint256 => bool) public activeFundraisers;
    
    string[] public availableCategories;
    
    address public immutable axelarGateway;
    address public immutable axelarGasService;
    ISwapAdapter public immutable swapAdapter;
    address public immutable USDT;
    address public immutable WETH;
    address public platformFeeRecipient;
    address public fundBraveBridge;
    address public immutable AAVE_POOL;
    address public immutable A_USDT;
    mapping(uint256 => address) public stakingPools;
    mapping(string => bool) private _categoryExists;
    address public immutable MORPHO_VAULT;
    uint8 public immutable stakingPoolType;
    
    uint256 public currentId;
    uint256 constant MAX_LIMIT = 20;
    uint256 public minGoal = 100 * 10**6; // 100 USDT (assuming 6 decimals)
    uint256 public maxGoal = 10000000 * 10**6; // 10M USDT
    uint256 public minDuration = 7 days;
    uint256 public maxDuration = 365 days;
    
    // Statistics
    uint256 public totalFundraisersCreated;
    uint256 public totalFundsRaised;
    uint256 public activeFundraiserCount;
    
    event FundraiserCreated(
        Fundraiser indexed fundraiser, 
        address indexed owner, 
        uint256 indexed id,
        string name,
        uint256 goal,
        uint256 deadline
    );
    event FundraiserDeactivated(uint256 indexed id, address indexed fundraiser);
    event CreatorVerified(address indexed creator);
    event CreatorUnverified(address indexed creator);
    event CategoryAdded(string category);
    event PlatformFeeRecipientUpdated(address indexed oldRecipient, address indexed newRecipient);
    event BridgeUpdated(address indexed newBridge);
    event StakingPoolCreated(uint256 indexed fundraiserId, address indexed poolAddress);

    constructor(
        address _axelarGateway,
        address _axelarGasService,
        address _swapAdapter,
        address _usdt,
        address _weth,
        address _platformFeeRecipient,
        address _fundBraveBridge,
        address _aavePool,
        address _aUsdt,
        address _morphoVault,
        uint8 _stakingPoolType
    ) {
        require(_axelarGateway != address(0), "Invalid Axelar Gateway");
        require(_axelarGasService != address(0), "Invalid Axelar Gas Service");
        require(_swapAdapter != address(0), "Invalid swap Adapter");
        require(_usdt != address(0), "Invalid USDT address");
        require(_platformFeeRecipient != address(0), "Invalid platform fee recipient");
        
        axelarGateway = _axelarGateway;
        axelarGasService = _axelarGasService;
        swapAdapter = ISwapAdapter(_swapAdapter);
        USDT = _usdt;
        WETH = IUniswapRouter(_uniswapRouter).WETH();
        platformFeeRecipient = _platformFeeRecipient;
        fundBraveBridge = _fundBraveBridge;
        AAVE_POOL = _aavePool;
        A_USDT = _aUsdt;
        MORPHO_VAULT = _morphoVault;
        stakingPoolType = _stakingPoolType;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        
        // Initialize default categories
        _addCategory("Medical");
        _addCategory("Education");
        _addCategory("Emergency");
        _addCategory("Community");
        _addCategory("Environment");
        _addCategory("Technology");
        _addCategory("Arts");
        _addCategory("Sports");
    }

    modifier onlyBridge() {
        require(msg.sender == fundBraveBridge, "Factory: Caller is not the bridge");
        _;
    }

    function createFundraiser(
        string memory name,
        string[] memory images,
        string[] memory categories,
        string memory description,
        string memory region,
        address payable beneficiary,
        uint256 goal,
        uint256 durationInDays
    ) external nonReentrant whenNotPaused returns (address) {
        require(bytes(name).length > 0 && bytes(name).length <= 100, "Invalid name length");
        require(images.length > 0 && images.length <= 10, "Invalid number of images");
        require(categories.length > 0 && categories.length <= 5, "Invalid number of categories");
        require(bytes(description).length > 0 && bytes(description).length <= 5000, "Invalid description length");
        require(beneficiary != address(0), "Invalid beneficiary");
        require(goal >= minGoal && goal <= maxGoal, "Goal outside allowed range");
        require(durationInDays >= minDuration / 1 days && durationInDays <= maxDuration / 1 days, "Duration outside allowed range");
        
        // Validate categories
        for (uint256 i = 0; i < categories.length; i++) {
            require(_categoryExists[categories[i]], "Invalid category");
        }
        
        uint256 deadline = block.timestamp + (durationInDays * 1 days);
        
        Fundraiser fundraiser = new Fundraiser(
            currentId,
            name,
            images,
            categories,
            description,
            region,
            beneficiary,
            msg.sender,
            goal,
            deadline,
            USDT,
            platformFeeRecipient,
            address(this)
        );
        
        _fundraisers.push(fundraiser);
        _fundraisersByOwner[msg.sender].push(fundraiser);

        address poolAddress;
        if (stakingPoolType == 0) {
            require(AAVE_POOL != address(0), "Factory: Aave not configured");
            StakingPool pool = new StakingPool(
                AAVE_POOL,
                USDT,
                A_USDT,
                beneficiary,
                platformFeeRecipient,
                address(this),
                msg.sender
            );
            poolAddress = address(pool);
        } else if (stakingPoolType == 1) {
            require(MORPHO_VAULT != address(0), "Factory: Morpho not configured");
            MorphoStakingPool pool = new MorphoStakingPool(
                MORPHO_VAULT,
                USDT,
                beneficiary,
                platformFeeRecipient,
                address(this),
                msg.sender
            );
            poolAddress = address(pool);
        } else {
            revert("Factory: Invalid staking pool type");
        }

        stakingPools[currentId] = address(pool);
        activeFundraisers[currentId] = true;
        
        totalFundraisersCreated++;
        activeFundraiserCount++;
        
        emit FundraiserCreated(fundraiser, msg.sender, currentId, name, goal, deadline);
        emit StakingPoolCreated(currentId, address(pool));
        
        currentId++;
        return address(fundraiser);
    }

    function createVerifiedFundraiser(
        string memory name,
        string[] memory images,
        string[] memory categories,
        string memory description,
        string memory region,
        address payable beneficiary,
        uint256 goal,
        uint256 durationInDays
    ) external onlyRole(VERIFIED_CREATOR_ROLE) nonReentrant whenNotPaused returns (address) {
        // Verified creators can bypass some restrictions
        require(bytes(name).length > 0, "Invalid name");
        require(images.length > 0, "No images provided");
        require(categories.length > 0, "No categories provided");
        require(beneficiary != address(0), "Invalid beneficiary");
        require(goal > 0, "Goal must be greater than 0");
        
        uint256 deadline = block.timestamp + (durationInDays * 1 days);
        
        Fundraiser fundraiser = new Fundraiser(
            currentId,
            name,
            images,
            categories,
            description,
            region,
            beneficiary,
            msg.sender,
            goal,
            deadline,
            USDT,
            platformFeeRecipient,
            address(this)
        );

        address poolAddress;
        if (stakingPoolType == 0) {
            require(AAVE_POOL != address(0), "Factory: Aave not configured");
            StakingPool pool = new StakingPool(
                AAVE_POOL,
                USDT,
                A_USDT,
                beneficiary,
                platformFeeRecipient,
                address(this),
                msg.sender
            );
            poolAddress = address(pool);
        } else if (stakingPoolType == 1) {
            require(MORPHO_VAULT != address(0), "Factory: Morpho not configured");
            MorphoStakingPool pool = new MorphoStakingPool(
                MORPHO_VAULT,
                USDT,
                beneficiary,
                platformFeeRecipient,
                address(this),
                msg.sender
            );
            poolAddress = address(pool);
        } else {
            revert("Factory: Invalid staking pool type");
        }
        
        _fundraisers.push(fundraiser);
        stakingPools[currentId] = address(pool);
        _fundraisersByOwner[msg.sender].push(fundraiser);
        activeFundraisers[currentId] = true;
        
        totalFundraisersCreated++;
        activeFundraiserCount++;
        
        emit FundraiserCreated(fundraiser, msg.sender, currentId, name, goal, deadline);
        emit StakingPoolCreated(currentId, address(pool));
        
        currentId++;
        return address(fundraiser);
    }

    function stakeNative(uint256 fundraiserId) external payable nonReentrant whenNotPaused {
        require(msg.value > 0, "Value must be > 0");
        address poolAddress = stakingPools[fundraiserId];
        require(poolAddress != address(0), "No staking pool");

        uint256 usdtAmount = _swapNativeToUSDT(msg.value);

        USDT.safeTransfer(poolAddress, usdtAmount);
        StakingPool(poolAddress).depositFor(msg.sender, usdtAmount);
    }

    function stakeERC20(uint256 fundraiserId, address token, uint256 amount) 
        external 
        nonReentrant
        whenNotPaused
    {
        address poolAddress = stakingPools[fundraiserId];
        require(poolAddress != address(0), "No staking pool");
        
        // 1. Pull token
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        // 2. Swap to USDT
        uint256 usdtAmount = _swapToUSDT(token, amount);

        // 3. Transfer USDT to pool and call depositFor
        USDT.safeTransfer(poolAddress, usdtAmount);
        StakingPool(poolAddress).depositFor(msg.sender, usdtAmount);
    }
    
    function _swapToUSDT(address tokenIn, uint256 amountIn) 
        private 
        returns (uint256) 
    {
        if (tokenIn == USDT) return amountIn;

        IERC20(tokenIn).safeApprove(address(swapAdapter), amountIn);

        return swapAdapter.swapToUSDT(tokenIn, amountIn);
    }

    function _swapNativeToUSDT(uint256 amountIn) private returns (uint256) {
        return swapAdapter.swapNativeToUSDT{value: amountIn}();
    }


    /**
     * @dev Handles a processed cross-chain donation from the FundBraveBridge.
     * The bridge has already swapped the token to USDT.
     * This function finds the correct fundraiser and credits the donation.
     */
    function handleCrossChainDonation(
        address donor,
        uint256 fundraiserId,
        uint256 usdtAmount
    ) external nonReentrant whenNotPaused onlyBridge {
        require(fundraiserId < _fundraisers.length, "Factory: Invalid fundraiser ID");
        
        Fundraiser fundraiser = _fundraisers[fundraiserId];

        IERC20(USDT).safeTransfer(address(fundraiser), usdtAmount);
        
        fundraiser.creditDonation(donor, usdtAmount, "cross-chain");
        
        totalFundsRaised += usdtAmount;
    }

    function handleCrossChainStake(
        address donor,
        uint256 fundraiserId,
        uint256 usdtAmount
    ) external nonReentrant whenNotPaused onlyBridge {
        address poolAddress = stakingPools[fundraiserId];
        require(poolAddress != address(0), "No staking pool");

        USDT.safeTransfer(poolAddress, usdtAmount);
        StakingPool(poolAddress).depositFor(donor, usdtAmount);
    }

    /**
     * @dev Donate native currency to a fundraiser.
     * Swaps to USDT and forwards it.
     */
    function donateNative(uint256 fundraiserId)
        external
        payable
        nonReentrant
        whenNotPaused
    {
        require(fundraiserId < _fundraisers.length, "Invalid ID");
        Fundraiser fundraiser = _fundraisers[fundraiserId];
        uint256 usdtAmount = _swapNativeToUSDT(msg.value);
        USDT.safeTransfer(address(fundraiser), usdtAmount);
        fundraiser.creditDonation(msg.sender, usdtAmount, "native-local");
        totalFundsRaised += usdtAmount;
    }

    /**
     * @dev Donate any ERC20 token to a fundraiser.
     * Swaps the token to USDT (if needed) and forwards it.
     */
    function donateERC20(
        uint256 fundraiserId,
        address token,
        uint256 amount
    ) external nonReentrant whenNotPaused {
        require(amount > 0, "Factory: Amount must be > 0");
        require(fundraiserId < _fundraisers.length, "Factory: Invalid fundraiser ID");
        
        Fundraiser fundraiser = _fundraisers[fundraiserId];
        
        // Pull the tokens from the donor
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        uint256 usdtAmount;
        if (token == USDT) {
            usdtAmount = amount;
        } else {
            usdtAmount = _swapToUSDT(token, amount);
        }

        // Transfer the final USDT to the fundraiser contract
        IERC20(USDT).safeTransfer(address(fundraiser), usdtAmount);

        // Credit the donation on the fundraiser contract
        fundraiser.creditDonation(msg.sender, usdtAmount, "erc20-local");
        
        // Update factory stats
        totalFundsRaised += usdtAmount;
    }

    // ===== QUERY FUNCTIONS =====

    function fundraisersCount() public view returns (uint256) {
        return _fundraisers.length;
    }

    function fundraisers(uint256 limit, uint256 offset) 
        external 
        view
        returns (Fundraiser[] memory coll)
    {
        require(offset <= fundraisersCount(), "Offset out of bounds");
        
        uint256 size = fundraisersCount() - offset;
        size = size < limit ? size : limit;
        size = size < MAX_LIMIT ? size : MAX_LIMIT;
        
        coll = new Fundraiser[](size);
        
        for (uint256 i = 0; i < size; i++) {
            coll[i] = _fundraisers[offset + i];
        }
        
        return coll;
    }

    function fundraisersByOwner(address owner) 
        external 
        view 
        returns (Fundraiser[] memory) 
    {
        return _fundraisersByOwner[owner];
    }

    function _activeFundraisers() external view returns (Fundraiser[] memory) {
        uint256 activeCount = 0;
        
        // Count active fundraisers
        for (uint256 i = 0; i < _fundraisers.length; i++) {
            if (activeFundraisers[i]) {
                activeCount++;
            }
        }
        
        Fundraiser[] memory active = new Fundraiser[](activeCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 0; i < _fundraisers.length; i++) {
            if (activeFundraisers[i]) {
                active[currentIndex] = _fundraisers[i];
                currentIndex++;
            }
        }
        
        return active;
    }

    function getFundraiserById(uint256 id) external view returns (Fundraiser) {
        require(id < _fundraisers.length, "Fundraiser does not exist");
        return _fundraisers[id];
    }

    function searchFundraisersByCategory(string memory category) 
        external 
        view 
        returns (Fundraiser[] memory) 
    {
        require(_categoryExists[category], "Category does not exist");
        
        uint256 count = 0;
        
        // First pass: count matches
        for (uint256 i = 0; i < _fundraisers.length; i++) {
            string[] memory fundraiserCategories = _fundraisers[i].getCategories();
            for (uint256 j = 0; j < fundraiserCategories.length; j++) {
                if (keccak256(bytes(fundraiserCategories[j])) == keccak256(bytes(category))) {
                    count++;
                    break;
                }
            }
        }
        
        // Second pass: populate array
        Fundraiser[] memory results = new Fundraiser[](count);
        uint256 currentIndex = 0;
        
        for (uint256 i = 0; i < _fundraisers.length; i++) {
            string[] memory fundraiserCategories = _fundraisers[i].getCategories();
            for (uint256 j = 0; j < fundraiserCategories.length; j++) {
                if (keccak256(bytes(fundraiserCategories[j])) == keccak256(bytes(category))) {
                    results[currentIndex] = _fundraisers[i];
                    currentIndex++;
                    break;
                }
            }
        }
        
        return results;
    }

    function searchFundraisersByRegion(string memory region) 
        external 
        view 
        returns (Fundraiser[] memory) 
    {
        uint256 count = 0;
        
        // First pass: count matches
        for (uint256 i = 0; i < _fundraisers.length; i++) {
            if (keccak256(bytes(_fundraisers[i].region())) == keccak256(bytes(region))) {
                count++;
            }
        }
        
        // Second pass: populate array
        Fundraiser[] memory results = new Fundraiser[](count);
        uint256 currentIndex = 0;
        
        for (uint256 i = 0; i < _fundraisers.length; i++) {
            if (keccak256(bytes(_fundraisers[i].region())) == keccak256(bytes(region))) {
                results[currentIndex] = _fundraisers[i];
                currentIndex++;
            }
        }
        
        return results;
    }

    function getAvailableCategories() external view returns (string[] memory) {
        return availableCategories;
    }

    function getPlatformStats() external view returns (
        uint256 _totalFundraisersCreated,
        uint256 _activeFundraiserCount,
        uint256 _totalFundsRaised
    ) {
        return (
            totalFundraisersCreated,
            activeFundraiserCount,
            totalFundsRaised
        );
    }

    // ===== ADMIN FUNCTIONS =====

    function addCategory(string memory category) external onlyRole(ADMIN_ROLE) {
        _addCategory(category);
    }

    function _addCategory(string memory category) private {
        require(!_categoryExists[category], "Category already exists");
        require(bytes(category).length > 0 && bytes(category).length <= 50, "Invalid category length");
        
        availableCategories.push(category);
        _categoryExists[category] = true;
        
        emit CategoryAdded(category);
    }

    function verifyCreator(address creator) external onlyRole(ADMIN_ROLE) {
        require(!verifiedCreators[creator], "Already verified");
        
        verifiedCreators[creator] = true;
        _grantRole(VERIFIED_CREATOR_ROLE, creator);
        
        emit CreatorVerified(creator);
    }

    function unverifyCreator(address creator) external onlyRole(ADMIN_ROLE) {
        require(verifiedCreators[creator], "Not verified");
        
        verifiedCreators[creator] = false;
        _revokeRole(VERIFIED_CREATOR_ROLE, creator);
        
        emit CreatorUnverified(creator);
    }

    function deactivateFundraiser(uint256 id) external onlyRole(ADMIN_ROLE) {
        require(id < _fundraisers.length, "Fundraiser does not exist");
        require(activeFundraisers[id], "Already inactive");
        
        activeFundraisers[id] = false;
        activeFundraiserCount--;
        
        emit FundraiserDeactivated(id, address(_fundraisers[id]));
    }

    function updateMinGoal(uint256 newMinGoal) external onlyRole(ADMIN_ROLE) {
        require(newMinGoal > 0 && newMinGoal < maxGoal, "Invalid min goal");
        minGoal = newMinGoal;
    }

    function updateMaxGoal(uint256 newMaxGoal) external onlyRole(ADMIN_ROLE) {
        require(newMaxGoal > minGoal, "Invalid max goal");
        maxGoal = newMaxGoal;
    }

    function updateDurationLimits(uint256 newMinDuration, uint256 newMaxDuration) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        require(newMinDuration > 0 && newMinDuration < newMaxDuration, "Invalid duration limits");
        minDuration = newMinDuration;
        maxDuration = newMaxDuration;
    }

    function updatePlatformFeeRecipient(address newRecipient) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        require(newRecipient != address(0), "Invalid address");
        address oldRecipient = platformFeeRecipient;
        platformFeeRecipient = newRecipient;
        
        emit PlatformFeeRecipientUpdated(oldRecipient, newRecipient);
    }

    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    function updateBridge(address _newBridge) external onlyRole(ADMIN_ROLE) {
        require(_newBridge != address(0), "Invalid bridge address");
        fundBraveBridge = _newBridge;
        emit BridgeUpdated(_newBridge);
    }
}