module.exports = [
  "MockName",
  "MockSymbol",
  "https://api.example.com/nfts/",
  "",
  [false, false, false, true],
  [
    hre.ethers.utils.parseUnits("0.001", 18).toString(), // _price
    0, // _dropStart
    1000, // _maxSupply
    50, // _reserve
    5, // Royalties fees
  ],
  "0x5f2B7077a7e5B4fdD97cBb56D9aD02a4f326896d", // Royalties address
  "0x4C2A866EB59511a6aD78db5cd4970464666b745a",
];
