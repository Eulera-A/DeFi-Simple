// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ProviderMock {
    address private _pool;

    constructor(address poolAddress) {
        _pool = poolAddress;
    }

    function getPool() external view returns (address) {
        return _pool;
    }
}
