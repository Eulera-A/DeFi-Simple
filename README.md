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

🔄 Flashloan Workflow Breakdown

1. Initiator calls flashloan() on UniswapSimpleFlashLoan
   The UniswapSimpleFlashLoan contract is both the receiver and the user-defined logic executor.

It tells the lending pool (PoolMock) to send it assets (e.g. WETH) as a flashloan.

2. PoolMock sends WETH to UniswapSimpleFlashLoan
   Simulates Aave V3 behavior:

Sends requested amount of WETH to UniswapSimpleFlashLoan.

Then calls back to UniswapSimpleFlashLoan.executeOperation(...).

✅ Yes, PoolMock can directly send the asset — just like Aave does.

3. Inside executeOperation(), this happens:
   tokenIn.approve(router, amounts[i]);
   router.swapExactTokensForTokens(...); // WETH → DAI
   Flashloaned WETH is approved for use by Uniswap router.

A mock swap is executed: WETH → DAI.

Your contract now holds more DAI than the original WETH amount (e.g., 2% profit simulated by the mock).

4. Then a second swap is performed:
   router.swapExactTokensForTokens(...); // DAI → WETH
   Just enough DAI is swapped back into WETH to repay the loan plus premium.

The contract holds some profit in leftover DAI (or WETH if you over-swapped).

5. Approve PoolMock to pull repayment:
   tokenIn.approve(pool, amountOwing);
   Lets PoolMock pull the exact amount owed (original loan + fee) from UniswapSimpleFlashLoan.
