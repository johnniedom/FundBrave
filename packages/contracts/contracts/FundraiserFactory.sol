// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "./interfaces/ISwapAdapter.sol";

import { Fundraiser } from "./Fundraiser.sol";
import { StakingPool } from "./StakingPool.sol";
import { MorphoStakingPool } from "./MorphoStakingPool.sol";
import { WealthBuildingDonation } from "./WealthBuildingDonation.sol";
import { ImpactDAOPool } from "./ImpactDAOPool.sol";
import { PlatformTreasury } from "./PlatformTreasury.sol";

interface IWorldID {
    function verifyProof(
        uint256 root,
        uint256 groupID,
        uint256 signal,
        uint256 nullifierHash,
        uint256 externalNullifier,
        uint256[8] calldata proof
    ) external view;
}

/**
 * @title FundraiserFactory
 * @author FundBrave Team
 * @notice Factory contract for deploying and managing fundraiser campaigns
 * @dev Uses Clones for Fundraiser and StakingPool to minimize contract size.
 *      MorphoStakingPool is currently deployed normally (not cloned).
 *      Integrates WealthBuildingDonation and ImpactDAOPool mechanisms.
 */
contract FundraiserFactory is AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant VERIFIED_CREATOR_ROLE = keccak256("VERIFIED_CREATOR_ROLE");
    using SafeERC20 for IERC20;
    using Clones for address;

    // ============ Custom Errors ============

    /// @notice Thrown when an invalid fundraiser ID is provided
    error InvalidFundraiserId();

    /// @notice Thrown when amount is zero or invalid
    error InvalidAmount();

    /// @notice Thrown when address is zero
    error ZeroAddress();


    // ============ Implementations for Clones ============

    address public immutable fundraiserImplementation;
    address public immutable stakingPoolImplementation;

    // ============ State Variables ============

    Fundraiser[] private _fundraisers;
    mapping(address => Fundraiser[]) private _fundraisersByOwner;
    mapping(address => bool) public verifiedCreators;
    mapping(uint256 => bool) public activeFundraisers;
    mapping(uint256 => address) public stakingPools;

    string[] public availableCategories;
    mapping(string => bool) private _categoryExists;

    // ============ Core Configuration ============

    ISwapAdapter public immutable swapAdapter;
    address public immutable USDC;
    address public immutable WETH;
    address public platformFeeRecipient;
    address public fundBraveBridge;
    address public receiptOFT;
    address public fbtToken;

    // ============ New Contract References ============

    /// @notice WealthBuildingDonation contract for 80/20 donation split mechanism
    WealthBuildingDonation public wealthBuildingDonation;

    /// @notice ImpactDAOPool contract for shared treasury staking
    ImpactDAOPool public impactDAOPool;

    /// @notice PlatformTreasury contract that receives platform fees
    PlatformTreasury public platformTreasury;

    // ============ Yield Configuration ============

    address public immutable AAVE_POOL;
    address public immutable A_USDC;
    address public immutable MORPHO_VAULT;
    uint8 public immutable stakingPoolType;

    // ============ World ID Configuration ============

    IWorldID public worldId;
    uint256 public immutable appId;
    uint256 public immutable actionId;
    mapping(uint256 => bool) internal nullifierHashes;

    // ============ Limits & Stats ============

    uint256 public currentId;
    uint256 constant MAX_LIMIT = 20;
    uint256 public minGoal = 100 * 10**6;
    uint256 public maxGoal = 10000000 * 10**6;
    uint256 public minDuration = 7 days;
    uint256 public maxDuration = 365 days;

    uint256 public totalFundraisersCreated;
    uint256 public totalFundsRaised;
    uint256 public activeFundraiserCount;

    // ============ Events ============

    event FundraiserCreated(address indexed fundraiser, address indexed owner, uint256 indexed id, string name, uint256 goal, uint256 deadline);
    event StakingPoolCreated(uint256 indexed fundraiserId, address indexed poolAddress);
    event FundraiserDeactivated(uint256 indexed id, address indexed fundraiser);
    event CreatorVerified(address indexed creator);
    event CreatorUnverified(address indexed creator);
    event CategoryAdded(string category);
    event PlatformFeeRecipientUpdated(address indexed oldRecipient, address indexed newRecipient);
    event BridgeUpdated(address indexed newBridge);
    event ReceiptOFTUpdated(address indexed newReceiptOFT);
    event FBTUpdated(address indexed newFBT);

    /// @notice Emitted when a wealth-building donation is made
    event WealthBuildingDonationMade(
        address indexed donor,
        uint256 indexed fundraiserId,
        uint256 totalAmount,
        uint256 directAmount,
        uint256 endowmentAmount
    );

    /// @notice Emitted when WealthBuildingDonation contract is updated
    event WealthBuildingDonationUpdated(address indexed newAddress);

    /// @notice Emitted when ImpactDAOPool contract is updated
    event ImpactDAOPoolUpdated(address indexed newAddress);

    /// @notice Emitted when PlatformTreasury contract is updated
    event PlatformTreasuryUpdated(address indexed newAddress);

    // ============ Constructor ============

    constructor(
        address _fundraiserImplementation,
        address _stakingPoolImplementation,
        address _swapAdapter,
        address _usdc,
        address _weth,
        address _platformFeeRecipient,
        address _aavePool,
        address _aUsdc,
        address _morphoVault,
        uint8 _stakingPoolType,
        address _worldId,
        string memory _appId,
        string memory _actionId
    ) {
        require(_fundraiserImplementation != address(0), "Invalid impl");
        require(_stakingPoolImplementation != address(0), "Invalid impl");

        fundraiserImplementation = _fundraiserImplementation;
        stakingPoolImplementation = _stakingPoolImplementation;

        swapAdapter = ISwapAdapter(_swapAdapter);
        USDC = _usdc;
        WETH = _weth;
        platformFeeRecipient = _platformFeeRecipient;

        AAVE_POOL = _aavePool;
        A_USDC = _aUsdc;
        MORPHO_VAULT = _morphoVault;
        stakingPoolType = _stakingPoolType;

        worldId = IWorldID(_worldId);
        appId = uint256(keccak256(abi.encodePacked(_appId))) % 21888242871839275222246405745257275088548364400416034343698204186575808495617;
        actionId = uint256(keccak256(abi.encodePacked(_actionId))) % 21888242871839275222246405745257275088548364400416034343698204186575808495617;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);

        _addCategory("Medical");
        _addCategory("Education");
        _addCategory("Emergency");
        _addCategory("Community");
        _addCategory("Environment");
        _addCategory("Technology");
        _addCategory("Arts");
        _addCategory("Sports");
    }

    // ============ Modifiers ============

    modifier onlyBridge() {
        require(msg.sender == fundBraveBridge, "Factory: Caller is not the bridge");
        _;
    }

    // ============ Configuration Setters ============

    /**
     * @notice Sets the ReceiptOFT contract address
     * @param _receiptOFT Address of the ReceiptOFT contract
     */
    function setReceiptOFT(address _receiptOFT) external onlyRole(ADMIN_ROLE) {
        receiptOFT = _receiptOFT;
        emit ReceiptOFTUpdated(_receiptOFT);
    }

    /**
     * @notice Sets the FBT token address
     * @param _fbt Address of the FundBraveToken contract
     */
    function setFBT(address _fbt) external onlyRole(ADMIN_ROLE) {
        require(_fbt != address(0), "Invalid FBT address");
        fbtToken = _fbt;
        emit FBTUpdated(_fbt);
    }

    /**
     * @notice Sets the WealthBuildingDonation contract address
     * @param _wealthBuildingDonation Address of the WealthBuildingDonation contract
     */
    function setWealthBuildingDonation(address _wealthBuildingDonation) external onlyRole(ADMIN_ROLE) {
        if (_wealthBuildingDonation == address(0)) revert ZeroAddress();
        wealthBuildingDonation = WealthBuildingDonation(_wealthBuildingDonation);
        emit WealthBuildingDonationUpdated(_wealthBuildingDonation);
    }

    /**
     * @notice Sets the ImpactDAOPool contract address
     * @param _impactDAOPool Address of the ImpactDAOPool contract
     */
    function setImpactDAOPool(address _impactDAOPool) external onlyRole(ADMIN_ROLE) {
        if (_impactDAOPool == address(0)) revert ZeroAddress();
        impactDAOPool = ImpactDAOPool(_impactDAOPool);
        emit ImpactDAOPoolUpdated(_impactDAOPool);
    }

    /**
     * @notice Sets the PlatformTreasury contract address
     * @param _platformTreasury Address of the PlatformTreasury contract
     */
    function setPlatformTreasury(address _platformTreasury) external onlyRole(ADMIN_ROLE) {
        if (_platformTreasury == address(0)) revert ZeroAddress();
        platformTreasury = PlatformTreasury(_platformTreasury);
        emit PlatformTreasuryUpdated(_platformTreasury);
    }

    // ============ Fundraiser Creation ============

    /**
     * @notice Creates a new fundraiser with World ID verification
     * @param name Name of the fundraiser
     * @param images Array of image URLs
     * @param categories Array of category strings
     * @param description Description of the fundraiser
     * @param region Geographic region
     * @param beneficiary Address to receive funds
     * @param goal Funding goal in USDC (6 decimals)
     * @param durationInDays Duration of the campaign
     * @param root World ID merkle root
     * @param nullifierHash World ID nullifier hash
     * @param proof World ID ZK proof
     * @return Address of the created fundraiser
     */
    function createFundraiser(
        string memory name,
        string[] memory images,
        string[] memory categories,
        string memory description,
        string memory region,
        address payable beneficiary,
        uint256 goal,
        uint256 durationInDays,
        uint256 root,
        uint256 nullifierHash,
        uint256[8] calldata proof
    ) external nonReentrant whenNotPaused returns (address) {
        if (address(worldId) != address(0)) {
            if (nullifierHashes[nullifierHash]) revert("WorldID: Already used");
            worldId.verifyProof(
                root,
                1,
                uint256(keccak256(abi.encodePacked(msg.sender))),
                nullifierHash,
                uint256(keccak256(abi.encodePacked(appId, actionId))),
                proof
            );
            nullifierHashes[nullifierHash] = true;
        }

        _validateFundraiserParams(name, images, categories, description, beneficiary, goal, durationInDays);
        uint256 deadline = block.timestamp + (durationInDays * 1 days);

        // Clone deployment for Fundraiser
        address clone = fundraiserImplementation.clone();

        // Determine fee recipient: use platformTreasury if set, otherwise fallback
        address feeRecipient = address(platformTreasury) != address(0)
            ? address(platformTreasury)
            : platformFeeRecipient;

        Fundraiser(clone).initialize(
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
            USDC,
            feeRecipient,
            address(this)
        );

        Fundraiser fundraiser = Fundraiser(clone);
        _fundraisers.push(fundraiser);
        _fundraisersByOwner[msg.sender].push(fundraiser);

        // Deploy staking pool for the fundraiser
        address poolAddress = _deployStakingPool(beneficiary);
        stakingPools[currentId] = poolAddress;
        activeFundraisers[currentId] = true;

        totalFundraisersCreated++;
        activeFundraiserCount++;

        emit FundraiserCreated(address(fundraiser), msg.sender, currentId, name, goal, deadline);
        emit StakingPoolCreated(currentId, poolAddress);

        currentId++;
        return address(fundraiser);
    }

    /**
     * @notice Creates a fundraiser for verified creators (no World ID required)
     * @dev Only callable by addresses with VERIFIED_CREATOR_ROLE
     */
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
        require(bytes(name).length > 0, "Invalid name");
        require(beneficiary != address(0), "Invalid beneficiary");
        require(goal > 0, "Goal must be > 0");

        uint256 deadline = block.timestamp + (durationInDays * 1 days);

        address clone = fundraiserImplementation.clone();

        // Determine fee recipient: use platformTreasury if set, otherwise fallback
        address feeRecipient = address(platformTreasury) != address(0)
            ? address(platformTreasury)
            : platformFeeRecipient;

        Fundraiser(clone).initialize(
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
            USDC,
            feeRecipient,
            address(this)
        );

        Fundraiser fundraiser = Fundraiser(clone);
        _fundraisers.push(fundraiser);
        _fundraisersByOwner[msg.sender].push(fundraiser);

        address poolAddress = _deployStakingPool(beneficiary);
        stakingPools[currentId] = poolAddress;
        activeFundraisers[currentId] = true;

        totalFundraisersCreated++;
        activeFundraiserCount++;

        emit FundraiserCreated(address(fundraiser), msg.sender, currentId, name, goal, deadline);
        emit StakingPoolCreated(currentId, poolAddress);

        currentId++;
        return address(fundraiser);
    }

    // ============ Internal Functions ============

    function _validateFundraiserParams(
        string memory name,
        string[] memory images,
        string[] memory categories,
        string memory description,
        address beneficiary,
        uint256 goal,
        uint256 durationInDays
    ) internal view {
        require(bytes(name).length > 0 && bytes(name).length <= 100, "Invalid name length");
        require(images.length > 0 && images.length <= 10, "Invalid number of images");
        require(categories.length > 0 && categories.length <= 5, "Invalid number of categories");
        require(bytes(description).length > 0 && bytes(description).length <= 5000, "Invalid description length");
        require(beneficiary != address(0), "Invalid beneficiary");
        require(goal >= minGoal && goal <= maxGoal, "Goal outside allowed range");
        require(durationInDays >= minDuration / 1 days && durationInDays <= maxDuration / 1 days, "Duration outside allowed range");
        for (uint256 i = 0; i < categories.length; i++) {
            require(_categoryExists[categories[i]], "Invalid category");
        }
    }

    /**
     * @notice Deploys a staking pool for a fundraiser
     * @dev Uses either Aave StakingPool (cloned) or MorphoStakingPool based on configuration
     * @param beneficiary Address of the fundraiser beneficiary
     * @return Address of the deployed staking pool
     */
    function _deployStakingPool(address beneficiary) internal returns (address) {
        // Determine fee recipient: use platformTreasury if set, otherwise fallback
        address feeRecipient = address(platformTreasury) != address(0)
            ? address(platformTreasury)
            : platformFeeRecipient;

        if (stakingPoolType == 0) {
            // Clone deployment for Aave StakingPool
            require(AAVE_POOL != address(0), "Factory: Aave not configured");
            address pool = stakingPoolImplementation.clone();
            StakingPool(pool).initialize(
                AAVE_POOL,
                USDC,
                A_USDC,
                receiptOFT,
                fbtToken,
                payable(beneficiary),
                feeRecipient,
                address(this),
                msg.sender
            );
            return pool;
        } else if (stakingPoolType == 1) {
            // Standard deployment for Morpho
            require(MORPHO_VAULT != address(0), "Factory: Morpho not configured");
            MorphoStakingPool pool = new MorphoStakingPool(
                MORPHO_VAULT,
                USDC,
                fbtToken,
                payable(beneficiary),
                feeRecipient,
                address(this),
                msg.sender
            );
            return address(pool);
        } else {
            revert("Factory: Invalid staking pool type");
        }
    }

    // ============ Staking Functions ============

    /**
     * @notice Stakes native currency (ETH) into a fundraiser's staking pool
     * @param fundraiserId ID of the fundraiser to stake in
     */
    function stakeNative(uint256 fundraiserId) external payable nonReentrant whenNotPaused {
        require(msg.value > 0, "Value must be > 0");
        address poolAddress = stakingPools[fundraiserId];
        require(poolAddress != address(0), "No staking pool");
        uint256 usdcAmount = _swapNativeToUSDC(msg.value);
        IERC20(USDC).safeTransfer(poolAddress, usdcAmount);
        if (stakingPoolType == 0) {
            StakingPool(poolAddress).depositFor(msg.sender, usdcAmount);
        } else {
            MorphoStakingPool(poolAddress).depositFor(msg.sender, usdcAmount);
        }
    }

    /**
     * @notice Stakes ERC20 tokens into a fundraiser's staking pool
     * @param fundraiserId ID of the fundraiser to stake in
     * @param token Address of the ERC20 token to stake
     * @param amount Amount of tokens to stake
     */
    function stakeERC20(uint256 fundraiserId, address token, uint256 amount) external nonReentrant whenNotPaused {
        address poolAddress = stakingPools[fundraiserId];
        require(poolAddress != address(0), "No staking pool");
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        uint256 usdcAmount = _swapToUSDC(token, amount);
        IERC20(USDC).safeTransfer(poolAddress, usdcAmount);
        if (stakingPoolType == 0) {
            StakingPool(poolAddress).depositFor(msg.sender, usdcAmount);
        } else {
            MorphoStakingPool(poolAddress).depositFor(msg.sender, usdcAmount);
        }
    }

    // ============ Direct Donation Functions ============

    /**
     * @notice Donates native currency (ETH) to a fundraiser
     * @dev 100% goes directly to the fundraiser (minus any platform fees in Fundraiser contract)
     * @param fundraiserId ID of the fundraiser to donate to
     */
    function donateNative(uint256 fundraiserId) external payable nonReentrant whenNotPaused {
        require(fundraiserId < _fundraisers.length, "Invalid ID");
        Fundraiser fundraiser = _fundraisers[fundraiserId];
        uint256 usdcAmount = _swapNativeToUSDC(msg.value);
        IERC20(USDC).safeTransfer(address(fundraiser), usdcAmount);
        fundraiser.creditDonation(msg.sender, usdcAmount, "native-local");
        totalFundsRaised += usdcAmount;
    }

    /**
     * @notice Donates ERC20 tokens to a fundraiser
     * @dev 100% goes directly to the fundraiser (minus any platform fees in Fundraiser contract)
     * @param fundraiserId ID of the fundraiser to donate to
     * @param token Address of the ERC20 token to donate
     * @param amount Amount of tokens to donate
     */
    function donateERC20(uint256 fundraiserId, address token, uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Factory: Amount must be > 0");
        require(fundraiserId < _fundraisers.length, "Factory: Invalid fundraiser ID");
        Fundraiser fundraiser = _fundraisers[fundraiserId];
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        uint256 usdcAmount = _swapToUSDC(token, amount);
        IERC20(USDC).safeTransfer(address(fundraiser), usdcAmount);
        fundraiser.creditDonation(msg.sender, usdcAmount, "erc20-local");
        totalFundsRaised += usdcAmount;
    }

    // ============ Wealth-Building Donation Functions ============

    /**
     * @notice Make a Wealth-Building donation (80% direct, 20% endowed)
     * @dev Requires WealthBuildingDonation contract to be configured
     * @param fundraiserId The fundraiser to donate to
     * @param amount USDC amount to donate
     */
    function donateWealthBuilding(uint256 fundraiserId, uint256 amount)
        external
        nonReentrant
        whenNotPaused
    {
        if (fundraiserId >= _fundraisers.length) revert InvalidFundraiserId();
        if (amount == 0) revert InvalidAmount();
        require(address(wealthBuildingDonation) != address(0), "WealthBuilding not configured");

        Fundraiser fundraiser = _fundraisers[fundraiserId];
        address beneficiary = fundraiser.beneficiary();

        // Transfer USDC from donor to this contract
        IERC20(USDC).safeTransferFrom(msg.sender, address(this), amount);

        // Approve WealthBuildingDonation to spend
        IERC20(USDC).forceApprove(address(wealthBuildingDonation), amount);

        // Call WealthBuildingDonation.donate()
        (uint256 directAmount, uint256 endowmentAmount) = wealthBuildingDonation.donate(
            msg.sender,
            fundraiserId,
            amount,
            beneficiary
        );

        // Credit the direct donation to the fundraiser
        fundraiser.creditDonation(msg.sender, directAmount, "wealth-building");

        totalFundsRaised += amount;

        emit WealthBuildingDonationMade(msg.sender, fundraiserId, amount, directAmount, endowmentAmount);
    }

    /**
     * @notice Make a Wealth-Building donation using any ERC20 token
     * @dev Swaps token to USDC first, then processes as wealth-building donation
     * @param fundraiserId The fundraiser to donate to
     * @param token Address of the ERC20 token to donate
     * @param amount Amount of tokens to donate
     */
    function donateWealthBuildingERC20(
        uint256 fundraiserId,
        address token,
        uint256 amount
    ) external nonReentrant whenNotPaused {
        if (amount == 0) revert InvalidAmount();
        if (fundraiserId >= _fundraisers.length) revert InvalidFundraiserId();
        require(address(wealthBuildingDonation) != address(0), "WealthBuilding not configured");

        Fundraiser fundraiser = _fundraisers[fundraiserId];
        address beneficiary = fundraiser.beneficiary();

        // Transfer token and swap to USDC
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        uint256 usdcAmount = _swapToUSDC(token, amount);

        // Approve and donate via WealthBuildingDonation
        IERC20(USDC).forceApprove(address(wealthBuildingDonation), usdcAmount);
        (uint256 directAmount, uint256 endowmentAmount) = wealthBuildingDonation.donate(
            msg.sender,
            fundraiserId,
            usdcAmount,
            beneficiary
        );

        fundraiser.creditDonation(msg.sender, directAmount, "wealth-building-erc20");
        totalFundsRaised += usdcAmount;

        emit WealthBuildingDonationMade(msg.sender, fundraiserId, usdcAmount, directAmount, endowmentAmount);
    }

    /**
     * @notice Make a Wealth-Building donation using native currency (ETH)
     * @dev Swaps ETH to USDC first, then processes as wealth-building donation
     * @param fundraiserId The fundraiser to donate to
     */
    function donateWealthBuildingNative(uint256 fundraiserId)
        external
        payable
        nonReentrant
        whenNotPaused
    {
        require(msg.value > 0, "Value must be > 0");
        if (fundraiserId >= _fundraisers.length) revert InvalidFundraiserId();
        require(address(wealthBuildingDonation) != address(0), "WealthBuilding not configured");

        Fundraiser fundraiser = _fundraisers[fundraiserId];
        address beneficiary = fundraiser.beneficiary();

        // Swap ETH to USDC
        uint256 usdcAmount = _swapNativeToUSDC(msg.value);

        // Approve and donate via WealthBuildingDonation
        IERC20(USDC).forceApprove(address(wealthBuildingDonation), usdcAmount);
        (uint256 directAmount, uint256 endowmentAmount) = wealthBuildingDonation.donate(
            msg.sender,
            fundraiserId,
            usdcAmount,
            beneficiary
        );

        fundraiser.creditDonation(msg.sender, directAmount, "wealth-building-native");
        totalFundsRaised += usdcAmount;

        emit WealthBuildingDonationMade(msg.sender, fundraiserId, usdcAmount, directAmount, endowmentAmount);
    }

    // ============ Impact DAO Pool Functions ============

    /**
     * @notice Get the ImpactDAOPool address for direct staking
     * @dev Users should approve USDC to ImpactDAOPool and call stake() directly
     *      This is more gas efficient than routing through the Factory
     * @return Address of the ImpactDAOPool contract
     */
    function getImpactDAOPool() external view returns (address) {
        return address(impactDAOPool);
    }

    /**
     * @notice Convenience function to check if ImpactDAOPool is configured
     * @return True if ImpactDAOPool is set
     */
    function isImpactDAOPoolConfigured() external view returns (bool) {
        return address(impactDAOPool) != address(0);
    }

    // ============ Cross-Chain Functions ============

    /**
     * @notice Handles cross-chain donation from bridge
     * @dev Only callable by the configured bridge contract
     */
    function handleCrossChainDonation(address donor, uint256 fundraiserId, uint256 usdcAmount) external nonReentrant whenNotPaused onlyBridge {
        require(fundraiserId < _fundraisers.length, "Factory: Invalid fundraiser ID");
        Fundraiser fundraiser = _fundraisers[fundraiserId];
        IERC20(USDC).safeTransfer(address(fundraiser), usdcAmount);
        fundraiser.creditDonation(donor, usdcAmount, "cross-chain");
        totalFundsRaised += usdcAmount;
    }

    /**
     * @notice Handles cross-chain stake from bridge
     * @dev Only callable by the configured bridge contract
     */
    function handleCrossChainStake(address donor, uint256 fundraiserId, uint256 usdcAmount) external nonReentrant whenNotPaused onlyBridge {
        address poolAddress = stakingPools[fundraiserId];
        require(poolAddress != address(0), "No staking pool");
        IERC20(USDC).safeTransfer(poolAddress, usdcAmount);
        if (stakingPoolType == 0) {
            StakingPool(poolAddress).depositFor(donor, usdcAmount);
        } else {
            MorphoStakingPool(poolAddress).depositFor(donor, usdcAmount);
        }
    }

    // ============ Internal Swap Functions ============

    function _swapToUSDC(address tokenIn, uint256 amountIn) internal returns (uint256) {
        if (tokenIn == USDC) return amountIn;
        IERC20(tokenIn).forceApprove(address(swapAdapter), amountIn);
        return swapAdapter.swapToUSDT(tokenIn, amountIn);
    }

    function _swapNativeToUSDC(uint256 amountIn) internal returns (uint256) {
        return swapAdapter.swapNativeToUSDT{value: amountIn}();
    }

    // ============ View Functions ============

    function fundraisersCount() public view returns (uint256) { return _fundraisers.length; }

    function fundraisers(uint256 limit, uint256 offset) external view returns (Fundraiser[] memory coll) {
        require(offset <= fundraisersCount(), "Offset out of bounds");
        uint256 size = fundraisersCount() - offset;
        size = size < limit ? size : limit;
        size = size < MAX_LIMIT ? size : MAX_LIMIT;
        coll = new Fundraiser[](size);
        for (uint256 i = 0; i < size; i++) { coll[i] = _fundraisers[offset + i]; }
        return coll;
    }

    function fundraisersByOwner(address owner) external view returns (Fundraiser[] memory) { return _fundraisersByOwner[owner]; }

    function _activeFundraisers() external view returns (Fundraiser[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < _fundraisers.length; i++) { if (activeFundraisers[i]) { activeCount++; } }
        Fundraiser[] memory active = new Fundraiser[](activeCount);
        uint256 currentIndex = 0;
        for (uint256 i = 0; i < _fundraisers.length; i++) {
            if (activeFundraisers[i]) { active[currentIndex] = _fundraisers[i]; currentIndex++; }
        }
        return active;
    }

    function getFundraiserById(uint256 id) external view returns (Fundraiser) {
        require(id < _fundraisers.length, "Fundraiser does not exist");
        return _fundraisers[id];
    }

    function searchFundraisersByCategory(string memory category) external view returns (Fundraiser[] memory) {
        require(_categoryExists[category], "Category does not exist");
        uint256 count = 0;
        for (uint256 i = 0; i < _fundraisers.length; i++) {
            string[] memory cats = _fundraisers[i].getCategories();
            for (uint256 j = 0; j < cats.length; j++) {
                if (keccak256(bytes(cats[j])) == keccak256(bytes(category))) { count++; break; }
            }
        }
        Fundraiser[] memory results = new Fundraiser[](count);
        uint256 currentIndex = 0;
        for (uint256 i = 0; i < _fundraisers.length; i++) {
            string[] memory cats = _fundraisers[i].getCategories();
            for (uint256 j = 0; j < cats.length; j++) {
                if (keccak256(bytes(cats[j])) == keccak256(bytes(category))) { results[currentIndex] = _fundraisers[i]; currentIndex++; break; }
            }
        }
        return results;
    }

    function searchFundraisersByRegion(string memory region) external view returns (Fundraiser[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < _fundraisers.length; i++) {
            if (keccak256(bytes(_fundraisers[i].region())) == keccak256(bytes(region))) { count++; }
        }
        Fundraiser[] memory results = new Fundraiser[](count);
        uint256 currentIndex = 0;
        for (uint256 i = 0; i < _fundraisers.length; i++) {
            if (keccak256(bytes(_fundraisers[i].region())) == keccak256(bytes(region))) { results[currentIndex] = _fundraisers[i]; currentIndex++; }
        }
        return results;
    }

    function getAvailableCategories() external view returns (string[] memory) { return availableCategories; }
    function getPlatformStats() external view returns (uint256 _totalFundraisersCreated, uint256 _activeFundraiserCount, uint256 _totalFundsRaised) { return (totalFundraisersCreated, activeFundraiserCount, totalFundsRaised); }

    // ============ Admin Functions ============

    function addCategory(string memory category) external onlyRole(ADMIN_ROLE) { _addCategory(category); }

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

    function updateDurationLimits(uint256 newMinDuration, uint256 newMaxDuration) external onlyRole(ADMIN_ROLE) {
        require(newMinDuration > 0 && newMinDuration < newMaxDuration, "Invalid duration limits");
        minDuration = newMinDuration;
        maxDuration = newMaxDuration;
    }

    function updatePlatformFeeRecipient(address newRecipient) external onlyRole(ADMIN_ROLE) {
        require(newRecipient != address(0), "Invalid address");
        address oldRecipient = platformFeeRecipient;
        platformFeeRecipient = newRecipient;
        emit PlatformFeeRecipientUpdated(oldRecipient, newRecipient);
    }

    function pause() external onlyRole(ADMIN_ROLE) { _pause(); }
    function unpause() external onlyRole(ADMIN_ROLE) { _unpause(); }

    function updateBridge(address _newBridge) external onlyRole(ADMIN_ROLE) {
        require(_newBridge != address(0), "Invalid bridge address");
        fundBraveBridge = _newBridge;
        emit BridgeUpdated(_newBridge);
    }
}
