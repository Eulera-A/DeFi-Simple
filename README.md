contract abi get from compile-> artifacts/
ethers.getContractAt(,,signer) must be a signer object!!! Don't put in deployer = await getNamedAccount() which returns an address type.

do ethers.getSigner(deployer) => signer type

Steps:

1. convert eth into wrapped ether (erc20 token type): by depositing our real eth/faucet into the wethToken contract as weth.

2. get the lendingPool address from the aave lendingPoolProvider contract on mainnet

3. need to approve the weth we deposite into the wethtoken address tranfer into the lendingPool contract

4. deposit your weth into the pool
