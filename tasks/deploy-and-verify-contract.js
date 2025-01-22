const fs = require("fs");
const { verifyContract } = require("./helpers");

const secrets = JSON.parse(fs.readFileSync("./secrets.json", "utf8"));
const PRIVATE_KEY = secrets.privateKeyMainnet;
if (!PRIVATE_KEY) {
  throw new Error(
    "Private key not provided. Set PRIVATE_KEY in environment variables.",
  );
}

task(
  "deploy_and_verify_contract",
  "Deploy and verify a contract on a specific blockchain network",
)
  .addPositionalParam("contract")
  .setAction(async (taskArgs, hre) => {
    const chain = hre.network.name;
    const contractName = taskArgs.contract;
    const constructorArgs = require(`../scripts/${contractName}-args.js`);
    await deployAndVerifyContract(hre, chain, contractName, constructorArgs);
  });

/**
 * Function to deploy and verify a contract on a specific blockchain network.
 *
 * @param {any} hre - Hardhat
 * @param {string} chain - The chain name (e.g., "mainnet", "rinkeby") to deploy the contract.
 * @param {string} contractName - The name of the contract to deploy.
 * @param {Array} [constructorArgs=[]] - The constructor arguments for deployment.
 */
async function deployAndVerifyContract(
  hre,
  chain,
  contractName,
  constructorArgs = [],
) {
  try {
    const gasPrice = await hre.ethers.provider.getGasPrice();
    console.log(
      `Current network gas price: ${hre.ethers.utils.formatUnits(
        gasPrice,
        "gwei",
      )} gwei`,
    );
    const signer = new hre.ethers.Wallet(PRIVATE_KEY, hre.ethers.provider);
    console.log(
      `Deploying contract ${contractName} on network ${chain} from ${signer.address}`,
    );
    const contractFactory = await hre.ethers.getContractFactory(contractName, {
      signer,
    });
    const contractInstance = await contractFactory.deploy(...constructorArgs, {
      gasPrice: gasPrice.mul(110).div(100),
    });
    //const contractInstance = await contractFactory.deploy(...constructorArgs);
    await contractInstance.deployed();
    console.log(`Waiting for 5 confirmations of the deployment transaction...`);
    await contractInstance.deployTransaction.wait(5);
    console.log(`${contractName} deployed at: ${contractInstance.address}`);

    // Verify the contract on explorer (using Hardhat verify plugin)
    console.log(
      `Verifying contract ${contractName} on network ${chain} from ${signer.address}`,
    );
    await verifyContract(hre, contractInstance.address, constructorArgs);

    return contractInstance;
  } catch (error) {
    console.error("Error deploying and verifying contract:", error.message);
    throw error;
  }
}
