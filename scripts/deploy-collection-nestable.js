const hre = require("hardhat");

async function main() {
  const ContractF = await hre.ethers.getContractFactory("ApillonNFTNestable");
  const contr = await ContractF.deploy(
    "ChildName",
    "ChildSymbol",
    "https://api.example.com/nfts/",
    "",
    [true, false, false],
    0, // _dropStart
    50, // _reserve
    {
      erc20TokenAddress: hre.ethers.constants.AddressZero,
      tokenUriIsEnumerable: true,
      royaltyRecipient: "0x1F21f7A70997e3eC5FbD61C047A26Cdc88e7089B",
      royaltyPercentageBps: 500, // 1 basis point == 0.01%
      maxSupply: 100,
      pricePerMint: hre.ethers.utils.parseEther("0.01"), //  _price
    },
  );

  await contr.deployed();

  console.log(
    "ApillonNFTNestable deployed to: %saddress/%s",
    hre.network.config.explorer,
    contr.address,
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
