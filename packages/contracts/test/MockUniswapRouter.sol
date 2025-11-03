// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./MockWETH.sol";

contract MockUniswapRouter {
    using SafeERC20 for IERC20;
    
    address public immutable WETH;
    address public immutable USDT;
    
    // Price: 1 ETH = 2000 USDT
    uint256 public constant ETH_PRICE = 2000 * 10**6; 
    // Price: 1 DAI = 1 USDT
    uint256 public constant DAI_PRICE = 1 * 10**6; 

    constructor(address _weth, address _usdt) {
        WETH = _weth;
        USDT = _usdt;
    }

    function swapExactETHForTokens(
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external payable returns (uint256[] memory amounts) {
        // Simple mock: 1 ETH -> 2000 USDT
        uint256 usdtOut = (msg.value * ETH_PRICE) / 1 ether;
        
        // Wrap the sent ETH
        MockWETH(WETH).deposit{value: msg.value}();
        
        // Send USDT to the recipient
        IERC20(USDT).safeTransfer(to, usdtOut);

        amounts = new uint256[](2);
        amounts[0] = msg.value;
        amounts[1] = usdtOut;
        return amounts;
    }

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts) {
        address tokenIn = path[0];
        
        // Pull the token from the caller
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
        
        uint256 usdtOut;
        
        // Mock DAI -> USDT swap (assuming 18 decimals for DAI)
        // This is a rough approximation
        usdtOut = (amountIn * DAI_PRICE) / 10**18;
        
        // Send USDT to the recipient
        IERC20(USDT).safeTransfer(to, usdtOut);

        amounts = new uint256[](2);
        amounts[0] = amountIn;
        amounts[1] = usdtOut;
        return amounts;
    }

    // Add this to receive ETH
    receive() external payable {}
}