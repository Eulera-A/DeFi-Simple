const { getWeth, AMOUNT } = require("../scripts/getWeth");
const { networkConfig } = require("../helper.hardhat-config");
const { network } = require("hardhat");
const {
  abi,
} = require("../artifacts/contracts/interfaces/IPool.sol/IPool.json");

async function main() {
  //house-keeping:
  const chainId = network.config.chainId;

  // 1st: deposit our real eth into weth contract
  await getWeth();

  // 2ed: get the lendingPool contract and link with deployer
  //const lendingPoolAddressProvider = await ethers.getContractAt();
  const { deployer } = await getNamedAccounts();
  const signer = await ethers.getSigner(deployer);

  const iPoolAddressesProviderAddress =
    networkConfig[chainId]["IPoolAddressesProvider"];
  console.log(
    `IPoolAddressesProvider Address: ${iPoolAddressesProviderAddress}`
  );
  // this is v3 ipool
  const lendingPool = await getLendingPool(
    signer,
    iPoolAddressesProviderAddress,
    abi
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

  // deposite the wethToken into the lendingPool (v2) as collateral
  // await lendingPool.deposit(wethTokenAddress, AMOUNT, deployer, 0); // takes address of the asset it is in, amount, address of the deployer, refCode(deprecated) => 0
  // console.log("deposit successfully!");

  // v3 uses supply:
  await lendingPool.supply(wethTokenAddress, AMOUNT, deployer, 0); // takes address of the asset it is in, amount, address of the deployer, refCode(deprecated) => 0
  console.log("supply successfully!");
  await confirmSupply(lendingPool, wethTokenAddress, deployer);
  const deployerAddress = await signer.getAddress();
  //await getBorrowUserData(lendingPool, deployerAddress);
  // Next is to do borrow!
  // borrowing limit check
  let { availableBorrowsBase, totalDebtBase } = await getBorrowUserData(
    lendingPool,
    deployerAddress
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
  const availableBorrowsUSDBN = availableBorrowsBase
    .mul(safetyMargin)
    .div(ethers.utils.parseUnits("1", 8));
  console.log(
    `🧮 Available borrow in USD (18 decimals): ${availableBorrowsUSDBN.toString()}`
  );

  // Convert ETH borrowing power into DAI using DAI/ETH price
  // inverse of DAI/ETH to get ETH/DAI
  const ethToDaiPrice = ethers.utils.parseUnits("1", 36).div(daiEthPrice);
  console.log(
    `the computed (by inversion) Eth to Dai price is ${ethToDaiPrice}`
  );
  const amountDaiToBorrowWei = availableBorrowsUSDBN;
  // .mul(ethToDaiPrice)
  // .div(ethers.utils.parseUnits("1", 18));
  console.log(
    `✅ you can safely borrow ${amountDaiToBorrowWei} Dai in Wei unit`
  );
  console.log(
    `✅ You can safely borrow ${ethers.utils.formatEther(amountDaiToBorrowWei)} DAI`
  );

  //await printAaveUserData(lendingPool, deployerAddress);

  // start borrowing in WEI
  const daiTokenAddress = networkConfig[chainId]["daiToken"];
  console.log(`daiTokenAddress on current chain:${daiTokenAddress}`);
  // check if Dai is borrowable  or available in the pool:
  const daiData = await lendingPool.getReserveData(daiTokenAddress);
  const aDaiAddress = daiData.aTokenAddress;
  const dai = await ethers.getContractAt("IERC20", daiTokenAddress);
  const availableLiquidity = await dai.balanceOf(aDaiAddress);
  console.log(
    `✅ Available DAI liquidity: ${ethers.utils.formatUnits(availableLiquidity, 18)} DAI`
  );

  // uncomment this to check the user stuff:
  //await printAaveUserData(lendingPool, deployer);

  await borrowDai(daiTokenAddress, lendingPool, amountDaiToBorrowWei, deployer);
  await getBorrowUserData(lendingPool, deployerAddress);

  // payback
  await repay(
    amountDaiToBorrowWei,
    daiTokenAddress,
    lendingPool,
    deployerAddress,
    signer
  );
  await getBorrowUserData(lendingPool, deployerAddress);
}

// repay
async function repay(amount, daiAddress, lendingPool, deployerAddress, signer) {
  await approveErc20(daiAddress, lendingPool.address, amount, signer);

  const repayTx = await lendingPool.repay(
    daiAddress,
    amount,
    2,
    deployerAddress
  );
  await repayTx.wait(1);
  console.log(`Repaid`);
}

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
  try {
    const borrowTx = await lendingPool.borrow(
      daiAddress,
      amountDaiToBorrowWei,
      2, // variable rate
      0,
      account
    );
    await borrowTx.wait(1);
    console.log("You've borrowed");
  } catch (error) {
    console.log(
      `❌ Borrow failed:", ${error.reason || error.message || error}`
    );
  }
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
  try {
    // Fetch user account data
    const userData = await lendingPool.getUserAccountData(account);

    // Extract the values from the userData (array of BigNumbers)
    const totalCollateralBase = userData[0]; // totalCollateralETH
    const totalDebtBase = userData[1]; // totalDebtETH
    const availableBorrowsBase = userData[2]; // availableBorrowsETH

    // Format and log the values
    console.log(
      `you have ${ethers.utils.formatUnits(totalCollateralBase, 8)} USD total deposited`
    );
    console.log(
      `you have ${ethers.utils.formatUnits(totalDebtBase, 8)} USD borrowed`
    );
    console.log(
      `you can borrow ${ethers.utils.formatUnits(availableBorrowsBase, 8)} USD`
    );

    // Return the extracted and formatted values
    return { availableBorrowsBase, totalDebtBase };
  } catch (err) {
    console.log("❌ Failed to fetch user account data", err);
    return {
      availableBorrowsBase: ethers.BigNumber.from(0),
      totalDebtBase: ethers.BigNumber.from(0),
    };
  }
}

async function printAaveUserData(lendingPool, userAddress) {
  try {
    const data = await lendingPool.getUserAccountData(userAddress);
    console.log("📊 Aave Account Data:");
    console.log(data);

    if (data.totalCollateralBase !== undefined) {
      console.log(
        `- Total Collateral (ETH): ${ethers.utils.formatEther(data.totalCollateralBase)}`
      );
    } else {
      console.log("⚠️ totalCollateralBase is undefined");
    }

    if (data.totalDebtBase !== undefined) {
      console.log(
        `- Total Debt (ETH): ${ethers.utils.formatEther(data.totalDebtBase)}`
      );
    } else {
      console.log("⚠️ totalDebtBase is undefined");
    }

    if (data.availableBorrowsBase !== undefined) {
      console.log(
        `- Available to Borrow (ETH): ${ethers.utils.formatEther(data.availableBorrowsBase)}`
      );
    } else {
      console.log("⚠️ availableBorrowsBase is undefined");
    }

    console.log(
      `- Liquidation Threshold: ${data.currentLiquidationThreshold?.toString() ?? "N/A"}`
    );
    console.log(`- Loan-To-Value (LTV): ${data.ltv?.toString() ?? "N/A"}`);

    if (data.healthFactor !== undefined) {
      console.log(
        `- Health Factor: ${ethers.utils.formatUnits(data.healthFactor, 18)}`
      );
    } else {
      console.log("⚠️ Health Factor is undefined (likely no debt/collateral)");
    }
  } catch (err) {
    console.error("❌ Failed to fetch or parse Aave user data:", err.message);
  }
}

async function getLendingPool(account, iPoolAddressesProviderAddress, abi) {
  // ILendingPoolAddressesProvider (v2) Mainnet 0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5
  // ILendingPoolAddressesProvider (v2) Sepolia Testnet: 0x88600eacb89bcbe57ab2bdac776afba6b2c105e2
  const IPoolAddressesProvider = await ethers.getContractAt(
    "IPoolAddressesProvider",
    iPoolAddressesProviderAddress,
    account
  );
  // using the getLendingPool() in the lendingPoolAddressesProvider contract
  const IPoolAddress = await IPoolAddressesProvider.getPool();
  //
  // //hardhat interface way:
  // const lendingPool = await ethers.getContractAt(
  //   "ILendingPool",
  //   lendingPoolAddress,
  //   account
  // );

  // "hard-coding" way for testing/debugging undefined contract
  const lendingPool = await ethers.getContractAt(
    "IPool",
    IPoolAddress,
    account
  );

  return lendingPool;
}

async function confirmSupply(lendingPool, assetAddress, userAddress) {
  const reserveData = await lendingPool.getReserveData(assetAddress);
  const aTokenAddress = reserveData.aTokenAddress;
  const aToken = await ethers.getContractAt("IERC20", aTokenAddress);
  const aTokenBalance = await aToken.balanceOf(userAddress);
  console.log(
    `✅ aToken balance for supplied asset: ${ethers.utils.formatEther(aTokenBalance)}`
  );
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
