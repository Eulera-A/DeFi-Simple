export const networkConfig = {
  31337: {
    // these values are on mainnet, since we forked it
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
    wethToken: "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9",
    // This is the AaveV2 Lending Pool Addresses Provider
    lendingPoolAddressesProvider: "...",
    IPoolAddressesProvider: "0xB5d0ef1548D9C70d3E7a96cA67A2d7EbC5b1173E",

    daiEthPriceFeed: "0x773616e4d11a78f511299002da57a0a94577f1f4",
    daiToken: "0x68194a729C2450ad26072b3D33ADaCbcef39D574",
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

export const developmentChains = ["hardhat", "localhost"];
