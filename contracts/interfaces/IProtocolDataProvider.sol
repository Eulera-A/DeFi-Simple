// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IProtocolDataProvider {
    function getAllReservesTokens() external view returns (address[] memory);
}
