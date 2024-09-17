const hre = require("hardhat");

async function main() {
  const ContractF = await hre.ethers.getContractFactory("ApillonClaimToken");
  const contr = await ContractF.deploy(
    "0xFfFFfFfF8A9736B44EbF188972725bED67BF694E", // prod: 0xFfFFfFfF8A9736B44EbF188972725bED67BF694E, test: 0xfFfFFfff46643f5a151c70C6a972559497530C45  token
    "0x3CEF4BAD63290Fb2e8E03dC4C53A1897b8dE3f92" // prod: 0x3CEF4BAD63290Fb2e8E03dC4C53A1897b8dE3f92, test: 0xcA5e076571E058a56C9557526c7BabFF33124758 signer
  );

  await contr.deployed();

  console.log(
    "ApillonClaimToken deployed to: %saddress/%s",
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
