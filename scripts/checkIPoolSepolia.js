const { ethers } = require("hardhat");

async function main() {
  const provider = ethers.provider;
  const addrProvider = await ethers.getContractAt(
    "IPoolAddressesProvider", // Use ABI for IPoolAddressesProvider
    "0x220C7a5c207B6C2F69EF4aD0d3B23C1F2DfccEd0"
  );

  const poolAddr = await addrProvider.getPool();
  console.log("Aave Pool Address:", poolAddr);
}

main().catch(console.error);
