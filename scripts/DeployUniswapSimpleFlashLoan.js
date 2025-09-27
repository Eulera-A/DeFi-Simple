// scripts/deploy.js
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contract with account:", deployer.address);

  // ✅ Sepolia Aave v3 PoolAddressesProvider
  const AAVE_ADDRESS_PROVIDER = "0x220C7a5c207B6C2F69EF4aD0d3B23C1F2DfccEd0";

  // ✅ Sepolia Uniswap V3 SwapRouter
  const UNISWAP_V3_ROUTER = "0xE592427A0AEce92De3Edee1F18E0157C05861564";

  const FlashLoan = await hre.ethers.getContractFactory("UniswapV3FlashLoan");
  const contract = await FlashLoan.deploy(
    AAVE_ADDRESS_PROVIDER,
    UNISWAP_V3_ROUTER
  );

  await contract.waitForDeployment();

  console.log(
    "✅ Flashloan contract deployed to:",
    await contract.getAddress()
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
