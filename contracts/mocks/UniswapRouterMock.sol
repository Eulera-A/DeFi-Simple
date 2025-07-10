// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";

interface IUniswapRouter {
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory);

    function swapTokensForExactTokens(
        uint256 amountOut,
        uint256 amountInMax,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory);
}

contract UniswapRouterMock is IUniswapRouter {
    address public immutable tokenInAsset;

    constructor(address _tokenInAsset) {
        tokenInAsset = _tokenInAsset;
    }

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256, // amountOutMin (unused in mock)
        address[] calldata path,
        address to,
        uint256 // deadline (unused in mock)
    ) external override returns (uint256[] memory amounts) {
        IERC20 from = IERC20(path[0]);
        IERC20 toToken = IERC20(path[1]);

        // Burn input tokens from msg.sender
        require(
            from.transferFrom(msg.sender, address(this), amountIn),
            "transferFrom failed"
        );

        // Determine swap direction
        uint256 outputAmount;
        if (path[0] == tokenInAsset) {
            // TokenIn → TokenOut (e.g., WETH → DAI)
            outputAmount = (amountIn * 105) / 100; // simulate +5% gain
        } else {
            // TokenOut → TokenIn (e.g., DAI → WETH)
            outputAmount = (amountIn * 99) / 100; // simulate -1% loss
        }
        console.log("RouterMock outputAmount:", outputAmount);

        require(toToken.transfer(to, outputAmount), "transfer failed");

        amounts = new uint256[](2);
        amounts[0] = amountIn;
        amounts[1] = outputAmount;
    }

    function swapTokensForExactTokens(
        uint256 amountOut,
        uint256 amountInMax,
        address[] calldata path,
        address to,
        uint256
    ) external override returns (uint256[] memory amounts) {
        IERC20 from = IERC20(path[0]);
        IERC20 toToken = IERC20(path[1]);

        uint256 amountInRequired;

        if (path[1] == tokenInAsset) {
            // simulate slippage: need more input to get exact output
            amountInRequired = (amountOut * 103) / 100; // e.g. +3% cost
        } else {
            amountInRequired = (amountOut * 98) / 100; // e.g. -2% cost
        }

        require(
            amountInRequired <= amountInMax,
            "UniswapMock: Excessive input"
        );

        require(
            from.transferFrom(msg.sender, address(this), amountInRequired),
            "transferFrom failed"
        );
        require(toToken.transfer(to, amountOut), "transfer failed");

        amounts = new uint256[](2);
        amounts[0] = amountInRequired;
        amounts[1] = amountOut;
    }
}
