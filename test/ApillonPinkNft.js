const { expect } = require("chai");

describe("ApillonPinkNft", function () {
  let DC, owner, account1, account2, account3;
  let startDate, stopDate;

  before(async () => {
    await hre.network.provider.send("hardhat_reset");
  });

  beforeEach(async () => {
    const DContract = await ethers.getContractFactory("ApillonPinkNft");
    [owner, account1, account2, account3] = await ethers.getSigners();
    startDate = parseInt((new Date().getTime() / 1000).toFixed(0)) + 1800; // + 30min
    stopDate = startDate + 1800; // + 30min

    DC = await DContract.deploy(
      "Drop",
      "DP",
      "http://example.com/",
      ".json",
      startDate,
      stopDate
    );
    await DC.deployed();
  });

  it("Deployer should be the owner of the contract", async function () {
    expect(await DC.owner()).to.equal(owner.address);
  });

  it("Test minting flow", async function () {
    await expect(DC.tokenURI(1)).to.be.revertedWith(
      "ERC721Metadata: URI query for nonexistent token"
    );

    await expect(DC.connect(account1).mint()).to.be.revertedWith(
      "Drop not yet available"
    );

    await network.provider.send("evm_setNextBlockTimestamp", [startDate]);

    await DC.connect(account1).mint();

    expect(await DC.tokenURI(1)).to.equal("http://example.com/1.json");

    // Try minting again
    await expect(DC.connect(account1).mint()).to.be.revertedWith(
      "Wallet already minted"
    );

    await DC.connect(account2).mint();

    expect(await DC.ownerOf(1)).to.equal(account1.address);
    expect(await DC.ownerOf(2)).to.equal(account2.address);

    await network.provider.send("evm_setNextBlockTimestamp", [stopDate]);

    await expect(DC.connect(account3).mint()).to.be.revertedWith("Drop ended");
  });
});
