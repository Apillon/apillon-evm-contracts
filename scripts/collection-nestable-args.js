module.exports = [
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
    royaltyRecipient: '0x1F21f7A70997e3eC5FbD61C047A26Cdc88e7089B',
    royaltyPercentageBps: 500, // 1 basis point == 0.01%
    maxSupply: 100,
    pricePerMint: ethers.utils.parseEther('0.01'), //  _price
  }
];
