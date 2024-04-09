const hre = require("hardhat");

async function main() {

    const deployer = (await hre.ethers.getSigners())[0];

    const factory = new hre.ethers.ContractFactory(getAbi(), getByteCode(), deployer);

    // If your contract requires constructor args, you can specify them here
    const contract = await factory.deploy(
        "MockName",
        "MockSymbol",
        "https://api.example.com/nfts/",
        "",
        [false, false, false, true],
        hre.ethers.utils.parseUnits('0.001', 18).toString(), // _price
        0, // _dropStart
        1000, // _maxSupply
        50, // _reserve
        "0x5f2B7077a7e5B4fdD97cBb56D9aD02a4f326896d", // Royalties address
        5, // Royalties fees
    );

    console.log(contract.address);
    console.log(contract.deployTransaction);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


function getAbi() {
    // return ABI here
    return;
}

function getByteCode() {
    // !!! copy bytecode, NOT deployedBytecode !!!
    return "INSERT_BYTE_CODE_HERE";
}