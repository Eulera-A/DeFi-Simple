const { getNamedAccounts, ethers } = require("hardhat");
const AMOUNT = ethers.utils.parseEther;

async function getWeth() {
  const { deployer } = await getNamedAccounts();
  //n call the "deposit" function on the weth contract
  // need: abi, contract adress from weth mainnet:
  // 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
  //
  const iWeth = await ethers.getContractAt(
    "IWeth",
    "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    deployer
  );
  const tx = await iWeth.deposit({ value: AMOUNT });
  await tx.wait(); // because deposit changes blockchain status,
  // hence needs "minning", hence needs wait confirmation
  const wethBalance = await iWeth.balanceOf(deployer);
  console.log(`Got ${wethBalance.toString()} WETH`);
}

module.exports = { getWeth, AMOUNT };
// forking: 19:39:39
