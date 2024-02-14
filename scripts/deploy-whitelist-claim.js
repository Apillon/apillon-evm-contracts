const hre = require("hardhat");

async function main() {
  const ContractF = await hre.ethers.getContractFactory(
    "ApillonNftWhitelistClaim"
  );
  const contr = await ContractF.deploy(
    "Ptest",
    "PT",
    "https://k2k4r8le60od3jqnd9l8wbnmh6ywpdtzn2u1l5osfid6jpuo1h8kyzlg.ipns.nectarnode.io/",
    ".json?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjaWQiOiJrMms0cjhsZTYwb2QzanFuZDlsOHdibm1oNnl3cGR0em4ydTFsNW9zZmlkNmpwdW8xaDhreXpsZyIsInByb2plY3RfdXVpZCI6IjMwNmIxNGRlLWIwZTEtNGMwYi05OGVkLWEwZWQwZWEzODg2OSIsImlhdCI6MTcwNjI1MzMxOCwic3ViIjoiSVBGUy10b2tlbiJ9.YObUMxQ3PIDuqp4FiLLnBeTSYwOb2cyoBFENhxa-T6w",
    "0xbcCC53a4feB26d30C44f9378C444eD2Be0BBeF08"
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
