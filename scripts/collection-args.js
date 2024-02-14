module.exports = [
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
];
