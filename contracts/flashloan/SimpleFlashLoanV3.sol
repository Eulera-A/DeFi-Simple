// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

//import "@openzeppelin/contracts/access/Ownable.sol";
import {IFlashLoanReceiver} from "./IFlashLoanReceiver.sol";
import {FlashLoanReceiverBase} from "./FlashLoanReceiverBase.sol";

import {IPoolAddressesProvider} from "../interfaces/IPoolAddressesProvider.sol";
import {IPool} from "../interfaces/IPool.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SimpleFlashloanV3 is FlashLoanReceiverBase {
    IPoolAddressesProvider public immutable addressesProvider;
    IPool public immutable pool;

    constructor(
        address _addressProvider
    ) FlashLoanReceiverBase(IPoolAddressesProvider(_addressProvider)) {
        addressesProvider = IPoolAddressesProvider(_addressProvider);
        pool = IPool(addressesProvider.getPool());
    }

    function executeOperation(
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata premiums,
        address initiator,
        bytes calldata params
    ) external override returns (bool) {
        // Pending, decode and use params
        // address user = abi.decode(params, (address));

        // Pending Implement logic for interacting with dAPP (e.g. swapping, arbitrage)

        for (uint256 i = 0; i < assets.length; i++) {
            uint256 amountOwing = amounts[i] + premiums[i];
            IERC20(assets[i]).approve(address(pool), amountOwing);
        }

        return true;
    }

    /// @notice Publicly callable by any user
    /// @param assets List of token addresses to flashloan
    /// @param amounts List of amounts (same order as assets)

    function flashloan(
        address[] calldata assets,
        uint256[] calldata amounts
    ) external {
        require(assets.length == amounts.length, "Mismatched inputs");

        // Modes: 0 = no debt (flashloan), 1 = stable rate regular borrow, 2 = variable
        uint256[] memory modes = new uint256[](assets.length);
        for (uint256 i = 0; i < assets.length; i++) {
            modes[i] = 0;
        }

        // Encode msg.sender into params for potential use in executeOperation
        bytes memory params = abi.encode(msg.sender);

        pool.flashLoan(
            address(this), // receiverAddress
            assets,
            amounts,
            modes,
            msg.sender, // onBehalfOf = caller's wallet
            params,
            0 // referralCode
        );
    }

    // function _flashloan(
    //     address[] memory assets,
    //     uint256[] memory amounts
    // ) internal {
    //     address receiverAddress = address(this);
    //     address onBehalfOf = address(this);
    //     bytes memory params = "";
    //     uint16 referralCode = 0;

    //     uint256[] memory modes = new uint256[](assets.length);
    //     for (uint256 i = 0; i < assets.length; i++) {
    //         modes[i] = 0;
    //     }

    //     pool.flashLoan(
    //         receiverAddress,
    //         assets,
    //         amounts,
    //         modes,
    //         onBehalfOf,
    //         params,
    //         referralCode
    //     );
    // }

    // function flashloan(address _asset) public {
    //     bytes memory data = "";
    //     uint256 amount = 100000000000000000;

    //     address[] memory assets = new address[](1);
    //     assets[0] = _asset;

    //     uint256[] memory amounts = new uint256[](1);
    //     amounts[0] = amount;

    //     _flashloan(assets, amounts);
    // }
}
