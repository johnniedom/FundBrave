// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title YieldDistributor
 * @notice Receives yield from GlobalStakingPool and distributes it to projects based on DAO votes.
 */
contract YieldDistributor is Ownable {
    using SafeERC20 for IERC20;

    event YieldDistributed(address indexed token, uint256 totalAmount, uint256 recipientCount);
    event FundsRescued(address indexed token, uint256 amount);

    constructor(address _owner) Ownable(_owner) {}

    /**
     * @notice Batch distributes tokens to winning fundraisers.
     * @dev Only callable by the backend/admin after calculating off-chain votes.
     * @param token The currency to distribute (USDC)
     * @param recipients Array of Fundraiser/Beneficiary addresses
     * @param amounts Array of amounts for each recipient
     */
    function distributeYield(
        IERC20 token, 
        address[] calldata recipients, 
        uint256[] calldata amounts
    ) external onlyOwner {
        require(recipients.length == amounts.length, "Arrays length mismatch");
        require(recipients.length > 0, "No recipients");

        uint256 totalDistributed = 0;

        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "Invalid recipient");
            if (amounts[i] > 0) {
                token.safeTransfer(recipients[i], amounts[i]);
                totalDistributed += amounts[i];
            }
        }

        emit YieldDistributed(address(token), totalDistributed, recipients.length);
    }

    /**
     * @notice Safety function to rescue funds if distribution fails or gets stuck.
     */
    function rescueFunds(IERC20 token, uint256 amount) external onlyOwner {
        token.safeTransfer(owner(), amount);
        emit FundsRescued(address(token), amount);
    }
}