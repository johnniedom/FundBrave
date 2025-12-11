// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/ISwapAdapter.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

struct SwapDescription {
    address srcToken;
    address dstToken;
    address payable srcReceiver;
    address payable dstReceiver;
    uint256 amount;
    uint256 minReturnAmount;
    uint256 flags;
}

interface IAggregationRouterV5 {
    function swap(
        address executor,
        SwapDescription calldata desc,
        bytes calldata permits,
        bytes calldata data
    ) external payable returns (uint256 returnAmount, uint256 spentAmount);
}

contract OneInchAdapter is ISwapAdapter, Ownable {
    using SafeERC20 for IERC20;

    address public immutable ONE_INCH_ROUTER;
    address public immutable USDC;
    address public immutable WETH;
    bytes public nextSwapData;
    address public nextExecutor;

    constructor(address _router, address _usdc, address _weth, address _owner) Ownable(_owner) {
        ONE_INCH_ROUTER = _router;
        USDC = _usdc;
        WETH = _weth;
    }

    /**
     * @dev Call this BEFORE triggering the Bridge or Factory action.
     * Pass the 'tx.data' you get from the 1inch API response.
     */
    function setSwapData(address _executor, bytes calldata _data) external onlyOwner {
        nextExecutor = _executor;
        nextSwapData = _data;
    }

    function swapToUSDT(address tokenIn, uint256 amountIn) external override returns (uint256 amountOut) {
        if (tokenIn == USDC) return amountIn;
        require(nextSwapData.length > 0, "1inch: No swap data set");

        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);

        IERC20(tokenIn).forceApprove(ONE_INCH_ROUTER, amountIn);

        SwapDescription memory desc = SwapDescription({
            srcToken: tokenIn,
            dstToken: USDC,
            srcReceiver: payable(address(this)), 
            dstReceiver: payable(address(this)),
            amount: amountIn,
            minReturnAmount: 1,
            flags: 0
        });
        
        try IAggregationRouterV5(ONE_INCH_ROUTER).swap(
            nextExecutor,
            desc,
            "",
            nextSwapData
        ) returns (uint256 retAmount, uint256) {
            amountOut = retAmount;
        } catch {
            revert("1inch Swap Failed");
        }

        delete nextSwapData;
        delete nextExecutor;

        IERC20(USDC).safeTransfer(msg.sender, amountOut);

        return amountOut;
    }

    function swapNativeToUSDT() external payable override returns (uint256 amountOut) {
        return 0;
    }
}