const { getWeth, AMOUNT } = require("../scripts/getWeth");
const { networkConfig } = require("../helper.hardhat-config");
const { network } = require("hardhat");

async function main() {
  //house-keeping:
  const chainId = network.config.chainId;

  // 1st: deposit our real eth into weth contract
  await getWeth();

  // 2ed: get the lendingPool contract and link with deployer
  //const lendingPoolAddressProvider = await ethers.getContractAt();
  const { deployer } = await getNamedAccounts();
  const signer = await ethers.getSigner(deployer);

  const lendingPoolAddressesProviderAddress =
    networkConfig[chainId]["lendingPoolAddressesProvider"];
  console.log(
    `lendingPoolAddressesProvider Address: ${lendingPoolAddressesProviderAddress}`
  );
  const lendingPool = await getLendingPool(
    signer,
    lendingPoolAddressesProviderAddress
  );
  console.log(`LendingPool address ${lendingPool.address}`);
  // youtube to follow: 19:46:37!!! april 23
  // we already getweth on forked net :)! don't give up!!!

  //3rd: approve before deposit
  const wethTokenAddress = networkConfig[chainId]["wethToken"];
  console.log(`the wethToken address is ${wethTokenAddress}`);
  // approve our AMOUNT of weth in the wethToken contract go into the lendingPool
  await approveErc20(wethTokenAddress, lendingPool.address, AMOUNT, signer);
  console.log(
    `approved ${AMOUNT} of weth go into the lendingPool ${lendingPool.address}`
  );
  // deposite the wethToken into the lendingPool as collateral
  await lendingPool.deposit(wethTokenAddress, AMOUNT, deployer, 0); // takes address of the asset it is in, amount, address of the deployer, refCode(deprecated) => 0
  console.log("deposit successfully!");

  // Next is to do borrow!
  // borrowing limit check
  let { availableBorrowsETH, totalDebtETH } = await getBorrowUserData(
    lendingPool,
    deployer
  );

  // Fetch ETH/DAI price from Chainlink
  const daiEthAddress = networkConfig[chainId]["daiEthPriceFeed"];
  const { price: daiEthPriceRaw, priceFeedDecimals: daiEthPriceDecimals } =
    await getDaiPrice(daiEthAddress); // 18 decimals!!!!!
  console.log(`the Dai to Eth Raw Price is ${daiEthPriceRaw.toString()}`);

  const daiEthPrice = daiEthPriceRaw.mul(
    ethers.BigNumber.from("10").pow(18 - daiEthPriceDecimals)
  ); // 18 decimals
  console.log(
    `the Dai to Eth scaled Price is ${daiEthPrice.toString()} (18 decimals)`
  );

  // Apply safety margin (e.g. 90%) to avoid liquidation risk
  const safetyMargin = ethers.utils.parseUnits("0.90", 18); // 90%
  const availableBorrowsETHBN = availableBorrowsETH
    .mul(safetyMargin)
    .div(ethers.utils.parseUnits("1", 18));

  // Convert ETH borrowing power into DAI using DAI/ETH price
  // inverse of DAI/ETH to get ETH/DAI
  const ethToDaiPrice = ethers.utils.parseUnits("1", 36).div(daiEthPrice);
  console.log(
    `the computed (by inversion) Eth to Dai price is ${ethToDaiPrice}`
  );
  const amountDaiToBorrowWei = availableBorrowsETHBN
    .mul(ethToDaiPrice)
    .div(ethers.utils.parseUnits("1", 18));
  console.log(
    `✅ you can safely borrow ${amountDaiToBorrowWei} Dai in Wei unit`
  );
  console.log(
    `✅ You can safely borrow ${ethers.utils.formatEther(amountDaiToBorrowWei)} DAI`
  );

  await printAaveUserData(lendingPool, deployer);

  // start borrowing in WEI
  const daiTokenAddress = networkConfig[chainId]["daiToken"];
  console.log(`daiTokenAddress on current chain:${daiTokenAddress}`);

  //await printAaveUserData(lendingPool, deployer);

  await borrowDai(daiTokenAddress, lendingPool, amountDaiToBorrowWei, deployer);
  await getBorrowUserData(lendingPool, deployer);
}
//youtube: 20:09:14
async function borrowDai(
  daiAddress,
  lendingPool,
  amountDaiToBorrowWei,
  account
) {
  const minBorrowAmountDai = ethers.utils.parseUnits("1", 18); // 1 DAI

  if (amountDaiToBorrowWei.lt(minBorrowAmountDai)) {
    console.log(
      "❌ Borrow amount is too small. Skipping borrow to avoid revert."
    );
    return;
  }
  const borrowTx = await lendingPool.borrow(
    daiAddress,
    amountDaiToBorrowWei,
    1,
    0,
    account
  );
  await borrowTx.wait(1);
  console.log("You've borrowed");
}

// use chainlink aggregator to convert Eth into Dai
async function getDaiPrice(daiEthAddress) {
  const daiEthPriceFeed = await ethers.getContractAt(
    "AggregatorV3Interface",
    daiEthAddress
  ); // don't need to connect with deployer's account since this is pure view,not sending tx to the contract
  const price = (await daiEthPriceFeed.latestRoundData())[1];
  const priceFeedDecimals = await daiEthPriceFeed.decimals();
  console.log(`the Dai to ETH Price is ${price.toString()}`);
  console.log(`the PriceFeed decimals is ${priceFeedDecimals.toString()}`);

  return { price, priceFeedDecimals };
}

// Next is to do borrow!
// but first check your account's health factor, lest getting liquidated

async function getBorrowUserData(lendingPool, account) {
  const { totalCollateralETH, totalDebtETH, availableBorrowsETH } =
    await lendingPool.getUserAccountData(account);
  console.log(`you have ${totalCollateralETH} ETH total deposited`);
  console.log(`you have ${totalDebtETH} ETH borrowed`);
  console.log(`you can borrow ${availableBorrowsETH} ETH`);
  return { availableBorrowsETH, totalDebtETH };
}

async function printAaveUserData(lendingPool, userAddress) {
  const data = await lendingPool.getUserAccountData(userAddress);

  console.log("📊 Aave Account Data:");
  console.log(
    `- Total Collateral (ETH): ${ethers.utils.formatEther(data.totalCollateralETH)}`
  );
  console.log(
    `- Total Debt (ETH): ${ethers.utils.formatEther(data.totalDebtETH)}`
  );
  console.log(
    `- Available to Borrow (ETH): ${ethers.utils.formatEther(data.availableBorrowsETH)}`
  );
  console.log(
    `- Liquidation Threshold: ${data.currentLiquidationThreshold.toString()}`
  );
  console.log(`- Loan-To-Value (LTV): ${data.ltv.toString()}`);
  console.log(
    `- Health Factor: ${ethers.utils.formatUnits(data.healthFactor, 18)}`
  );
}

async function getLendingPool(account, lendingPoolAddressesProviderAddress) {
  // ILendingPoolAddressesProvider (v2) Mainnet 0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5
  // ILendingPoolAddressesProvider (v2) Sepolia Testnet: 0x88600eacb89bcbe57ab2bdac776afba6b2c105e2
  const lendingPoolAddressesProvider = await ethers.getContractAt(
    "ILendingPoolAddressesProvider",
    lendingPoolAddressesProviderAddress,
    account
  );
  // using the getLendingPool() in the lendingPoolAddressesProvider contract
  const lendingPoolAddress =
    await lendingPoolAddressesProvider.getLendingPool();
  const lendingPool = await ethers.getContractAt(
    "ILendingPool",
    lendingPoolAddress,
    account
  );
  return lendingPool;
}

async function approveErc20(
  erc20Address,
  spenderAddress,
  amountToSpend,
  account
) {
  const erc20Token = await ethers.getContractAt(
    "IERC20",
    erc20Address,
    account
  );
  const tx = await erc20Token.approve(spenderAddress, amountToSpend);
  await tx.wait();
  console.log("Approved spending to the spender!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
