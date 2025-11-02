// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract Fundraiser is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    address public immutable USDT;
    address public immutable factoryAddress;
    
    event DonationCredited(address indexed donor, uint256 amount, string sourceChain);

    constructor(
        uint256 _id,
        string memory _name,
        string[] memory _images,
        string[] memory _categories,
        string memory _description,
        string memory _region,
        address payable _beneficiary,
        address _custodian,
        uint256 _goal,
        uint256 _deadline,
        address _usdt,
        address _platformFeeRecipient,
        address _factoryAddress
    ) Ownable(_custodian) {
        require(_beneficiary != address(0), "Invalid beneficiary");
        require(_goal > 0, "Goal must be greater than 0");
        require(_deadline > block.timestamp, "Deadline must be in the future");
        
        id = _id;
        name = _name;
        images = _images;
        categories = _categories;
        description = _description;
        region = _region;
        beneficiary = _beneficiary;
        goal = _goal;
        deadline = _deadline;
        USDT = _usdt;
        platformFeeRecipient = _platformFeeRecipient;
        factoryAddress = _factoryAddress;
    }

    modifier onlyFactory() {
        require(msg.sender == factoryAddress, "Fundraiser: Caller is not the factory");
        _;
    }

    /**
     * @dev Credits a donation that was processed by the factory.
     * This is the final step for all donations (native, ERC20, cross-chain).
     * The `usdtAmount` is the final amount *after* any swaps.
     */
    function creditDonation(
        address donor,
        uint256 usdtAmount,
        string calldata sourceChain
    ) external nonReentrant whenNotPaused onlyFactory {
        _recordDonation(donor, usdtAmount, USDT, sourceChain);
        emit DonationCredited(donor, usdtAmount, sourceChain);
    }

    // _recordDonation is now the single source of truth for tracking
    function _recordDonation(
        address donor,
        uint256 value,
        address token,
        string memory sourceChain
    ) private {
        Donation memory donation = Donation({
            value: value,
            date: block.timestamp,
            token: token,
            sourceChain: sourceChain
        });

        AllDonation memory allDonation = AllDonation({
            donor: donor,
            value: value,
            date: block.timestamp,
            token: token,
            sourceChain: sourceChain
        });

        _donations[donor].push(donation);
        _allDonations[id].push(allDonation);
        totalDonations += value;
        donationsCount++;
        totalDonationsCount++;
        
        if (!_donors[donor]) {
            _donors[donor] = true;
        }
        
        donorVotingPower[donor] += value;
    }
    
    function withdrawUSDT() external onlyOwner nonReentrant {
        uint256 balance = IERC20(USDT).balanceOf(address(this));
        require(balance > totalStaked, "Cannot withdraw staked funds");
        
        uint256 withdrawable = balance - totalStaked;
        IERC20(USDT).safeTransfer(beneficiary, withdrawable);
        emit Withdraw(withdrawable, USDT);
    }
}