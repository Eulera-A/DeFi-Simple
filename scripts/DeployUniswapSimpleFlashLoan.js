// scripts/deploy.js
const hre = require("hardhat");
const { networkConfig } = require("../helper.hardhat-config");
const { ethers, network, config } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);
  console.log(`🔗 Network: ${network.name}`);

  let addressProvider;
  let uniswapRouter;
  let tokenOut;
  let minSwappedOutAmount;

  console.log("Deploying contract with account:", deployer.address);
  if (network.name === "sepolia") {
    addressProvider = config.networks.sepolia.PoolAddressProvider;
    uniswapRouter = config.networks.sepolia.UniswapV3Router;
    tokenOut = "0xdDe5B6e2299E03d5F88F92843C2F6F4c93E22D64"; // DAI or custom
    minSwappedOutAmount = ethers.utils.parseUnits("10", 18); // 10 tokenOut
  } else if (network.name === "hardhat" && network.config.forking?.enabled) {
    console.log(
      "🧪 Local network on forked mainnet detected, deploying on forked mainnet"
    );

    addressProvider = config.networks.localhost.PoolAddressProvider;
    uniswapRouter = config.networks.localhost.UniswapV3Router;
    console.log("addressProvider", addressProvider);
    console.log("router V3:", uniswapRouter);
    tokenOut = "0xdDe5B6e2299E03d5F88F92843C2F6F4c93E22D64"; // DAI or custom
    minSwappedOutAmount = ethers.utils.parseUnits("10", 18); // 10 tokenOut
  } else if (network.name === "localhost" || network.name === "hardhat") {
    console.log("🧪 Local network detected: deploying mocks...");

    const initialSupply = ethers.utils.parseUnits("1000", 18); // 1000 tokens
    const deployerAddress = deployer.address;

    const TokenMock = await ethers.getContractFactory("ERC20Mock");
    const tokenIn = await TokenMock.deploy(
      "MockTokenIn",
      "TIN",
      deployerAddress,
      initialSupply
    );
    const tokenOutMock = await TokenMock.deploy(
      "MockTokenOut",
      "TOUT",
      deployerAddress,
      initialSupply
    );
    console.log("Mock Token Out deployed");

    const RouterMock = await ethers.getContractFactory("UniswapRouterMock");
    const routerMock = await RouterMock.deploy(
      tokenIn.address
      //tokenOutMock.address
    );

    const PoolMock = await ethers.getContractFactory("PoolMock");
    const poolMock = await PoolMock.deploy();

    console.log("Mock Pool deployed");

    const ProviderMock = await ethers.getContractFactory("ProviderMock");
    const providerMock = await ProviderMock.deploy(poolMock.address);
    console.log("pool address provider mock deployed");

    addressProvider = providerMock.address;
    uniswapRouter = routerMock.address;
    tokenOut = tokenOutMock.address;
    minSwappedOutAmount = ethers.utils.parseUnits("10", 18); // 10 tokens
  } else {
    throw new Error(`Unsupported network: ${network.name}`);
  }

  const FlashLoan = await hre.ethers.getContractFactory("UniswapFlashLoan");
  const contract = await FlashLoan.deploy(addressProvider, uniswapRouter);

  //await contract.waitForDeployment();// for ether v6
  await contract.deployed(); // ✅ ethers v5 equivalent

  console.log("✅ Flashloan contract deployed to:", await contract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
