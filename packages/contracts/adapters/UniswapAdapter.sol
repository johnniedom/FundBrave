// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/ISwapAdapter.sol";
import "../interfaces/ISwapRouter.sol"; 
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title UniswapAdapter
 * @dev Implements our ISwapAdapter for a standard Uniswap V2 router.
 */
contract UniswapAdapter is ISwapAdapter {
    using SafeERC20 for IERC20;

    IUniswapRouter public immutable uniswapRouter;
    address public immutable USDT;
    address public immutable WETH;

    constructor(address _router, address _usdt, address _weth) {
        uniswapRouter = IUniswapRouter(_router);
        USDT = _usdt;
        WETH = _weth;
    }

    function swapToUSDT(address tokenIn, uint256 amountIn)
        external
        returns (uint256)
    {
        if (tokenIn == USDT) return amountIn;

        // 1. Pull tokens from the CALLER (our Factory/Bridge)
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
        
        // 2. Approve the *real* router
        IERC20(tokenIn).safeApprove(address(uniswapRouter), amountIn);
        
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = USDT;

        // 3. Swap. Send proceeds back to the CALLER
        uint256[] memory amounts = uniswapRouter.swapExactTokensForTokens(
            amountIn, 0, path, msg.sender, block.timestamp
        );
        return amounts[1];
    }

    function swapNativeToUSDT()
        external
        payable
        returns (uint256)
    {
        address[] memory path = new address[](2);
        path[0] = WETH;
        path[1] = USDT;

        // Swap. Send proceeds back to the CALLER
        uint256[] memory amounts = uniswapRouter.swapExactETHForTokens{value: msg.value}(
            0, path, msg.sender, block.timestamp
        );
        return amounts[1];
    }
}