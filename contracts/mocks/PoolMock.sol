// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PoolMock {
    address public lastFlashloanReceiver;
    address[] public lastFlashloanAssets;
    uint256[] public lastFlashloanAmounts;
    address public lastOnBehalfOf;
    bytes public lastParams;

    function flashLoan(
        address receiverAddress,
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata modes,
        address onBehalfOf,
        bytes calldata params,
        uint16 referralCode
    ) external {
        // Store for test verification
        lastFlashloanReceiver = receiverAddress;
        lastFlashloanAssets = assets;
        lastFlashloanAmounts = amounts;
        lastOnBehalfOf = onBehalfOf;
        lastParams = params;

        // Call back into the receiver contract (your flashloan logic)
        IFlashLoanReceiver(receiverAddress).executeOperation(
            assets,
            amounts,
            _buildPremiums(amounts), // mock premiums
            msg.sender,
            params
        );
    }

    function _buildPremiums(
        uint256[] calldata amounts
    ) private pure returns (uint256[] memory premiums) {
        premiums = new uint256[](amounts.length);
        for (uint256 i = 0; i < amounts.length; i++) {
            premiums[i] = amounts[i] / 1000; // mock 0.1% fee
        }
    }
}

interface IFlashLoanReceiver {
    function executeOperation(
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata premiums,
        address initiator,
        bytes calldata params
    ) external returns (bool);
}
