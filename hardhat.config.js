require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-abi-exporter");
require("hardhat-contract-sizer");
require("solidity-coverage");

const { privateKeyTestnet, polygonScanApiKey, mumbaiRPC, moonbeamScanApiKey, sepoliaRPC, goerliRPC } = require("./secrets.json");

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
                "abi"
              ]
            }
          },
          // viaIR : true,
        },
      },
    ]
  },
  networks: {
    hardhat: {
      hardfork: "shanghai",
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
      url: 'https://rpc.api.moonbeam.network', 
      chainId: 1284,
      gasPrice: 200000000000, // 5gwei
      gas: 2000000,
      accounts: [privateKeyTestnet],
      explorer: "https://moonbeam.moonscan.io/",
    },
    moonbeamTestnet: {
      // url: 'https://rpc.api.moonbase.moonbeam.network', 
      url: 'https://moonbeam-alpha.api.onfinality.io/public', 
      chainId: 1287,
      gasPrice: 5000000000, // 5gwei
      gas: 2000000,
      accounts: [privateKeyTestnet],
      explorer: "https://moonbase.moonscan.io/",
    },
    shibuya: {
      url: 'https://evm.shibuya.astar.network/', 
      chainId: 81,
      gasPrice: 5000000000, // 5gwei
      gas: 2000000,
      accounts: [privateKeyTestnet],
      explorer: "https://shibuya.subscan.io/",
    },
    sepolia: {
      url: sepoliaRPC, 
      chainId: 11155111,
      gasPrice: 150000000000, // 150gwei
      gas: 1000000,
      accounts: [privateKeyTestnet],
      explorer: "https://sepolia.etherscan.io/",
    },
    sepolia: {
      url: goerliRPC, 
      chainId: 5,
      gasPrice: 20000000000, // 20gwei
      gas: 1000000,
      accounts: [privateKeyTestnet],
      explorer: "https://goerli.etherscan.io/",
    },
  },
  abiExporter: {
    path: "./data/abi",
    clear: true,
    flat: true,
    only: [
      'ApillonNFT',
    ],
  },
  etherscan: {
    apiKey: {
       polygonMumbai: polygonScanApiKey,
       polygon: polygonScanApiKey,
       moonbaseAlpha: moonbeamScanApiKey,
       moonbeam: moonbeamScanApiKey
     }
  },
};
