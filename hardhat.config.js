require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-abi-exporter");
require("hardhat-contract-sizer");
require("solidity-coverage");

const { privateKeyTestnet, polygonScanApiKey, mumbaiRPC, moonbeamScanApiKey } = require("./secrets.json");

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.17",
  networks: {
    hardhat: {
      hardfork: "merge",
    },
    polygonMumbai: {
      url: mumbaiRPC, 
      chainId: 80001,
      gasPrice: 13000000000, // 130gwei
      gas: 2000000,
      accounts: [privateKeyTestnet],
      explorer: "https://mumbai.polygonscan.com/",
    },
    moonbeamTestnet: {
      url: 'https://rpc.api.moonbase.moonbeam.network', 
      chainId: 1287,
      gasPrice: 5000000000, // 5gwei
      gas: 2000000,
      accounts: [privateKeyTestnet],
      explorer: "https://moonbase.moonscan.io/",
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
       moonbaseAlpha: moonbeamScanApiKey
     }
  },
};
