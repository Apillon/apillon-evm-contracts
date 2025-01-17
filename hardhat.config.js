require("@nomiclabs/hardhat-waffle");
require("@nomicfoundation/hardhat-verify");
require("hardhat-abi-exporter");
require("hardhat-contract-sizer");
require("solidity-coverage");

const {
  privateKeyTestnet,
  polygonScanApiKey,
  mumbaiRPC,
  moonbeamScanApiKey,
  sepoliaRPC,
  etherScanApiKey,
  blockScoutApiKey,
  privateKeyMainnet,
  baseScanApiKey,
} = require("./secrets.json");

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  // solidity: "0.8.18",
  solidity: {
    compilers: [
      {
        version: "0.8.21",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          outputSelection: {
            "*": {
              "*": [
                "evm.bytecode",
                "evm.deployedBytecode",
                "devdoc",
                "userdoc",
                "metadata",
                "abi",
              ],
            },
          },
          // viaIR : true,
        },
      },
    ],
  },
  sourcify: {
    enabled: false,
  },
  networks: {
    hardhat: {
      hardfork: "shanghai",
      blockGasLimit: 6000000,
    },
    polygonMumbai: {
      url: mumbaiRPC,
      chainId: 80001,
      gasPrice: 13000000000, // 130gwei
      gas: 2000000,
      accounts: [privateKeyTestnet],
      explorer: "https://mumbai.polygonscan.com/",
    },
    moonbeam: {
      url: "https://rpc.api.moonbeam.network",
      chainId: 1284,
      gasPrice: 150000000000, // 150gwei
      gas: 2000000,
      accounts: [privateKeyMainnet],
      explorer: "https://moonbeam.moonscan.io/",
    },
    moonbeamTestnet: {
      // url: 'https://rpc.api.moonbase.moonbeam.network',
      url: "https://moonbeam-alpha.api.onfinality.io/public",
      chainId: 1287,
      gasPrice: 200000000000, // 5gwei
      gas: 2000000,
      accounts: [privateKeyTestnet],
      explorer: "https://moonbase.moonscan.io/",
    },
    shibuya: {
      url: "https://evm.shibuya.astar.network/",
      chainId: 81,
      gasPrice: 5000000000, // 5gwei
      gas: 2000000,
      accounts: [privateKeyTestnet],
      explorer: "https://shibuya.subscan.io/",
    },
    astar: {
      url: "https://evm.astar.network",
      chainId: 592,
      gasPrice: 5000000000, // 5gwei
      gas: 2000000,
      accounts: [privateKeyTestnet],
      explorer: "https://astar.blockscout.com/",
    },
    sepolia: {
      url: sepoliaRPC,
      chainId: 11155111,
      gasPrice: 140000000000, // 140gwei
      gas: 2000000,
      accounts: [privateKeyTestnet],
      explorer: "https://sepolia.etherscan.io/",
    },
    mainnet: {
      url: "https://ethereum.publicnode.com",
      chainId: 1,
      gasPrice: 42000000000, // 48gwei
      gas: 2400000,
      accounts: [privateKeyMainnet],
      explorer: "https://etherscan.com/",
    },
    base: {
      url: "https://mainnet.base.org",
      chainId: 8453,
      gasPrice: 1000000000, // 1 gwei
      gas: 2000000,
      accounts: [privateKeyMainnet],
      explorer: "https://basescan.org",
    },
    baseSepolia: {
      url: "https://sepolia.base.org",
      chainId: 84532,
      gasPrice: 1000000000, // 1 gwei
      gas: 2000000,
      accounts: [privateKeyTestnet],
      explorer: "https://sepolia.basescan.org",
    },
  },
  abiExporter: {
    path: "./data/abi",
    clear: true,
    flat: true,
    only: ["ApillonNFT"],
  },
  etherscan: {
    apiKey: {
      polygonMumbai: polygonScanApiKey,
      polygon: polygonScanApiKey,
      moonbaseAlpha: moonbeamScanApiKey,
      moonbeam: moonbeamScanApiKey,
      sepolia: etherScanApiKey,
      mainnet: etherScanApiKey,
      astar: blockScoutApiKey,
      base: baseScanApiKey,
      baseSepolia: baseScanApiKey,
    },
    customChains: [
      {
        network: "astar",
        chainId: 592,
        urls: {
          apiURL: "https://astar.blockscout.com/api",
          browserURL: "https://astar.blockscout.com/",
        },
      },
    ],
  },
};
