const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("UniswapSimpleFlashLoan", function () {
  let flashloan;
  let poolMock;
  let routerMock;
  let tokenIn; // e.g. WETH mock
  let tokenOut; // e.g. DAI mock
  let providerMock;

  const initialMint = ethers.utils.parseUnits("10000", 18); // mint 10k tokens
  const flashloanAmount = ethers.utils.parseUnits("500", 18);
  const minSwappedOutAmount = ethers.utils.parseUnits("1000", 18); // arbitrary min amount

  beforeEach(async () => {
    // Deploy ERC20 Mocks (tokenIn and tokenOut)
    const [deployer, user] = await ethers.getSigners();

    const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
    tokenIn = await ERC20Mock.deploy(
      "TokenIn",
      "TIN",
      deployer.address,
      initialMint
    );
    tokenOut = await ERC20Mock.deploy(
      "TokenOut",
      "TOUT",
      deployer.address,
      initialMint
    );

    // Deploy UniswapRouterMock with tokenIn as the profit trigger
    const RouterMock = await ethers.getContractFactory("UniswapRouterMock");
    routerMock = await RouterMock.deploy(tokenIn.address);

    // Deploy PoolMock
    const PoolMock = await ethers.getContractFactory("PoolMock");
    poolMock = await PoolMock.deploy();

    // Deploy ProviderMock with PoolMock address
    const ProviderMock = await ethers.getContractFactory("ProviderMock");
    providerMock = await ProviderMock.deploy(poolMock.address);

    // Transfer initial tokens to PoolMock so it can lend
    await tokenIn.transfer(poolMock.address, initialMint);
    await tokenOut.transfer(poolMock.address, initialMint);

    // Fund the router with both tokens for simulated swaps
    // await tokenIn.transfer(
    //   routerMock.address,
    //   ethers.utils.parseUnits("2000", 18)
    // ); // enough to simulate DAI->WETH
    // await tokenOut.transfer(
    //   routerMock.address,
    //   ethers.utils.parseUnits("2000", 18)
    // );
    //
    // mint to the routerMock enough in and out tokens

    await tokenOut.mint(
      routerMock.address,
      ethers.utils.parseUnits("10000", 18)
    ); // add liquidity
    await tokenIn.mint(
      routerMock.address,
      ethers.utils.parseUnits("10000", 18)
    ); // add liquidity

    // Deploy your flashloan contract
    const Flashloan = await ethers.getContractFactory("UniswapSimpleFlashLoan");
    flashloan = await Flashloan.deploy(
      providerMock.address,
      routerMock.address,
      tokenOut.address,
      minSwappedOutAmount
    );

    // Approve PoolMock to pull repayment tokens from flashloan contract after swaps
    await tokenIn
      .connect(flashloan.signer || (await ethers.getSigner()))
      .approve(poolMock.address, ethers.constants.MaxUint256);
    await tokenOut
      .connect(flashloan.signer || (await ethers.getSigner()))
      .approve(routerMock.address, ethers.constants.MaxUint256);

    // Approve flashloan contract to spend tokens (simulate user approval for router)
    await tokenIn
      .connect(flashloan.signer || (await ethers.getSigner()))
      .approve(routerMock.address, ethers.constants.MaxUint256);
    await tokenOut
      .connect(flashloan.signer || (await ethers.getSigner()))
      .approve(routerMock.address, ethers.constants.MaxUint256);
  });
  it("should perform flashloan with swap and repay", async function () {
    const assets = [tokenIn.address];
    const amounts = [flashloanAmount];

    // Run the flashloan (will simulate swap → profit → repay)
    await expect(flashloan.flashloan(assets, amounts)).to.not.be.reverted;

    const tokenInBalance = await tokenIn.balanceOf(flashloan.address);
    const tokenOutBalance = await tokenOut.balanceOf(flashloan.address);

    console.log(
      "Profit (TokenOut):",
      ethers.utils.formatUnits(tokenOutBalance, 18)
    );
    console.log(
      "Remaining TokenIn:",
      ethers.utils.formatUnits(tokenInBalance, 18)
    );

    // Ensure profit is earned in tokenOut
    expect(tokenOutBalance).to.be.gt(0);
    // Ensure loan is repaid, and minimal tokenIn remains
    expect(tokenInBalance).to.be.lt(ethers.utils.parseUnits("1", 18));
  });
});
