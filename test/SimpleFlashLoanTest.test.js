const { expect } = require("chai");
const { ethers } = require("hardhat");

const { parseEther } = ethers.utils;

describe("SimpleFlashloanV3", function () {
  let deployer, user;
  let token, pool, provider, flashloan;

  beforeEach(async () => {
    [deployer, user] = await ethers.getSigners();

    const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
    token = await ERC20Mock.deploy(
      "MockToken",
      "MTKN",
      user.address,
      parseEther("1000")
    );

    const PoolMock = await ethers.getContractFactory("PoolMock");
    pool = await PoolMock.deploy();

    const ProviderMock = await ethers.getContractFactory("ProviderMock");
    provider = await ProviderMock.deploy(pool.address);

    const Flashloan = await ethers.getContractFactory("SimpleFlashloanV3");
    flashloan = await Flashloan.deploy(provider.address);
  });

  it("should deploy correctly", async () => {
    expect(await flashloan.pool()).to.be.a("string");
  });

  it("should trigger flashloan", async () => {
    const assets = [token.address];
    const amounts = [ethers.utils.parseUnits("1", 18)];

    await expect(flashloan.flashloan(assets, amounts)).to.not.be.reverted;
  });
});
