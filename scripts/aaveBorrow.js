const { getNamedAccounts, ethers, network } = require("hardhat");
const { getWeth, AMOUNT } = require("../scripts/getWeth");
const { ethers } = require("ethers");
const { networkConfig } = require("../helper-hardhat-config");
async function main() {
  // this protocol treats all as ERC20 token
  await getWeth();
  const { deployer } = await getNamedAccounts();
  const lendingPool = await getLendingPool(deployer);
  console.log(`LendingPool address ${lendingPool.address}`);

  //deposit :
  //  // weth address via aave on ethereum mainnet
  const wethTokenAddress = "0xC02aaA39b223FE8D0A0e5C4F27EAd9083C756Cc2";
  //approve deposit
  await approveErc20(wethTokenAddress, lendingPool.address, AMOUNT, deployer);
  console.log("Depositing...");
  await lendingPool.deposite(wethTokenAddress, AMOUNT, deployer, 0);
  console.log("Deposited from wethTokenAddress to deployer");

  //before we borrow, we check:
  // we need to know: how much we have borrowed. how much we have in collateral,
  // how much we can borrow
  let { availableBorrowsETH, totalDebtETH } = await getBorrowUserData(
    lendingPool,
    deployer
  );
  const daiPrice = await getDaiPrice();
  const amountDaiToBorrow =
    availableBorrowsETH.toString() * 0.95 * (1 / daiPrice);
  console.log(`you can borrow ${amountDaiToBorrow} DAI`);
  const amountDaiToBorroWei = ethers.utils.parseEther(
    amountDaiToBorrow.toString()
  );
  // borrow time!
  // dai contract address on etherscan: 0x6B175474E89094C44Da98b954EedeAC495271d0F
  const daiTokenAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  await borrowDai(daiTokenAddress, lendingPool, amountDaiToBorroWei, deployer);
  await getBorrowUserData(lendingPool, account);
  //repay
  await repay(amountDaiToBorroWei, daiTokenAddress, lendingPool, deployer);
} //youtube: 20:13:35

// borrow function:
async function borrowDai(
  daiAddress,
  lendingPool,
  amountDaiToBorroWei,
  account
) {
  const borrowTx = await lendingPool.borrow(
    daiAddress,
    amountDaiToBorrow,
    1,
    0,
    account
  );
  await borrowTx.wait();
  console.log("You've borrowed !");
}
// repay
async function repay(amount, daiAddress, lendingPool, account) {
  await approveErc20(daiAddress, lendingPool.address, amount, account);
  const repayTx = await lendingPool.repay(daiAddress, amount, 1, account);
  await repayTx.wait(1);
  console.log("Repaid");
}

async function getDaiPrice() {
  // DAI/USD price feed address on eth(chainlink) : 0x5f4ec3df9cbd43714fe2740f5e3616155c5b8419
  const daiEthPriceFeed = await ethers.getContractAt(
    "AggregatorV3Interface",
    "0x5f4ec3df9cbd43714fe2740f5e3616155c5b8419"
  );
  const price = (await daiEthPriceFeed.latestRoundData())[1];
  console.log(`The DAI/ETH price is ${price.toString()})`);
  return price;
}

async function getBorrowUserData(lendingPool, account) {
  const { totalCollateralETH, totalDebtETH, availableBorrowsETH } =
    await lendingPool.getBorrowUserData(account);
  console.log(`you have total ${totalCollateralETH} ETH deposited. `);
  console.log(`You have ${totalDebtETH} ETH borrowed`);
  console.log(`Your available borrow amount of ETH: ${availableBorrowsETH}.`);
  return { availableBorrowsETH, totalDebtETH };
}

// aave v2 eth mainnet contract address: 0x7d2768dE32b0b80b9c10B4D2131e6D3b4e2e2B18
async function getLendingPool(account) {
  const lendingPoolAddressesProvider = await ethers.getContractAt(
    "ILendingPoolAddressesProvider",
    "0x7d2768dE32b0b80b9c10B4D2131e6D3b4e2e2B18",
    account
  );
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
  console.log("Approved!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
// youtube 19:55:07
