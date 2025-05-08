const { ethers } = require("hardhat");

async function checkAssetOnAave() {
  const [deployer] = await ethers.getSigners();

  // Replace with your LendingPoolAddressesProvider contract address on your forked network
  const lendingPoolAddressesProviderAddress =
    "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5"; // Update with correct address
  const lendingPoolAddressesProvider = await ethers.getContractAt(
    "ILendingPoolAddressesProvider",
    lendingPoolAddressesProviderAddress,
    deployer
  );

  // Get the address of the LendingPool contract
  const lendingPoolAddress =
    await lendingPoolAddressesProvider.getLendingPool();
  const lendingPool = await ethers.getContractAt(
    "ILendingPool",
    lendingPoolAddress,
    deployer
  );

  console.log(`Lending Pool Address is ${lendingPoolAddress}`);

  // DAI token address (Make sure it's correct for your network)
  const daiAddress = "0x6b175474e89094c44da98b954eedeac495271d0f"; // Mainnet DAI

  // Call getReservesData to get information about the DAI token on Aave
  const reserveData = await lendingPool.getReserveData(daiAddress);

  // Decode the configuration
  // Decode the configuration (ensure it's a BigNumber)
  const configuration = reserveData.configuration;

  // Extract if borrowing and collateral are enabled using bitwise operations
  const isDaiCollateral = (configuration & (1 << 0)) !== 0; // Check if the first bit is set for collateral
  const isDaiBorrowable = (configuration & (1 << 1)) !== 0; // Check if the second bit is set for borrowing

  console.log(`DAI Collateral Enabled: ${isDaiCollateral}`);
  console.log(`DAI Borrowing Enabled: ${isDaiBorrowable}`);
}

checkAssetOnAave().catch((error) => {
  console.error(error);
  process.exit(1);
});
