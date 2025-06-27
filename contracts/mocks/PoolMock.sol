// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IFlashLoanReceiver {
    function executeOperation(
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata premiums,
        address initiator,
        bytes calldata params
    ) external returns (bool);
}

contract PoolMock {
    // Simulate the Aave flashLoan function
    function flashLoan(
        address receiverAddress, // this is the SimpleFlashLoanV3 contract address, the contract is The Receiver
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata modes, // not used in mock
        address onBehalfOf, // not used in mock
        bytes calldata params,
        uint16 referralCode // not used in mock
    ) external {
        // Step 1: Transfer the loan amount to the receiver
        for (uint i = 0; i < assets.length; i++) {
            bool sent = IERC20(assets[i]).transfer(receiverAddress, amounts[i]);
            require(sent, "PoolMock: Transfer failed");
        }

        // Step 2: Build premiums (0.05%)
        uint256[] memory premiums = new uint256[](amounts.length);
        for (uint i = 0; i < amounts.length; i++) {
            premiums[i] = amounts[i] / 2000; // 0.05%
        }

        // Step 3: Call the receiver’s executeOperation
        bool success = IFlashLoanReceiver(receiverAddress).executeOperation(
            assets,
            amounts,
            premiums,
            msg.sender,
            params
        );
        require(success, "PoolMock: executeOperation failed");

        // Step 4: After executeOperation returns, verify repayment
        for (uint i = 0; i < assets.length; i++) {
            uint256 amountOwing = amounts[i] + premiums[i];

            // Check allowance first
            uint256 allowance = IERC20(assets[i]).allowance(
                receiverAddress,
                address(this)
            );
            require(
                allowance >= amountOwing,
                "PoolMock: Insufficient allowance for repayment"
            );

            // Pull repayment
            bool repaid = IERC20(assets[i]).transferFrom(
                receiverAddress,
                address(this),
                amountOwing
            );
            require(repaid, "PoolMock: Repayment transfer failed");
        }
    }
}
