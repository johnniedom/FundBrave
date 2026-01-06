// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// This is a mock of the Aave V3 Pool
contract MockAavePool {
    using SafeERC20 for IERC20;
    IERC20 public immutable USDT;
    IERC20 public immutable aUSDT;

    constructor(address _usdt, address _ausdt) {
        USDT = IERC20(_usdt);
        aUSDT = IERC20(_ausdt);
    }

    // Mocks Aave's supply function
    function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external {
        require(asset == address(USDT), "Mock: Only USDT");
        // Pulls USDT from the caller
        USDT.safeTransferFrom(msg.sender, address(this), amount);
        // Mints aUSDT (interest-bearing token) to the recipient
        aUSDT.safeTransfer(onBehalfOf, amount);
    }

    // Mocks Aave's withdraw function
    function withdraw(address asset, uint256 amount, address to) external returns (uint256) {
        require(asset == address(USDT), "Mock: Only USDT");
        // Burns aUSDT from the caller
        aUSDT.safeTransferFrom(msg.sender, address(this), amount);
        // Sends USDT back to the recipient
        USDT.safeTransfer(to, amount);
        return amount;
    }
}