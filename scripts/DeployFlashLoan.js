const { ethers, network, config } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);
  console.log(`🔗 Network: ${network.name}`);

  let addressProvider;
  let uniswapRouter;
  let tokenOut;
  let minSwappedOutAmount;

  if (network.name === "sepolia") {
    addressProvider = config.networks.sepolia.PoolAddressProvider;
    uniswapRouter = config.networks.sepolia.UniswapV2Router;
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
      tokenIn.address,
      tokenOutMock.address
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

  const Flashloan = await ethers.getContractFactory("UniswapSimpleFlashLoan");
  const flashloan = await Flashloan.deploy(
    addressProvider,
    uniswapRouter,
    tokenOut,
    minSwappedOutAmount
  );
  await flashloan.deployed();

  console.log("✅ Flashloan contract deployed to:", flashloan.address);
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
