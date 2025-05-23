const networkConfig = {
  31337: {
    name: "localhost",
    wethToken: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    lendingPoolAddressesProvider: "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5",
    IPoolAddressesProvider: "0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e",
    daiEthPriceFeed: "0x773616E4d11A78F511299002da57A0a94577F1f4",
    daiToken: "0x6b175474e89094c44da98b954eedeac495271d0f",
  },
  11155111: {
    name: "sepolia",
    ethUsdPriceFeed: "0x694AA1769357215DE4FAC081bf1f309aDC325306",
    wethToken: "0xA70dc554504E93712c11BE6d7E747536F52321f1",
    // This is the AaveV2 Lending Pool Addresses Provider
    lendingPoolAddressesProvider: "0x88600eacb89bcbe57ab2bdac776afba6b2c105e2",
    // This is LINK/ETH feed
    //daiEthPriceFeed: "0xb4c4a493AB6356497713A78FFA6c60FB53517c63",
    // This is the LINK token
    //daiToken: "0x326C977E6efc84E512bB9C30f76E30c160eD06FB",
  },
  // Due to the different testnets, we are leaving kovan in as a reference
  42: {
    name: "kovan",
    ethUsdPriceFeed: "0x9326BFA02ADD2366b30bacB125260Af641031331",
    wethToken: "0xd0a1e359811322d97991e03f863a0c30c2cf029c",
    lendingPoolAddressesProvider: "0x88757f2f99175387aB4C6a4b3067c77A695b0349",
    daiEthPriceFeed: "0x22B58f1EbEDfCA50feF632bD73368b2FdA96D541",
    daiToken: "0xFf795577d9AC8bD7D90Ee22b6C1703490b6512FD",
  },
};

const developmentChains = ["hardhat", "localhost"];

module.exports = {
  networkConfig,
  developmentChains,
};
