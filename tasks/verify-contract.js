const { verifyContract } = require("./helpers");

task("verify_contract", "Verify a contract on a specific blockchain network")
  .addPositionalParam("contract")
  .addPositionalParam("address")
  .setAction(async (taskArgs, hre) => {
    const chain = hre.network.name;
    const contractName = taskArgs.contract;
    const contractAddress = taskArgs.address;
    const constructorArgs = require(`../scripts/${contractName}-args.js`);

    console.log(
      `Verifying contract ${contractName} at address ${contractAddress} and on chain ${chain}.`,
    );
    await verifyContract(hre, contractAddress, constructorArgs);
  });
