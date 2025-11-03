// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../FundBraveBridge.sol";

// Mocks the Axelar Gateway to fake cross-chain calls
contract MockAxelarGateway is Ownable {
    mapping(string => address) public tokenAddresses;

    function tokenAddress(string calldata symbol) external view returns (address) {
        return tokenAddresses[symbol];
    }

    // Helper for tests to register a mock token
    function registerToken(string calldata symbol, address token) external onlyOwner {
        tokenAddresses[symbol] = token;
    }

    // Test function: Fakes a message from another chain
    function callBridge(
        address bridge,
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes calldata payload,
        string calldata tokenSymbol,
        uint256 amount
    ) external {
        // 1. "Receive" the token from the user
        IERC20(tokenAddresses[tokenSymbol]).transferFrom(msg.sender, address(this), amount);

        // 2. "Send" the token to the bridge
        IERC20(tokenAddresses[tokenSymbol]).transfer(bridge, amount);

        // 3. Call the bridge's execute function
        FundBraveBridge(bridge)._executeWithToken(
            sourceChain,
            sourceAddress,
            payload,
            tokenSymbol,
            amount
        );
    }
}