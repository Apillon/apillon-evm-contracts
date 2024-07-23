const hre = require("hardhat");

async function main() {
  const ContractF = await hre.ethers.getContractFactory("ApillonVesting");
  const contr = await ContractF.deploy(
    "0xFfFFfFfF8A9736B44EbF188972725bED67BF694E",
    1716890400
    // "0xfFfFFfff46643f5a151c70C6a972559497530C45", // token PROD: 0xFfFFfFfF8A9736B44EbF188972725bED67BF694E
    // 1721113200 // startTime PROD: 1716890400
  );

  await contr.deployed();

  console.log(
    "ApillonVesting deployed to: %saddress/%s",
    hre.network.config.explorer,
    contr.address
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
