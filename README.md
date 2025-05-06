contract abi get from compile-> artifacts/
ethers.getContractAt(,,signer) must be a signer object!!! Don't put in deployer = await getNamedAccount() which returns an address type.

do ethers.getSigner(deployer) => signer type

Steps:

1. convert eth into wrapped ether (erc20 token type): by depositing our real eth/faucet into the wethToken contract as weth.

2. get the lendingPool address from the aave lendingPoolProvider contract on mainnet

3. need to approve the weth we deposite into the wethtoken address tranfer into the lendingPool contract

4. deposit your weth into the pool

5. Time to Borrow:
   need to check how much you can borrow
   if your account health factor falls before 1, you get liquidated

6. Borrow the DAI from the DaiToken contract (on-chain)
