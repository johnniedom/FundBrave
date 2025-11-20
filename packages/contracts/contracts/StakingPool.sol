// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IAavePool.sol";

// Chainlink Automation Interface
interface AutomationCompatibleInterface {
    function checkUpkeep(bytes calldata checkData) external view returns (bool upkeepNeeded, bytes memory performData);
    function performUpkeep(bytes calldata performData) external;
}

/**
 * @title StakingPool
 * @dev Manages staked funds for a single fundraiser by depositing
 * them into Aave V3 to generate yield.
 * The yield is then split 79/19/2.
 * Implements Chainlink Automation for auto-harvesting.
 */
contract StakingPool is ReentrancyGuard, Ownable, AutomationCompatibleInterface {
    using SafeERC20 for IERC20;

    // --- Aave & Token Addresses ---
    IAavePool public immutable AAVE_POOL;
    IERC20 public immutable USDC;
    IERC20 public immutable aUSDC;

    // --- Beneficiaries ---
    address public immutable beneficiary;
    address public immutable platformWallet;
    address public immutable factoryAddress;

    // --- Staking Data ---
    uint256 public totalStakedPrincipal;
    mapping(address => uint256) public stakerPrincipal;
    
    // --- Staker Rewards (The 19%) ---
    uint256 public rewardPerTokenStored;
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;

    // --- Automation State ---
    uint256 public lastHarvestTimestamp;
    uint256 public constant HARVEST_INTERVAL = 1 days;

    // --- Profit Sharing ---
    uint256 public constant FUNDRAISER_SHARE = 7900;
    uint256 public constant STAKER_SHARE = 1900;
    uint256 public constant PLATFORM_SHARE = 200;
    uint256 public constant TOTAL_BASIS = 10000;

    event Staked(address indexed staker, uint256 usdcAmount);
    event Unstaked(address indexed staker, uint256 usdcAmount);
    event YieldHarvested(uint256 totalYield, uint256 stakerShare);
    event RewardsClaimed(address indexed staker, uint256 amount);

    modifier onlyFactory() {
        require(msg.sender == factoryAddress, "StakingPool: Only factory");
        _;
    }

    modifier updateReward(address staker) {
        rewards[staker] += earned(staker);
        userRewardPerTokenPaid[staker] = rewardPerTokenStored;
        _;
    }

    constructor(
        address _aavePool,
        address _usdc,
        address _aUsdc,
        address _beneficiary,
        address _platformWallet,
        address _factoryAddress,
        address _owner
    ) Ownable(_owner) {
        require(_aavePool != address(0), "Invalid Aave Pool");
        require(_usdc != address(0), "Invalid USDC");
        
        AAVE_POOL = IAavePool(_aavePool);
        USDC = IERC20(_usdc);
        aUSDC = IERC20(_aUsdc);
        beneficiary = _beneficiary;
        platformWallet = _platformWallet;
        factoryAddress = _factoryAddress;

        USDC.approve(address(AAVE_POOL), type(uint256).max);
    }

    // --- Chainlink Automation ---

    /**
     * @dev Logic for Chainlink Keepers to check if harvest is needed.
     * Trigger if: > 1 day since last harvest AND there is yield to harvest.
     */
    function checkUpkeep(bytes calldata) 
        external 
        view 
        override 
        returns (bool upkeepNeeded, bytes memory performData) 
    {
        // Check if enough time passed
        bool timePassed = (block.timestamp - lastHarvestTimestamp) > HARVEST_INTERVAL;
        
        // Check if there is actual yield (aToken balance > principal)
        bool hasYield = aUSDC.balanceOf(address(this)) > totalStakedPrincipal;

        upkeepNeeded = timePassed && hasYield;
        performData = "";
    }

    /**
     * @dev Logic for Chainlink Keepers to execute the harvest.
     */
    function performUpkeep(bytes calldata) external override {
        require((block.timestamp - lastHarvestTimestamp) > HARVEST_INTERVAL, "Too soon");
        harvestAndDistribute();
    }

    // --- Core Logic ---

    /**
     * @dev Calculates the rewards a staker is owed.
     */
    function earned(address staker) public view returns (uint256) {
        uint256 rewardPerToken = (rewardPerTokenStored * 1e18) / 1e18;
        return
            (stakerPrincipal[staker] *
                (rewardPerToken - userRewardPerTokenPaid[staker])) /
            1e18;
    }

    /**
     * @dev Public view function for the "mailbox"
     */
    function claimableRewards(address staker) public view returns (uint256) {
        return rewards[staker] + earned(staker);
    }

    /**
     * @dev Called by the Factory after it swaps user's token to USDC.
     */
    function depositFor(address staker, uint256 usdcAmount) 
        external 
        onlyFactory 
        nonReentrant
        updateReward(staker)
    {
        require(usdcAmount > 0, "Amount must be > 0");
        
        // Factory has already approved this contract
        USDC.safeTransferFrom(factoryAddress, address(this), usdcAmount);
        
        // Supply to Aave
        AAVE_POOL.supply(address(USDC), usdcAmount, address(this), 0);
        
        stakerPrincipal[staker] += usdcAmount;
        totalStakedPrincipal += usdcAmount;
        
        emit Staked(staker, usdcAmount);
    }

    /**
     * @dev Staker withdraws their principal.
     */
    function unstake(uint256 usdcAmount) external nonReentrant updateReward(msg.sender) {
        require(usdcAmount > 0, "Amount must be > 0");
        require(stakerPrincipal[msg.sender] >= usdcAmount, "Insufficient stake");

        stakerPrincipal[msg.sender] -= usdcAmount;
        totalStakedPrincipal -= usdcAmount;

        // This will withdraw USDC by redeeming aUSDC
        AAVE_POOL.withdraw(address(USDC), usdcAmount, msg.sender);
        
        emit Unstaked(msg.sender, usdcAmount);
    }

    function claimStakerRewards() external nonReentrant updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        require(reward > 0, "No rewards to claim");

        rewards[msg.sender] = 0;
        USDC.safeTransfer(msg.sender, reward);

        emit RewardsClaimed(msg.sender, reward);
    }

    /**
     * @dev Harvests yield from Aave and splits it 79/19/2.
     * Can be called manually or by Chainlink Automation.
     */
    function harvestAndDistribute() public nonReentrant {
        uint256 currentAaveBalance = aUSDC.balanceOf(address(this));
        
        // Safety check: avoid underflow if Aave loses money (unlikely for stablecoins)
        if (currentAaveBalance <= totalStakedPrincipal) return;

        uint256 yield = currentAaveBalance - totalStakedPrincipal;
        require(yield > 0, "No yield to harvest");

        // Withdraw the yield portion from Aave
        AAVE_POOL.withdraw(address(USDC), yield, address(this));

        uint256 fundraiserShare = (yield * FUNDRAISER_SHARE) / TOTAL_BASIS;
        uint256 stakerShare = (yield * STAKER_SHARE) / TOTAL_BASIS;
        uint256 platformShare = (yield * PLATFORM_SHARE) / TOTAL_BASIS;

        USDC.safeTransfer(beneficiary, fundraiserShare);
        USDC.safeTransfer(platformWallet, platformShare);

        // Update staker rewards
        if (totalStakedPrincipal > 0) {
            // We use 1e18 as a "scaling factor" for precision
            rewardPerTokenStored += (stakerShare * 1e18) / totalStakedPrincipal;
        }

        // Update timestamp for Chainlink
        lastHarvestTimestamp = block.timestamp;

        emit YieldHarvested(yield, stakerShare);
    }
}