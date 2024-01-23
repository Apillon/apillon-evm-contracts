const hre = require("hardhat");

async function main() {
  const ContractF = await hre.ethers.getContractFactory("ApillonNftWhitelistClaim");
  const contr = await ContractF.deploy(
    "MockName",
    "MockSymbol",
    "https://api.example.com/nfts/",
    "0xbcCC53a4feB26d30C44f9378C444eD2Be0BBeF08",
  );

  await contr.deployed();

  console.log(
    "ApillonNftWhitelistClaim deployed to: %saddress/%s",
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
