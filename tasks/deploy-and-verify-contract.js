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
    const signer = new hre.ethers.Wallet(PRIVATE_KEY, hre.ethers.provider);
    console.log(
      `Deploying contract ${contractName} on network ${chain} from ${signer.address}`,
    );
    const contractFactory = await hre.ethers.getContractFactory(contractName, {
      signer,
    });
    const contractInstance = await contractFactory.deploy(...constructorArgs);
    await contractInstance.deployed();
    await waitForContractAvailability(
      hre,
      contractInstance.address,
      contractName,
    );
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

async function waitForContractAvailability(
  hre,
  contractAddress,
  contractName,
  retries = 5,
  delay = 1000,
) {
  for (let i = 0; i < retries; i++) {
    try {
      const contractCode = await hre.ethers.provider.getCode(contractAddress);
      if (contractCode && contractCode !== "0x") {
        console.log(
          `Contract ${contractName} is now available at address: ${contractAddress}`,
        );
        return true;
      } else {
        throw new Error("Contract code is not available yet.");
      }
    } catch (checkError) {
      if (i === retries - 1) {
        console.error(
          `Contract ${contractName} not available after multiple attempts:`,
          checkError.message,
        );
        throw checkError;
      }
      console.log(
        `Retrying to verify contract availability for ${contractName} (Attempt ${
          i + 1
        }/${retries})...`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
