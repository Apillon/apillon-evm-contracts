require("@nomiclabs/hardhat-waffle");
require("@nomicfoundation/hardhat-verify");
require("hardhat-abi-exporter");
require("hardhat-contract-sizer");
require("solidity-coverage");
require("./tasks/deploy-and-verify-contract");
require("./tasks/verify-contract");

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
  avalancheScanApiKey,
  optimismScanApiKey,
  arbitrumScanApiKey,
  celoScanApiKey,
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
    astarShibuya: {
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
      accounts: [privateKeyMainnet],
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
    celo: {
      url: "https://celo.drpc.org", // Celo Mainnet RPC
      chainId: 42220,
      gasPrice: 5000000000, // 5 gwei
      gas: 2000000,
      accounts: [privateKeyMainnet],
      explorer: "https://celoscan.io/",
    },
    celoAlfajores: {
      url: "https://api-alfajores.celoscan.io/api",
      chainId: 44787,
      gasPrice: 5000000000, // 5 gwei
      gas: 2000000,
      accounts: [privateKeyTestnet],
      explorer: "https://alfajores.celoscan.io",
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
    arbitrumOne: {
      url: "https://arbitrum-one-rpc.publicnode.com",
      chainId: 42161,
      gasPrice: 1000000000, // 1 gwei
      gas: 2000000,
      accounts: [privateKeyMainnet],
      explorer: "https://arbiscan.io",
    },
    arbitrumSepolia: {
      url: "https://arbitrum-sepolia-rpc.publicnode.com",
      chainId: 421614,
      gasPrice: 1000000000, // 1 gwei
      gas: 2000000,
      accounts: [privateKeyTestnet],
      explorer: "https://sepolia.arbiscan.io/",
    },
    avalanche: {
      url: "https://avalanche-c-chain-rpc.publicnode.com",
      chainId: 43114,
      gasPrice: 25000000000, // 25 gwei
      gas: 2000000,
      accounts: [privateKeyMainnet],
      explorer: "https://snowtrace.io",
    },
    avalancheFujiTestnet: {
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      chainId: 43113,
      gasPrice: 25000000000, // 25 gwei
      gas: 2000000,
      accounts: [privateKeyTestnet],
      explorer: "https://testnet.snowtrace.io/",
    },
    optimisticEthereum: {
      url: "https://mainnet.optimism.io",
      chainId: 10,
      gasPrice: 1000000, // 0.001 gwei
      gas: 2000000,
      accounts: [privateKeyMainnet],
      explorer: "https://optimistic.etherscan.io",
    },
    optimisticSepolia: {
      url: "https://sepolia.optimism.io",
      chainId: 11155420,
      gasPrice: 1000000, // 0.001 gwei
      gas: 2000000,
      accounts: [privateKeyTestnet],
      explorer: "https://sepolia-optimistic.etherscan.io",
    },
    polygon: {
      url: "https://rpc.ankr.com/polygon",
      chainId: 137,
      gasPrice: 35000000000, // 35 gwei
      gas: 2000000,
      accounts: [privateKeyMainnet],
      explorer: "https://polygonscan.com",
    },
    polygonAmoy: {
      url: "https://rpc-amoy.polygon.technology",
      chainId: 80002,
      gasPrice: 20000000000, // 20 gwei
      gas: 2000000,
      accounts: [privateKeyTestnet],
      explorer: "https://amoy.polygonscan.com/",
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
      polygonAmoy: polygonScanApiKey,
      polygon: polygonScanApiKey,
      moonbaseAlpha: moonbeamScanApiKey,
      moonbeam: moonbeamScanApiKey,
      sepolia: etherScanApiKey,
      mainnet: etherScanApiKey,
      astar: blockScoutApiKey,
      astarShibuya: blockScoutApiKey,
      base: baseScanApiKey,
      baseSepolia: baseScanApiKey,
      avalanche: avalancheScanApiKey,
      avalancheFujiTestnet: avalancheScanApiKey,
      celo: celoScanApiKey,
      celoAlfajores: celoScanApiKey,
      optimisticEthereum: optimismScanApiKey,
      optimisticSepolia: optimismScanApiKey,
      arbitrumSepolia: arbitrumScanApiKey,
      arbitrumOne: arbitrumScanApiKey,
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
      {
        network: "astarShibuya",
        chainId: 81,
        urls: {
          apiURL: "https://shibuya.blockscout.com/api",
          browserURL: "https://shibuya.blockscout.com/",
        },
      },
      {
        network: "celo",
        chainId: 42220,
        urls: {
          apiURL: "https://celo.drpc.org",
          browserURL: "https://celoscan.io",
        },
      },
      {
        network: "celoAlfajores",
        chainId: 44787,
        urls: {
          apiURL: "https://api-alfajores.celoscan.io/api",
          browserURL: "https://alfajores.celoscan.io",
        },
      },
      {
        network: "optimisticSepolia",
        chainId: 11155420,
        urls: {
          apiURL: "https://sepolia.optimism.io",
          browserURL: "https://sepolia-optimistic.etherscan.io",
        },
      },
    ],
  },
};
