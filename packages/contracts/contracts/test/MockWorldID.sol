// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

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

contract MockWorldID is IWorldID {
    bool public shouldRevert;

    function setShouldRevert(bool _shouldRevert) external {
        shouldRevert = _shouldRevert;
    }

    function verifyProof(
        uint256 root,
        uint256 groupID,
        uint256 signal,
        uint256 nullifierHash,
        uint256 externalNullifier,
        uint256[8] calldata proof
    ) external view override {
        if (shouldRevert) {
            revert("Invalid Proof");
        }
        // Otherwise, do nothing (success)
    }
}