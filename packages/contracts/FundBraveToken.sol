// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract FundBraveToken is 
    Initializable,
    ERC20Upgradeable, 
    ERC20BurnableUpgradeable, 
    ERC20PausableUpgradeable, 
    AccessControlUpgradeable, 
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable 
{
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18;
    uint256 public constant INITIAL_SUPPLY = 400_000_000 * 10**18;
    
    struct VestingSchedule {
        uint256 totalAmount;
        uint256 releasedAmount;
        uint256 startTime;
        uint256 duration;
        uint256 cliffDuration;
        bool revocable;
        bool revoked;
    }
    
    mapping(address => VestingSchedule) public vestingSchedules;
    mapping(address => bool) public hasVesting;
    
    uint256 public stakingRewardsPool;
    uint256 public communityRewardsPool;
    
    uint256 public teamAllocation;
    uint256 public ecosystemAllocation;
    uint256 public communityAllocation;
    
    uint256 public maxTransactionAmount;
    uint256 public maxWalletAmount;
    bool public limitsEnabled;
    
    mapping(address => bool) public blacklisted;
    
    event VestingScheduleCreated(address indexed beneficiary, uint256 amount, uint256 duration);
    event TokensReleased(address indexed beneficiary, uint256 amount);
    event VestingRevoked(address indexed beneficiary);
    event StakingRewardsDeposited(uint256 amount);
    event CommunityRewardsDeposited(uint256 amount);
    event BlacklistUpdated(address indexed account, bool status);
    event LimitsUpdated(uint256 maxTx, uint256 maxWallet);
    event LimitsToggled(bool enabled);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public initializer {
        __ERC20_init("FundBrave Token", "FBT");
        __ERC20Burnable_init();
        __ERC20Pausable_init();
        __AccessControl_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(GOVERNANCE_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);

        teamAllocation = 150_000_000 * 10**18;
        ecosystemAllocation = 250_000_000 * 10**18;
        communityAllocation = 200_000_000 * 10**18;
        
        maxTransactionAmount = 5_000_000 * 10**18;
        maxWalletAmount = 20_000_000 * 10**18;
        limitsEnabled = true;

        _mint(address(this), INITIAL_SUPPLY);
    }

    function _authorizeUpgrade(address newImplementation) 
        internal 
        override 
        onlyRole(UPGRADER_ROLE) 
    {}

    function createVestingSchedule(
        address beneficiary,
        uint256 amount,
        uint256 startTime,
        uint256 duration,
        uint256 cliffDuration,
        bool revocable
    ) external onlyRole(GOVERNANCE_ROLE) {
        require(beneficiary != address(0), "Invalid beneficiary");
        require(amount > 0, "Amount must be greater than 0");
        require(duration > 0, "Duration must be greater than 0");
        require(!hasVesting[beneficiary], "Beneficiary already has vesting");
        require(balanceOf(address(this)) >= amount, "Insufficient tokens in contract");
        
        vestingSchedules[beneficiary] = VestingSchedule({
            totalAmount: amount,
            releasedAmount: 0,
            startTime: startTime,
            duration: duration,
            cliffDuration: cliffDuration,
            revocable: revocable,
            revoked: false
        });
        
        hasVesting[beneficiary] = true;
        
        emit VestingScheduleCreated(beneficiary, amount, duration);
    }

    function releaseVestedTokens() external nonReentrant {
        require(hasVesting[msg.sender], "No vesting schedule");
        
        VestingSchedule storage schedule = vestingSchedules[msg.sender];
        require(!schedule.revoked, "Vesting revoked");
        
        uint256 releasable = _computeReleasableAmount(schedule);
        require(releasable > 0, "No tokens to release");
        
        schedule.releasedAmount += releasable;
        _transfer(address(this), msg.sender, releasable);
        
        emit TokensReleased(msg.sender, releasable);
    }

    function _computeReleasableAmount(VestingSchedule memory schedule) 
        private 
        view 
        returns (uint256) 
    {
        if (block.timestamp < schedule.startTime + schedule.cliffDuration) {
            return 0;
        }
        
        if (block.timestamp >= schedule.startTime + schedule.duration) {
            return schedule.totalAmount - schedule.releasedAmount;
        }
        
        uint256 timeFromStart = block.timestamp - schedule.startTime;
        uint256 vestedAmount = (schedule.totalAmount * timeFromStart) / schedule.duration;
        
        return vestedAmount - schedule.releasedAmount;
    }

    function computeReleasableAmount(address beneficiary) 
        external 
        view 
        returns (uint256) 
    {
        if (!hasVesting[beneficiary]) {
            return 0;
        }
        
        VestingSchedule memory schedule = vestingSchedules[beneficiary];
        if (schedule.revoked) {
            return 0;
        }
        
        return _computeReleasableAmount(schedule);
    }

    function revokeVesting(address beneficiary) external onlyRole(GOVERNANCE_ROLE) {
        require(hasVesting[beneficiary], "No vesting schedule");
        
        VestingSchedule storage schedule = vestingSchedules[beneficiary];
        require(schedule.revocable, "Vesting not revocable");
        require(!schedule.revoked, "Already revoked");
        
        schedule.revoked = true;
        
        emit VestingRevoked(beneficiary);
    }

    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(to, amount);
    }

    function depositStakingRewards(uint256 amount) external onlyRole(GOVERNANCE_ROLE) {
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        _transfer(msg.sender, address(this), amount);
        stakingRewardsPool += amount;
        
        emit StakingRewardsDeposited(amount);
    }

    function depositCommunityRewards(uint256 amount) external onlyRole(GOVERNANCE_ROLE) {
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        _transfer(msg.sender, address(this), amount);
        communityRewardsPool += amount;
        
        emit CommunityRewardsDeposited(amount);
    }

    function distributeStakingReward(address to, uint256 amount) 
        external 
        onlyRole(MINTER_ROLE) 
    {
        require(stakingRewardsPool >= amount, "Insufficient rewards pool");
        stakingRewardsPool -= amount;
        _transfer(address(this), to, amount);
    }

    function distributeCommunityReward(address to, uint256 amount) 
        external 
        onlyRole(MINTER_ROLE) 
    {
        require(communityRewardsPool >= amount, "Insufficient rewards pool");
        communityRewardsPool -= amount;
        _transfer(address(this), to, amount);
    }

    function updateBlacklist(address account, bool status) 
        external 
        onlyRole(GOVERNANCE_ROLE) 
    {
        require(account != address(0), "Invalid address");
        blacklisted[account] = status;
        
        emit BlacklistUpdated(account, status);
    }

    function updateLimits(uint256 maxTx, uint256 maxWallet) 
        external 
        onlyRole(GOVERNANCE_ROLE) 
    {
        require(maxTx >= MAX_SUPPLY / 1000, "Max tx too low");
        require(maxWallet >= MAX_SUPPLY / 100, "Max wallet too low");
        
        maxTransactionAmount = maxTx;
        maxWalletAmount = maxWallet;
        
        emit LimitsUpdated(maxTx, maxWallet);
    }

    function toggleLimits(bool enabled) external onlyRole(GOVERNANCE_ROLE) {
        limitsEnabled = enabled;
        emit LimitsToggled(enabled);
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function _update(address from, address to, uint256 amount)
        internal
        override(ERC20Upgradeable, ERC20PausableUpgradeable)
    {
        require(!blacklisted[from] && !blacklisted[to], "Address blacklisted");
        
        if (limitsEnabled && 
            from != address(0) && 
            to != address(0) && 
            !hasRole(GOVERNANCE_ROLE, from) && 
            !hasRole(GOVERNANCE_ROLE, to)) {
            
            require(amount <= maxTransactionAmount, "Exceeds max transaction");
            
            if (to != address(this)) {
                require(
                    balanceOf(to) + amount <= maxWalletAmount, 
                    "Exceeds max wallet"
                );
            }
        }
        
        super._update(from, to, amount);
    }

    function getAllocationDetails() external view returns (
        uint256 team,
        uint256 ecosystem,
        uint256 community,
        uint256 circulating,
        uint256 locked
    ) {
        return (
            teamAllocation,
            ecosystemAllocation,
            communityAllocation,
            totalSupply() - balanceOf(address(this)),
            balanceOf(address(this))
        );
    }

    function emergencyWithdrawToken(address token, uint256 amount) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(token != address(this), "Cannot withdraw FBT");
        IERC20Upgradeable(token).transfer(msg.sender, amount);
    }

    function version() external pure returns (string memory) {
        return "1.0.0";
    }
}