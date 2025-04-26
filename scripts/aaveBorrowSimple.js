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
  await lendingPool.deposit(wethTokenAddress, AMOUNT, deployer, 0); // takes address of the asset it is in, amount, address of the deployer, refCode(deprecated) => 0
  console.log("deposit successfully!");
}
//youtube 19:57:44: We successfully deposit weth from weth contract into the lendingPool :)!!! go go go !!!
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
