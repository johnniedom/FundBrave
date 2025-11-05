// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ISwapAdapter
 * @dev Our internal standard interface for all swap contracts.
 * This abstracts away the complexity of Uniswap, Relay, etc.
 */
interface ISwapAdapter {
    /**
     * @dev Swaps an ERC20 token to USDT.
     * The adapter MUST be approved to spend the token *before* this is called.
     */
    function swapToUSDT(address tokenIn, uint256 amountIn)
        external
        returns (uint256 usdtAmountOut);

    /**
     * @dev Swaps native ETH/MATIC to USDT.
     */
    function swapNativeToUSDT()
        external
        payable
        returns (uint256 usdtAmountOut);
}