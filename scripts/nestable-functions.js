const hre = require("hardhat");

async function main() {

  const deployer = (await hre.ethers.getSigners())[0];
  const nestableNFTParent = '0x700fc44cc038bbFbBfa2Cf1dD1EB1512963cF35b'; // ParentNFT
  const nestableNFTChild = '0x3aA96BcA169F8818e86E0de1f0586685bD957246'; // ChildNFT

  const parent = await hre.ethers.getContractAt('ApillonNFTNestable', nestableNFTParent, deployer);
  const child = await hre.ethers.getContractAt('ApillonNFTNestable', nestableNFTChild, deployer);

  // Mint Child NFT on deployer address
  // example: https://mumbai.polygonscan.com/tx/0x52eecefac3a841b4283d18d8dc269197bcbca464cea2c2e0b61db91c9beefce5
  // const tx = await child.ownerMint(1, deployer.address, false, 0);
  // await tx.wait();
  // console.log(
  //   "ownerMint: %stx/%s",
  //   hre.network.config.explorer,
  //   tx.hash
  // );

  // --------------------------------------------------------------------------------------------------------

  // Mint Child NFT and nest it to Parent NFT
  // example: https://mumbai.polygonscan.com/tx/0x0d39e162de25bd3c8c818b420e9bba97919b1ea4b20b10949985276526ba876d
  // const parentID = 2;
  // const tx = await child.ownerMint(1, parent.address, true, parentID);
  // await tx.wait();
  // console.log(
  //   "ownerMint: %stx/%s",
  //   hre.network.config.explorer,
  //   tx.hash
  // );

  // --------------------------------------------------------------------------------------------------------

  // Nest Transfer ChildNFT from deployer address to parentNFT
  // example: https://mumbai.polygonscan.com/tx/0x3fb0bcf3c54e41e6171ac1b5feedfac9f11df13ed478b9475a5e54cea46f47dc
  // const parentID = 2;
  // const tokenId = 5;
  // const tx = await child.nestTransferFrom(deployer.address, parent.address, tokenId, parentID, "0x");
  // await tx.wait();
  // console.log(
  //   "nestTransferFrom: %stx/%s",
  //   hre.network.config.explorer,
  //   tx.hash
  // );

  // --------------------------------------------------------------------------------------------------------

  // Accept child on parentNFT
  // example: https://mumbai.polygonscan.com/tx/0x4828ee210801f354a5d0d7dd476512ee781733c735670a9767c912607362a258
  // const parentID = 2;
  // const childIndex = 1;
  // const childId = 5;
  // const tx = await parent.acceptChild(parentID, childIndex, child.address, childId);
  // await tx.wait();
  // console.log(
  //   "acceptChild: %stx/%s",
  //   hre.network.config.explorer,
  //   tx.hash
  // );

  // --------------------------------------------------------------------------------------------------------

  // Transfer NestedChild back to deployer address
  // example: https://mumbai.polygonscan.com/tx/0x82d5f2fe762de58dff53eed949197f45d4affcb9e5fe6f5da860db949e1133d8
  // const parentID = 2;
  // const childIndex = 0;
  // const childId = 5;
  // const isPendingChild = false;
  // const tx = await parent.transferChild(parentID, deployer.address, 0, childIndex, child.address, childId, isPendingChild, "0x");
  // await tx.wait();
  // console.log(
  //   "transferChild: %stx/%s",
  //   hre.network.config.explorer,
  //   tx.hash
  // );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
