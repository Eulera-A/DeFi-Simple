const { ethers, network } = require("hardhat");
const fs = require("fs");

const FRONT_END_ADDRESSES_FILE =
  "../nextjs-Defi-FrontEnd/constants/contractAddresses.json";
const FRONT_END_ABI_FILE = "../nextjs-Defi-FrontEnd/constants/abi.json";

const FRONT_END_NETWORK_FILE =
  "../nextjs-Defi-FrontEnd/constants/networkNames.json";

async function updateFrontEndConstants(contractAddress, contractAbi) {
  if (process.env.UPDATE_FRONT_END) {
    console.log("Updating front end...");
    updateContractAddresses(contractAddress);
    updateAbi(contractAbi);
    updateNetworkName();
  }
}

async function updateAbi(contractAbi) {
  //const fundMe = await ethers.getContractAt("FundMe", contractAddress);
  fs.writeFileSync(FRONT_END_ABI_FILE, JSON.stringify(contractAbi, null, 2));
}

async function updateContractAddresses(contractAddress) {
  const chainId = network.config.chainId.toString();
  const currentAddresses = JSON.parse(
    fs.readFileSync(FRONT_END_ADDRESSES_FILE, "utf8")
  );
  if (chainId in currentAddresses) {
    if (!currentAddresses[chainId].includes(contractAddress)) {
      currentAddresses[chainId].push(contractAddress);
    }
  }
  {
    // if we don't even have this chainId in the frontend contractAddresses file:
    currentAddresses[chainId] = [contractAddress];
  }
  // now, write those updates back to the front end file
  fs.writeFileSync(FRONT_END_ADDRESSES_FILE, JSON.stringify(currentAddresses));
}

async function updateNetworkName() {
  const chainId = network.config.chainId.toString();
  const NetworkName = network.name;
  const currentNetworks = JSON.parse(
    fs.readFileSync(FRONT_END_NETWORK_FILE, "utf8")
  );
  if (chainId in currentNetworks) {
    if (!currentNetworks[chainId].includes(NetworkName)) {
      currentNetworks[chainId].push(NetworkName);
    }
  }
  {
    // if we don't even have this chainId in the frontend network file:
    currentNetworks[chainId] = [NetworkName];
  }
  // now, write those updates back to the front end file
  fs.writeFileSync(FRONT_END_NETWORK_FILE, JSON.stringify(currentNetworks));
}

module.exports = updateFrontEndConstants;

module.exports.tags = ["all", "frontend"];
