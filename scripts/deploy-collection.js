const hre = require("hardhat");

async function main() {
  const ContractF = await hre.ethers.getContractFactory("ApillonNFT");
  const contr = await ContractF.deploy(
    "MockName",
    "MockSymbol",
    "https://api.example.com/nfts/",
    "0x5f2B7077a7e5B4fdD97cBb56D9aD02a4f326896d", // Royalties address
    false, // _isSoulbound
    1000, // _maxSupply
    50, // _reserve
    hre.ethers.utils.parseUnits('0.001', 18).toString(), // _price
    0, // _dropStart

    /*
    string memory _name,
    string memory _symbol,
    string memory _initBaseURI,
    address _royaltiesAddress,
    bool _isSoulbound,
    uint _maxSupply,
    uint _reserve,
    uint _price,
    uint _dropStart
    */
  );

  await contr.deployed();

  console.log(
    "ApillonNFT deployed to: %saddress/%s",
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
