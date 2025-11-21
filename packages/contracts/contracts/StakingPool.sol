// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

abstract contract PausableUpgradeable {
    bool private _paused;

    event Paused(address account);
    event Unpaused(address account);

    // initializer mimic - keep internal so initialize() can call it
    function __Pausable_init() internal {
        _paused = false;
    }

    modifier whenNotPaused() {
        require(!_paused, "Pausable: paused");
        _;
    }

    modifier whenPaused() {
        require(_paused, "Pausable: not paused");
        _;
    }

    function paused() public view returns (bool) {
        return _paused;
    }

    function _pause() internal virtual {
        require(!_paused, "Pausable: paused");
        _paused = true;
        emit Paused(msg.sender);
    }

    function _unpause() internal virtual {
        require(_paused, "Pausable: not paused");
        _paused = false;
        emit Unpaused(msg.sender);
    }
}


abstract contract ReentrancyGuardUpgradeable {
    uint256 private _status;
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    // initializer mimic - keep internal so initialize() can call it
    function __ReentrancyGuard_init() internal {
        _status = _NOT_ENTERED;
    }

    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }
}
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./interfaces/IAavePool.sol";

interface IReceiptOFT {
    function mint(address to, uint256 amount) external;
    function burn(address from, uint256 amount) external;
}

// Chainlink Automation Interface
interface AutomationCompatibleInterface {
    function checkUpkeep(bytes calldata checkData) external view returns (bool upkeepNeeded, bytes memory performData);
    function performUpkeep(bytes calldata performData) external;
}

/**
 * @title StakingPool
 * @dev Manages staked funds, generates yield via Aave, and issues Receipt Tokens.
 */
contract StakingPool is Initializable, OwnableUpgradeable, ReentrancyGuardUpgradeable, PausableUpgradeable, AutomationCompatibleInterface {
    using SafeERC20 for IERC20;

    // --- Core Contracts ---
    IAavePool public AAVE_POOL;
    IERC20 public USDC;   
    IERC20 public aUSDC;
    IReceiptOFT public receiptOFT;

    // --- Config ---
    address public beneficiary; 
    address public platformWallet; 
    address public factoryAddress; 

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

    /// @custom:oz-upgrades-unsafe-allow constructor
        constructor() {
            _disableInitializers();
        }
    
        function initialize(
            address _aavePool,
            address _usdc,
            address _aUsdc,
            address _receiptOFT,
            address _beneficiary,
            address _platformWallet,
            address _factoryAddress,
            address _owner
        ) external initializer {
            require(_aavePool != address(0), "Invalid Aave Pool");
            
            // Init Parents
            __Ownable_init(_owner);
            __ReentrancyGuard_init();
            __Pausable_init();

        // Init State
        AAVE_POOL = IAavePool(_aavePool);
        USDC = IERC20(_usdc);
        aUSDC = IERC20(_aUsdc);
        receiptOFT = IReceiptOFT(_receiptOFT);
        beneficiary = _beneficiary;
        platformWallet = _platformWallet;
        factoryAddress = _factoryAddress;

        // Infinite approve Aave to spend our USDC
        USDC.approve(address(AAVE_POOL), type(uint256).max);
    }

    // --- Automation ---

    function checkUpkeep(bytes calldata) external view override returns (bool upkeepNeeded, bytes memory performData) {
        bool timePassed = (block.timestamp - lastHarvestTimestamp) > HARVEST_INTERVAL;
        bool hasYield = aUSDC.balanceOf(address(this)) > totalStakedPrincipal;
        upkeepNeeded = timePassed && hasYield;
        performData = ""; 
    }

    function performUpkeep(bytes calldata) external override {
        require((block.timestamp - lastHarvestTimestamp) > HARVEST_INTERVAL, "Too soon");
        harvestAndDistribute();
    }

    // --- Core Logic ---

    function earned(address staker) public view returns (uint256) {
        uint256 rewardPerToken = (rewardPerTokenStored * 1e18) / 1e18;
        return (stakerPrincipal[staker] * (rewardPerToken - userRewardPerTokenPaid[staker])) / 1e18;
    }

    function claimableRewards(address staker) public view returns (uint256) {
        return rewards[staker] + earned(staker);
    }

    function depositFor(address staker, uint256 usdcAmount) 
        external 
        onlyFactory 
        nonReentrant
        whenNotPaused
        updateReward(staker)
    {
        require(usdcAmount > 0, "Amount must be > 0");
        
        USDC.safeTransferFrom(factoryAddress, address(this), usdcAmount);
        AAVE_POOL.supply(address(USDC), usdcAmount, address(this), 0);
        
        stakerPrincipal[staker] += usdcAmount;
        totalStakedPrincipal += usdcAmount;

        // MINT RECEIPT TOKEN
        if (address(receiptOFT) != address(0)) {
            receiptOFT.mint(staker, usdcAmount);
        }

        emit Staked(staker, usdcAmount);
    }

    function unstake(uint256 usdcAmount) external nonReentrant whenNotPaused updateReward(msg.sender) {
        require(usdcAmount > 0, "Amount must be > 0");
        require(stakerPrincipal[msg.sender] >= usdcAmount, "Insufficient stake");

        // BURN RECEIPT TOKEN (Must have approved this contract first)
        if (address(receiptOFT) != address(0)) {
            receiptOFT.burn(msg.sender, usdcAmount);
        }

        stakerPrincipal[msg.sender] -= usdcAmount;
        totalStakedPrincipal -= usdcAmount;

        AAVE_POOL.withdraw(address(USDC), usdcAmount, msg.sender);
        
        emit Unstaked(msg.sender, usdcAmount);
    }

    function claimStakerRewards() external nonReentrant whenNotPaused updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        require(reward > 0, "No rewards to claim");
        rewards[msg.sender] = 0;
        USDC.safeTransfer(msg.sender, reward);
        emit RewardsClaimed(msg.sender, reward);
    }

    function harvestAndDistribute() public nonReentrant whenNotPaused {
        uint256 currentAaveBalance = aUSDC.balanceOf(address(this));
        if (currentAaveBalance <= totalStakedPrincipal) return;
        uint256 yield = currentAaveBalance - totalStakedPrincipal;
        require(yield > 0, "No yield to harvest");

        AAVE_POOL.withdraw(address(USDC), yield, address(this));

        uint256 fundraiserShare = (yield * FUNDRAISER_SHARE) / TOTAL_BASIS;
        uint256 stakerShare = (yield * STAKER_SHARE) / TOTAL_BASIS;
        uint256 platformShare = (yield * PLATFORM_SHARE) / TOTAL_BASIS;

        USDC.safeTransfer(beneficiary, fundraiserShare);
        USDC.safeTransfer(platformWallet, platformShare);

        if (totalStakedPrincipal > 0) {
            rewardPerTokenStored += (stakerShare * 1e18) / totalStakedPrincipal;
        }

        lastHarvestTimestamp = block.timestamp;
        emit YieldHarvested(yield, stakerShare);
    }

    // --- Admin ---
    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}