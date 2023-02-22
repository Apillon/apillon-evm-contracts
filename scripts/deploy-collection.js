const hre = require("hardhat");

async function main() {
  const ContractF = await hre.ethers.getContractFactory("ApillonNFT");
  const contr = await ContractF.deploy(
    "MockName",
    "MockSymbol",
    "https://api.example.com/nfts/",
    "",
    [false, false, false],
    hre.ethers.utils.parseUnits('0.001', 18).toString(), // _price
    0, // _dropStart
    1000, // _maxSupply
    50, // _reserve
    "0x5f2B7077a7e5B4fdD97cBb56D9aD02a4f326896d", // Royalties address
    5, // Royalties fees
    /*
        string memory _name,
        string memory _symbol,
        string memory _initBaseURI,
        string memory _baseExtension,
        bool[] memory _settings, [isDrop, isSoulbound, isRevokable]
        uint _price,
        uint _dropStart,
        uint _maxSupply,
        uint _reserve,
        address _royaltiesAddress,
        uint _royaltiesFees
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
