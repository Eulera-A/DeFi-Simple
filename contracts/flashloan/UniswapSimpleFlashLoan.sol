// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IFlashLoanReceiver} from "./IFlashLoanReceiver.sol";
import {FlashLoanReceiverBase} from "./FlashLoanReceiverBase.sol";
import {IPoolAddressesProvider} from "../interfaces/IPoolAddressesProvider.sol";
import {IPool} from "../interfaces/IPool.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IUniswapRouter {
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory);
}

contract UniswapSimpleFlashLoan is FlashLoanReceiverBase {
    IPoolAddressesProvider public immutable addressesProvider;
    IPool public immutable pool;
    address public router; // Uniswap router
    address public immutable tokenOutAddress;
    uint256 public immutable minSwappedOutAmount;

    constructor(
        address _addressProvider,
        address _router,
        address _tokenOutAddress,
        uint256 _minSwappedOutAmount
    ) FlashLoanReceiverBase(IPoolAddressesProvider(_addressProvider)) {
        addressesProvider = IPoolAddressesProvider(_addressProvider);
        pool = IPool(addressesProvider.getPool());
        router = _router;
        tokenOutAddress = _tokenOutAddress;
        minSwappedOutAmount = _minSwappedOutAmount;
    }

    function executeOperation(
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata premiums,
        address initiator,
        bytes calldata params
    ) external override returns (bool) {
        address user = abi.decode(params, (address));

        // uniswap process:

        for (uint256 i = 0; i < assets.length; i++) {
            IERC20 tokenIn = IERC20(assets[i]); // the flash-borrowed WETH
            address tokenOut = address(tokenOutAddress); // your choice of swapped currencies, DAI/USDC etc...

            // Approve router to spend flashloaned tokenIn
            tokenIn.approve(router, amounts[i]);

            // Prepare swap path
            address[] memory path = new address[](2);
            path[0] = assets[i];
            path[1] = tokenOut;

            // Simulate swap for profit
            IUniswapRouter(router).swapExactTokensForTokens(
                amounts[i],
                minSwappedOutAmount, // accept any amount for mock only!!! Not safe for mainnet!!!
                path,
                address(this), // receive the swapped tokens into this same contract
                block.timestamp // deadline for swap
            );

            // swap back my WETH so i can pay back the loan
            // After getting tokenOut (e.g., DAI), swap some of it back to WETH

            // Calculate amount to repay
            uint256 amountOwing = amounts[i] + premiums[i];

            // Swap back tokenOut -> tokenIn to repay loan
            IERC20(tokenOut).approve(router, type(uint256).max);
            address[] memory reversePath = new address[](2);
            reversePath[0] = tokenOut; // the swapped token
            reversePath[1] = assets[i]; // the WETH/ flash borrowed assets

            IUniswapRouter(router).swapExactTokensForTokens(
                amountOwing,
                0,
                reversePath,
                address(this),
                block.timestamp
            );

            // Approve repayment
            tokenIn.approve(address(pool), amountOwing);
        }

        return true;
    }

    function flashloan(
        address[] calldata assets,
        uint256[] calldata amounts
    ) external {
        require(assets.length == amounts.length, "Mismatched inputs");

        uint256[] memory modes = new uint256[](assets.length);
        for (uint256 i = 0; i < assets.length; i++) {
            modes[i] = 0; // 0 = flashloan
        }

        bytes memory params = abi.encode(msg.sender);

        pool.flashLoan(
            address(this), //receiver (the flashloan contract)
            assets, // asset flash-borrowed
            amounts, // amount flash-borrowed
            modes, //mode 0 for flash loan!! always
            msg.sender, //on beHalf of, which is the user!
            params, // passed to executeOperations
            0 // referralCode
        );
    }
}
