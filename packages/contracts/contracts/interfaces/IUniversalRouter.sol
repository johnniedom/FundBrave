// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IUniversalRouter {
    /**
     * @notice Executes a series of commands
     * @param commands A list of command bytes
     * @param inputs A list of inputs for each command
     * @param deadline The deadline for the trade
     */
    function execute(
        bytes calldata commands,
        bytes[] calldata inputs,
        uint256 deadline
    ) external payable;

    // This is a helper for native token unwrapping
    function execute(
        bytes calldata commands,
        bytes[] calldata inputs
    ) external payable;
}