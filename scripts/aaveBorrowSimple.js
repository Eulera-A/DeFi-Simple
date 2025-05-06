const { getWeth, AMOUNT } = require("../scripts/getWeth");
const { networkConfig } = require("../helper.hardhat-config");
const { network } = require("hardhat");

async function main() {
  // 1st: deposit our real eth into weth contract
  await getWeth();

  // 2ed: get the lendingPool contract and link with deployer
  //const lendingPoolAddressProvider = await ethers.getContractAt();
  const { deployer } = await getNamedAccounts();
  const signer = await ethers.getSigner(deployer);

  const lendingPool = await getLendingPool(signer);
  console.log(`LendingPool address ${lendingPool.address}`);
  // youtube to follow: 19:46:37!!! april 23
  // we already getweth on forked net :)! don't give up!!!

  //3rd: approve before deposit
  const chainId = network.config.chainId;
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

  //  eth to dai pricefeed check:
  // Chainlink Eth/dai price (8 decimals)
  //const daiPriceRaw = await getDaiPrice(); // returns BigNumber
  const ethDaiPriceRaw = await getDaiPrice(); // 8 decimals
  const ethDaiPrice = ethDaiPriceRaw.mul(ethers.BigNumber.from("10").pow(10)); // scale back to 18 decimals

  // availableBorrowsETH is already in 18 decimals
  const safetyMargin = ethers.utils.parseUnits("0.95", 18);
  const availableBorrowsETHBN = availableBorrowsETH
    .mul(safetyMargin)
    .div(ethers.utils.parseUnits("1", 18));

  // Calculate how much DAI to borrow
  const amountDaiToBorrowWei = availableBorrowsETHBN
    .mul(ethDaiPrice)
    .div(ethers.utils.parseUnits("1", 18));

  console.log(
    `✅ You can safely borrow ${ethers.utils.formatEther(amountDaiToBorrowWei)} DAI`
  );

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
async function getDaiPrice() {
  const daiEthPriceFeed = await ethers.getContractAt(
    "AggregatorV3Interface",
    "0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9"
  ); // don't need to connect with deployer's account since this is pure view,not sending tx to the contract
  const price = (await daiEthPriceFeed.latestRoundData())[1];
  console.log(`the Dai to Eth Price is ${price.toString()}`);
  return price;
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

async function getLendingPool(account) {
  // ILendingPoolAddressesProvider (v2) Mainnet 0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5
  // ILendingPoolAddressesProvider (v2) Sepolia Testnet: 0x88600eacb89bcbe57ab2bdac776afba6b2c105e2
  const lendingPoolAddressesProvider = await ethers.getContractAt(
    "ILendingPoolAddressesProvider",
    "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5",
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
