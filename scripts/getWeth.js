const { getNamedAccounts, ethers } = require("hardhat");
const AMOUNT = ethers.utils.parseEther("0.02");

async function getWeth() {
  const { deployer } = await getNamedAccounts();
  const signer = await ethers.getSigner(deployer); // 🔥 FIX HERE, need to get the Signer object, not just an address

  // call the "deposit" function on the weth contract
  // need: abi, contract adress from weth mainnet: but ofcourse, we are testing/working on the forked mainnet
  // 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
  //
  const iWeth = await ethers.getContractAt(
    "IWeth", // the iweth abi
    "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // contact address on mainnet!
    signer //the signer object! which is the deployer
  );
  const tx = await iWeth.deposit({ value: AMOUNT });
  await tx.wait(); // because deposit changes blockchain status,
  // hence needs "minning", hence needs wait confirmation
  const wethBalance = await iWeth.balanceOf(deployer);
  console.log(`Got ${wethBalance.toString()} WETH`);
}

module.exports = { getWeth, AMOUNT };
// forking: 19:39:39
