// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.0;

// import {IFlashLoanReceiver} from "./IFlashLoanReceiver.sol";
// import {FlashLoanReceiverBase} from "./FlashLoanReceiverBase.sol";
// import {IPoolAddressesProvider} from "../interfaces/IPoolAddressesProvider.sol";
// import {IPool} from "../interfaces/IPool.sol";
// import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
// import {IUniswapV2Router02} from "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";

// contract SimpleFlashloanV3 is FlashLoanReceiverBase {
//     IPoolAddressesProvider public immutable addressesProvider;
//     IPool public immutable pool;
//     IUniswapV2Router02 public uniswapRouter;

//     // Event declarations
//     event FlashloanExecuted(
//         address indexed user,
//         address[] assets,
//         uint256[] amounts
//     );
//     event SwapExecuted(
//         address indexed user,
//         address fromToken,
//         address toToken,
//         uint256 amountIn,
//         uint256 amountOut
//     );

//     constructor(
//         address _addressProvider,
//         address _uniswapRouter
//     ) FlashLoanReceiverBase(IPoolAddressesProvider(_addressProvider)) {
//         addressesProvider = IPoolAddressesProvider(_addressProvider);
//         pool = IPool(addressesProvider.getPool());
//         uniswapRouter = IUniswapV2Router02(_uniswapRouter);
//     }

//     // This function is called by the Aave pool during the flashloan process
//     function executeOperation(
//         address[] calldata assets,
//         uint256[] calldata amounts,
//         uint256[] calldata premiums,
//         address initiator,
//         bytes calldata params
//     ) external override returns (bool) {
//         // Emit the FlashloanExecuted event
//         emit FlashloanExecuted(initiator, assets, amounts);

//         // Swap the flashloaned token for another token (example: USDC -> ETH)
//         address fromToken = assets[0]; // The token we borrowed (e.g., USDC)
//         address toToken = 0xC02aaA39F5cC3fDA33E2e9eA63F5B14fce0337D6; // Example: WETH address on mainnet

//         uint256 amountToSwap = amounts[0]; // Amount we borrowed
//         uint256 amountOwing = amounts[0] + premiums[0]; // Amount we need to repay

//         // Approve the Uniswap Router to spend the borrowed token
//         IERC20(fromToken).approve(address(uniswapRouter), amountToSwap);

//         // Path for the swap: [USDC -> WETH]
//         address; // Declare a memory array with 2 elements
//         path[0] = fromToken;
//         path[1] = toToken;

//         // Execute the swap on Uniswap
//         uint256[] memory amountsOut = uniswapRouter.getAmountsOut(
//             amountToSwap,
//             path
//         );
//         uint256 amountOutMin = amountsOut[1]; // Minimum amount of WETH to receive

//         // Perform the swap
//         uniswapRouter.swapExactTokensForTokens(
//             amountToSwap,
//             amountOutMin,
//             path,
//             address(this),
//             block.timestamp
//         );

//         // Now we have WETH, let's make sure we have enough to repay the loan
//         uint256 amountReceived = IERC20(toToken).balanceOf(address(this));
//         require(
//             amountReceived >= amountOwing,
//             "Not enough received to repay loan"
//         );

//         // Repay the flashloan with the swapped token (WETH in this case)
//         IERC20(toToken).approve(address(pool), amountOwing);

//         // Emit the SwapExecuted event
//         emit SwapExecuted(
//             initiator,
//             fromToken,
//             toToken,
//             amountToSwap,
//             amountReceived
//         );

//         return true;
//     }

//     function _flashloan(
//         address[] memory assets,
//         uint256[] memory amounts
//     ) internal {
//         address receiverAddress = address(this);
//         address onBehalfOf = msg.sender; // The user initiating the loan
//         bytes memory params = ""; // No custom params for now
//         uint16 referralCode = 0;

//         uint256[] memory modes = new uint256[](assets.length);
//         for (uint256 i = 0; i < assets.length; i++) {
//             modes[i] = 0; // 0 = no debt (flashloan)
//         }

//         pool.flashLoan(
//             receiverAddress,
//             assets,
//             amounts,
//             modes,
//             onBehalfOf,
//             params,
//             referralCode
//         );
//     }

//     function flashloan(address _asset) external {
//         uint256 amount = 100000000000000000; // 0.1 Ether in wei

//         address;
//         assets[0] = _asset;

//         uint256;
//         amounts[0] = amount;

//         _flashloan(assets, amounts);
//     }
// }
