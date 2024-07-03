const hre = require("hardhat");

async function main() {
  const ContractF = await hre.ethers.getContractFactory("ApillonVesting");
  const contr = await ContractF.deploy(
    "0xfFfFFfff46643f5a151c70C6a972559497530C45", // token
    1720076400 // startTime
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
