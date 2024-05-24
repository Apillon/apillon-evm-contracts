const hre = require("hardhat");

async function main() {
  const ContractF = await hre.ethers.getContractFactory("ApillonVesting");
  const contr = await ContractF.deploy(
    "0xfFfFFfff46643f5a151c70C6a972559497530C45", // token
    "0xcA5e076571E058a56C9557526c7BabFF33124758" // signer
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
