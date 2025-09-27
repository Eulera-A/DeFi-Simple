// contracts/UniswapV3FlashLoan.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {IFlashLoanReceiver} from "./IFlashLoanReceiver.sol";
import {FlashLoanReceiverBase} from "./FlashLoanReceiverBase.sol";
import {IPoolAddressesProvider} from "../interfaces/IPoolAddressesProvider.sol";
import {IPool} from "../interfaces/IPool.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ISwapRouter} from "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";

contract UniswapV3FlashLoan is FlashLoanReceiverBase {
    IPoolAddressesProvider public immutable addressesProvider;
    IPool public immutable pool;
    ISwapRouter public immutable swapRouter;

    uint24 public constant poolFee = 3000; // 0.3%

    constructor(
        address _addressProvider,
        address _swapRouter
    ) FlashLoanReceiverBase(IPoolAddressesProvider(_addressProvider)) {
        addressesProvider = IPoolAddressesProvider(_addressProvider);
        pool = IPool(addressesProvider.getPool());
        swapRouter = ISwapRouter(_swapRouter);
    }

    function executeOperation(
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata premiums,
        address initiator,
        bytes calldata params
    ) external override returns (bool) {
        (address user, address tokenOut, uint256 minOut) = abi.decode(
            params,
            (address, address, uint256)
        );

        for (uint256 i = 0; i < assets.length; i++) {
            address tokenIn = assets[i];
            uint256 amountIn = amounts[i];

            // Swap tokenIn -> tokenOut
            IERC20(tokenIn).approve(address(swapRouter), amountIn);

            ISwapRouter.ExactInputSingleParams memory swapParams = ISwapRouter
                .ExactInputSingleParams({
                    tokenIn: tokenIn,
                    tokenOut: tokenOut,
                    fee: poolFee,
                    recipient: address(this),
                    deadline: block.timestamp,
                    amountIn: amountIn,
                    amountOutMinimum: minOut,
                    sqrtPriceLimitX96: 0
                });

            uint256 amountOut = swapRouter.exactInputSingle(swapParams);

            // Swap back tokenOut -> tokenIn to repay flashloan
            uint256 amountOwing = amountIn + premiums[i];

            IERC20(tokenOut).approve(address(swapRouter), amountOut);

            ISwapRouter.ExactOutputSingleParams memory reverseSwap = ISwapRouter
                .ExactOutputSingleParams({
                    tokenIn: tokenOut,
                    tokenOut: tokenIn,
                    fee: poolFee,
                    recipient: address(this),
                    deadline: block.timestamp,
                    amountOut: amountOwing,
                    amountInMaximum: amountOut,
                    sqrtPriceLimitX96: 0
                });

            swapRouter.exactOutputSingle(reverseSwap);

            // Approve Aave to pull repayment
            IERC20(tokenIn).approve(address(pool), amountOwing);
        }

        return true;
    }

    function flashloan(
        address[] calldata assets,
        uint256[] calldata amounts,
        address tokenOut,
        uint256 minOut
    ) external {
        require(assets.length == amounts.length, "Mismatched inputs");

        uint256[] memory modes = new uint256[](assets.length);
        for (uint256 i = 0; i < assets.length; i++) {
            modes[i] = 0; // 0 = flashloan
        }

        bytes memory params = abi.encode(msg.sender, tokenOut, minOut);

        pool.flashLoan(
            address(this),
            assets,
            amounts,
            modes,
            msg.sender,
            params,
            0
        );
    }
}
