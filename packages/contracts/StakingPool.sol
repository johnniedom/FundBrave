// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IAavePool.sol"; 
import "./interfaces/IERC20Detailed.sol";

/**
 * @title StakingPool
 * @dev Manages staked funds for a single fundraiser by depositing
 * them into Aave V3 to generate yield.
 * The yield is then split 79/19/2.
 */
contract StakingPool is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    // --- Aave & Token Addresses ---
    IAavePool public immutable AAVE_POOL;
    IERC20 public immutable USDT;
    IERC20 public immutable aUSDT;

    // --- Beneficiaries ---
    address public immutable beneficiary; // 79% (Fundraiser)
    address public immutable platformWallet; // 2% (Platform)
    address public immutable factoryAddress; // For access control

    // --- Staking Data ---
    uint256 public totalStakedPrincipal;
    mapping(address => uint256) public stakerPrincipal; // User's principal balance
    
    // --- Staker Rewards (The 19%) ---
    mapping(address => uint256) public stakerRewards; // Earned, claimable USDT
    uint256 public totalStakerRewardsAccrued; // Total 19% share

    // --- Profit Sharing ---
    uint256 public constant FUNDRAISER_SHARE = 7900;
    uint256 public constant STAKER_SHARE = 1900;
    uint256 public constant PLATFORM_SHARE = 200;
    uint256 public constant TOTAL_BASIS = 10000;

    event Staked(address indexed staker, uint256 usdtAmount);
    event Unstaked(address indexed staker, uint256 usdtAmount);
    event YieldHarvested(uint256 totalYield, uint256 stakerShare);
    event RewardsClaimed(address indexed staker, uint256 amount);

    modifier onlyFactory() {
        require(msg.sender == factoryAddress, "StakingPool: Only factory");
        _;
    }

    constructor(
        address _aavePool,
        address _usdt,
        address _aUsdt,
        address _beneficiary,
        address _platformWallet,
        address _factoryAddress,
        address _owner
    ) Ownable(_owner) {
        AAVE_POOL = IAavePool(_aavePool);
        USDT = IERC20(_usdt);
        aUSDT = IERC20(_aUsdt);
        beneficiary = _beneficiary;
        platformWallet = _platformWallet;
        factoryAddress = _factoryAddress;

        USDT.approve(address(AAVE_POOL), type(uint256).max);
    }

    /**
     * @dev Called by the Factory after it swaps user's token to USDT.
     */
    function depositFor(address staker, uint256 usdtAmount) 
        external 
        onlyFactory 
        nonReentrant 
    {
        require(usdtAmount > 0, "Amount must be > 0");

        // 1. Pull the USDT from the factory (which just swapped it)
        USDT.safeTransferFrom(factoryAddress, address(this), usdtAmount);

        // 2. Deposit principal into Aave
        AAVE_POOL.supply(address(USDT), usdtAmount, address(this), 0);
        
        // 3. Update accounting
        stakerPrincipal[staker] += usdtAmount;
        totalStakedPrincipal += usdtAmount;
        
        emit Staked(staker, usdtAmount);
    }

    /**
     * @dev Staker withdraws their principal.
     */
    function unstake(uint256 usdtAmount) external nonReentrant {
        require(usdtAmount > 0, "Amount must be > 0");
        require(stakerPrincipal[msg.sender] >= usdtAmount, "Insufficient stake");

        // 1. Update accounting
        stakerPrincipal[msg.sender] -= usdtAmount;
        totalStakedPrincipal -= usdtAmount;

        // 2. Withdraw principal from Aave and send to staker
        // This will withdraw USDT by redeeming aUSDT
        AAVE_POOL.withdraw(address(USDT), usdtAmount, msg.sender);
        
        emit Unstaked(msg.sender, usdtAmount);
    }

    /**
     * @dev Harvests yield from Aave and splits it 79/19/2.
     * Anyone can call this.
     */
    function harvestAndDistribute() external nonReentrant {
        // 1. Check current total Aave balance (principal + yield)
        uint256 currentAaveBalance = aUSDT.balanceOf(address(this));
        
        // 2. Calculate yield
        // Note: aUSDT auto-compounds, so its balance increases.
        // We assume 1 aUSDT = 1 USDT for simplicity. Aave V3 is more complex,
        // but this is the general idea.
        uint256 yield = currentAaveBalance - totalStakedPrincipal;
        require(yield > 0, "No yield to harvest");

        // 3. Withdraw *only the yield* from Aave to this contract
        AAVE_POOL.withdraw(address(USDT), yield, address(this));
        
        // 4. Split the yield
        uint256 fundraiserShare = (yield * FUNDRAISER_SHARE) / TOTAL_BASIS;
        uint256 stakerShare = (yield * STAKER_SHARE) / TOTAL_BASIS;
        uint256 platformShare = (yield * PLATFORM_SHARE) / TOTAL_BASIS;

        // 5. Distribute shares
        USDT.safeTransfer(beneficiary, fundraiserShare);
        USDT.safeTransfer(platformWallet, platformShare);
        
        // 6. Add the 19% to the stakers' reward pool
        // This pool is now in USDT, ready to be claimed
        totalStakerRewardsAccrued += stakerShare;
        
        emit YieldHarvested(yield, stakerShare);
    }

    /**
     * @dev Calculates the staker's share of the 19% reward pool.
     * This is a simple, less-scalable model.
     * A better model uses reward-per-token, but this is clearer.
     */
    function claimableRewards(address staker) public view returns (uint256) {
        if (totalStakedPrincipal == 0) return 0;
        // Calculate staker's % of the pool and multiply by available rewards
        uint256 stakerShare = (stakerPrincipal[staker] * 1e18) / totalStakedPrincipal;
        uint256 claimable = (totalStakerRewardsAccrued * stakerShare) / 1e18;
        return claimable + stakerRewards[staker];
    }

    /**
     * @dev Staker claims their share of the 19% pool.
     */
    function claimStakerRewards() external nonReentrant {
        // This function needs to be more robust for multiple claimers.
        // For now, let's just pay out their current share.
        uint256 amountToClaim = claimableRewards(msg.sender);
        require(amountToClaim > 0, "No rewards to claim");

        // Update total pool and user's balance
        totalStakerRewardsAccrued -= amountToClaim;
        stakerRewards[msg.sender] = 0; 
        
        USDT.safeTransfer(msg.sender, amountToClaim);
        emit RewardsClaimed(msg.sender, amountToClaim);
    }
}