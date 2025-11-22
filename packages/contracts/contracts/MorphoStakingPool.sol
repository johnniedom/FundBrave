// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IMetaMorpho.sol";

/**
 * @title StakingPool (Morpho Version)
 * @dev A staking pool that interacts with a Morpho MetaMorpho (ERC4626) vault.
 * It has the SAME external functions as your Aave pool,
 * but its internal logic calls a Morpho MetaMorpho (ERC4626) vault.
 */
contract MorphoStakingPool is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    // --- Morpho & Token Addresses ---
    // This is the ERC4626 MetaMorpho Vault
    IMetaMorpho public immutable METAMORPHO_VAULT;
    IERC20 public immutable USDT;

    // --- Beneficiaries ---
    address public immutable beneficiary;
    address public immutable platformWallet;
    address public immutable factoryAddress;

    // --- Staking Data ---
    uint256 public totalStakedPrincipal;
    mapping(address => uint256) public stakerPrincipal;

    uint256 public rewardPerTokenStored;
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;

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

    modifier updateReward(address staker) {
        rewards[staker] += earned(staker);
        userRewardPerTokenPaid[staker] = rewardPerTokenStored;
        _;
    }

    constructor(
        address _morphoVault,
        address _usdt,
        address _beneficiary,
        address _platformWallet,
        address _factoryAddress,
        address _owner
    ) Ownable(_owner) {
        METAMORPHO_VAULT = IMetaMorpho(_morphoVault);
        USDT = IERC20(_usdt);
        
        beneficiary = _beneficiary;
        platformWallet = _platformWallet;
        factoryAddress = _factoryAddress;

        USDT.approve(address(METAMORPHO_VAULT), type(uint256).max);
    }

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

    // --- Staking Functions ---

    /**
     * @dev Called by the Factory.
     * Takes USDT from factory, deposits it into Morpho for shares.
     */
    function depositFor(address staker, uint256 usdtAmount)
        external
        onlyFactory
        nonReentrant
        updateReward(staker)
    {
        require(usdtAmount > 0, "Amount must be > 0");
        //USDT.safeTransferFrom(factoryAddress, address(this), usdtAmount);
        
        METAMORPHO_VAULT.deposit(usdtAmount, address(this));

        stakerPrincipal[staker] += usdtAmount;
        totalStakedPrincipal += usdtAmount;

        emit Staked(staker, usdtAmount);
    }

    /**
     * @dev Staker withdraws their principal.
     * Redeems this contract's shares for USDT and sends to staker.
     */
    function unstake(uint256 usdtAmount)
        external
        nonReentrant
        updateReward(msg.sender)
    {
        require(usdtAmount > 0, "Amount must be > 0");
        require(stakerPrincipal[msg.sender] >= usdtAmount, "Insufficient stake");

        stakerPrincipal[msg.sender] -= usdtAmount;
        totalStakedPrincipal -= usdtAmount;

        METAMORPHO_VAULT.withdraw(usdtAmount, msg.sender, address(this));

        emit Unstaked(msg.sender, usdtAmount);
    }

    // --- Reward Functions ---

    /**
     * @dev Staker claims their share of the 19% pool. 
     */
    function claimStakerRewards() external nonReentrant updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        require(reward > 0, "No rewards to claim");

        rewards[msg.sender] = 0;
        USDT.safeTransfer(msg.sender, reward);

        emit RewardsClaimed(msg.sender, reward);
    }

    /**
     * @dev Harvests yield from Morpho and splits it 79/19/2.
     * Anyone can call this.
     */
    function harvestAndDistribute() external nonReentrant {
        uint256 totalShares = METAMORPHO_VAULT.balanceOf(address(this));
        
        uint256 currentAssetValue = METAMORPHO_VAULT.previewRedeem(totalShares);
        uint256 yield = currentAssetValue - totalStakedPrincipal;
        require(yield > 0, "No yield to harvest");

        METAMORPHO_VAULT.withdraw(yield, address(this), address(this));

        uint256 fundraiserShare = (yield * FUNDRAISER_SHARE) / TOTAL_BASIS;
        uint256 stakerShare = (yield * STAKER_SHARE) / TOTAL_BASIS;
        uint256 platformShare = (yield * PLATFORM_SHARE) / TOTAL_BASIS;

        USDT.safeTransfer(beneficiary, fundraiserShare);
        USDT.safeTransfer(platformWallet, platformShare);

        if (totalStakedPrincipal > 0) {
            rewardPerTokenStored += (stakerShare * 1e18) / totalStakedPrincipal;
        }

        emit YieldHarvested(yield, stakerShare);
    }
}