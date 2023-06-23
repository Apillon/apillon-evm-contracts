module.exports = [
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
];

/*
name: GhostMoon Warriors
symbol: GMW
maxSupply: 113
mintPrice: 6 GLMR
basePUri: https://ipfs.apillon.io/ipns/k2k4r8mj49edm5rt57p6rspq0a9w2g1vlw1ldy1gq5ouvp9gstkip83o/
isDrop: 1
isSoulbound: 0
isRevokable: 0
reserve: 0
dropStart: 1684254223
royalites: 10
royaltiesAddress: 0xFbec13cC69301b225E7FF55Bfd32b60e53Aec068
*/