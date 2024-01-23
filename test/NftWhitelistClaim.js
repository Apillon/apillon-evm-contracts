const { expect } = require("chai");

describe("ApillonNftWhitelistClaim", function() {
  let DC, owner, account1, account2, signer;

  before(async () => {
    await hre.network.provider.send("hardhat_reset");
  });

  beforeEach(async () => {
    const DContract = await ethers.getContractFactory("ApillonNftWhitelistClaim");
    [ owner, account1, account2, signer ] = await ethers.getSigners();
    DC = await DContract.deploy("Drop", "DP", "http://example.com/", signer.address);
    await DC.deployed();
  });

  it("Deployer should be the owner of the contract", async function() {
    expect(await DC.owner()).to.equal(owner.address);
  });

  it("URI should be same as set in constructor", async function() {
    await expect(DC.tokenURI(1)).to.be.revertedWith("ERC721Metadata: URI query for nonexistent token");

    const amount = 5;

    const message = ethers.utils.solidityKeccak256(
      ['address', 'uint256', 'address'],
      [account1.address, amount, DC.address]
    );
    const signature = await signer.signMessage(ethers.utils.arrayify(message));

    await DC.connect(account1).mint(
      amount,
      signature
    );

    expect(await DC.tokenURI(1)).to.equal("http://example.com/1");

    // Try minting again
    await expect(DC.connect(account1).mint(
      amount,
      signature
    )).to.be.revertedWith("Wallet already minted");

    // Mint with other address
    const amount2 = 2;
    const message2 = ethers.utils.solidityKeccak256(
      ['address', 'uint256', 'address'],
      [account2.address, amount2, DC.address]
    );
    const signature2 = await signer.signMessage(ethers.utils.arrayify(message2));

    await DC.connect(account2).mint(
      amount2,
      signature2
    );

    expect(await DC.ownerOf(1)).to.equal(account1.address);
    expect(await DC.ownerOf(2)).to.equal(account1.address);
    expect(await DC.ownerOf(3)).to.equal(account1.address);
    expect(await DC.ownerOf(4)).to.equal(account1.address);
    expect(await DC.ownerOf(5)).to.equal(account1.address);

    expect(await DC.ownerOf(6)).to.equal(account2.address);
    expect(await DC.ownerOf(7)).to.equal(account2.address);

  });

  it("walletUsed returns right value", async function() {
    expect(await DC.walletUsed(account1.address)).to.equal(false);

    const amount = 5;

    const message = ethers.utils.solidityKeccak256(
      ['address', 'uint256', 'address'],
      [account1.address, amount, DC.address]
    );
    const signature = await signer.signMessage(ethers.utils.arrayify(message));

    await DC.connect(account1).mint(
      amount,
      signature
    );

    expect(await DC.walletUsed(account1.address)).to.equal(true);
  });
});
