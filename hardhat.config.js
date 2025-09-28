require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-deploy");
require("solidity-coverage");
require("hardhat-gas-reporter");
require("hardhat-contract-sizer");
require("dotenv").config();

/**
 * @type import('hardhat/config').HardhatUserConfig
 */

const MAINNET_RPC_URL =
  process.env.MAINNET_RPC_URL ||
  process.env.ALCHEMY_MAINNET_RPC_URL ||
  "https://eth-mainnet.alchemyapi.io/v2/your-api-key";
const SEPOLIA_RPC_URL =
  process.env.SEPOLIA_RPC_URL ||
  "https://eth-sepolia.g.alchemy.com/v2/YOUR-API-KEY";
const POLYGON_MAINNET_RPC_URL =
  process.env.POLYGON_MAINNET_RPC_URL ||
  "https://polygon-mainnet.alchemyapi.io/v2/your-api-key";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x";
// optional
const MNEMONIC = process.env.MNEMONIC || "your mnemonic";

// Your API key for Etherscan, obtain one at https://etherscan.io/
const ETHERSCAN_API_KEY =
  process.env.ETHERSCAN_API_KEY || "Your etherscan API key";
const POLYGONSCAN_API_KEY =
  process.env.POLYGONSCAN_API_KEY || "Your polygonscan API key";
const REPORT_GAS = process.env.REPORT_GAS || false;

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      // // If you want to do some forking, uncomment this
      forking: {
        url: MAINNET_RPC_URL,
      },
      chainId: 31337,
      wethToken: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      lendingPoolAddressesProvider:
        "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5",
      IPoolAddressesProvider: "0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e",
      daiEthPriceFeed: "0x773616E4d11A78F511299002da57A0a94577F1f4",
      daiToken: "0x6b175474e89094c44da98b954eedeac495271d0f",
      // v3 uniswap
      PoolAddressProvider: "0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e",
      UniswapV3Router: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
    },
    localhost: {
      chainId: 31337,
      forking: {
        url: MAINNET_RPC_URL,
      },
      wethToken: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      lendingPoolAddressesProvider:
        "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5",
      IPoolAddressesProvider: "0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e",
      daiEthPriceFeed: "0x773616E4d11A78F511299002da57A0a94577F1f4",
      daiToken: "0x6b175474e89094c44da98b954eedeac495271d0f",
      // v3 uniswap
      PoolAddressProvider: "0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e",
      UniswapV3Router: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
    },
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
      //   accounts: {
      //     mnemonic: MNEMONIC,
      //   },
      saveDeployments: true,
      chainId: 11155111,
      PoolAddressProvider: "0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e",
      UniswapV2Router: "0x86dcd3293C53Cf8EFd7303B57beb2a3F671dDE98",
    },
    mainnet: {
      url: MAINNET_RPC_URL,
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
      //   accounts: {
      //     mnemonic: MNEMONIC,
      //   },
      saveDeployments: true,
      chainId: 1,
    },
    polygon: {
      url: POLYGON_MAINNET_RPC_URL,
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
      saveDeployments: true,
      chainId: 137,
    },
  },
  etherscan: {
    // yarn hardhat verify --network <NETWORK> <CONTRACT_ADDRESS> <CONSTRUCTOR_PARAMETERS>
    apiKey: {
      sepolia: ETHERSCAN_API_KEY,
      polygon: POLYGONSCAN_API_KEY,
    },
    customChains: [
      {
        network: "goerli",
        chainId: 5,
        urls: {
          apiURL: "https://api-goerli.etherscan.io/api",
          browserURL: "https://goerli.etherscan.io",
        },
      },
    ],
  },
  gasReporter: {
    enabled: REPORT_GAS,
    currency: "USD",
    outputFile: "gas-report.txt",
    noColors: true,
    // coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
  contractSizer: {
    runOnCompile: false,
    only: ["Raffle"],
  },
  namedAccounts: {
    deployer: {
      default: 0, // here this will by default take the first account as deployer
      1: 0, // similarly on mainnet it will take the first account as deployer. Note though that depending on how hardhat network are configured, the account 0 on one network can be different than on another
    },
    player: {
      default: 1,
    },
  },
  solidity: {
    compilers: [
      {
        version: "0.6.6",
      },
      {
        version: "0.4.19",
      },
      {
        version: "0.6.12",
      },
      { version: "0.8.0" },
      {
        version: "0.8.21",
        settings: {
          viaIR: true,
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  mocha: {
    timeout: 500000, // 500 seconds max for running tests
  },
};
