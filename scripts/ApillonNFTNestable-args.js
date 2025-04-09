module.exports = [
  "Tadej big NFT Collection 1234",
  "TNFT",
  "http://base.uri/",
  ".json",
  [false, false, true, true],
  0, // _dropStart
  5, // _reserve
  {
    erc20TokenAddress: hre.ethers.constants.AddressZero,
    tokenUriIsEnumerable: true,
    royaltyRecipient: "0x4C2A866EB59511a6aD78db5cd4970464666b745a",
    royaltyPercentageBps: 0, // 1 basis point == 0.01%
    maxSupply: 100,
    pricePerMint: ethers.utils.parseEther("1"), //  _price
  },
];
