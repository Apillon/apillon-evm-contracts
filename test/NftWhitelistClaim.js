const { expect } = require("chai");

describe("ApillonNftWhitelistClaim", function () {
  let DC, owner, account1, account2, signer;

  before(async () => {
    await hre.network.provider.send("hardhat_reset");
  });

  beforeEach(async () => {
    const DContract = await ethers.getContractFactory(
      "ApillonNftWhitelistClaim"
    );
    [owner, account1, account2, signer] = await ethers.getSigners();
    DC = await DContract.deploy(
      "Drop",
      "DP",
      "http://example.com/",
      ".json",
      signer.address
    );
    await DC.deployed();
  });

  it("Deployer should be the owner of the contract", async function () {
    expect(await DC.owner()).to.equal(owner.address);
  });

  it("URI should be same as set in constructor", async function () {
    await expect(DC.tokenURI(1)).to.be.revertedWith(
      "ERC721Metadata: URI query for nonexistent token"
    );

    const amount = 5;

    const message = ethers.utils.solidityKeccak256(
      ["address", "uint256", "address"],
      [account1.address, amount, DC.address]
    );
    const signature = await signer.signMessage(ethers.utils.arrayify(message));

    await DC.connect(account1).mint(amount, signature);

    expect(await DC.tokenURI(1)).to.equal("http://example.com/1.json");

    // Try minting again
    await expect(
      DC.connect(account1).mint(amount, signature)
    ).to.be.revertedWith("Wallet already minted");

    // Mint with other address
    const amount2 = 2;
    const message2 = ethers.utils.solidityKeccak256(
      ["address", "uint256", "address"],
      [account2.address, amount2, DC.address]
    );
    const signature2 = await signer.signMessage(
      ethers.utils.arrayify(message2)
    );

    await DC.connect(account2).mint(amount2, signature2);

    expect(await DC.ownerOf(1)).to.equal(account1.address);
    expect(await DC.ownerOf(2)).to.equal(account1.address);
    expect(await DC.ownerOf(3)).to.equal(account1.address);
    expect(await DC.ownerOf(4)).to.equal(account1.address);
    expect(await DC.ownerOf(5)).to.equal(account1.address);

    expect(await DC.ownerOf(6)).to.equal(account2.address);
    expect(await DC.ownerOf(7)).to.equal(account2.address);
  });

  it("Test invalid signature", async function () {
    const amount = 5;

    // Empty signature
    await expect(
      DC.connect(account2).mint(amount, "0x")
    ).to.be.revertedWith("ECDSA: invalid signature length");

    // Invalid amount
    let message = ethers.utils.solidityKeccak256(
      ["address", "uint256", "address"],
      [account1.address, amount, account1.address /* should be DC.address */]
    );
    let signature = await signer.signMessage(ethers.utils.arrayify(message));

    await expect(
      DC.connect(account1).mint(amount, signature)
    ).to.be.revertedWith("Invalid signature.");

    message = ethers.utils.solidityKeccak256(
      ["address", "uint256", "address"],
      [account1.address, amount, DC.address]
    );
    signature = await signer.signMessage(ethers.utils.arrayify(message));

    // Invalid msg.sender
    await expect(
      DC.connect(account2).mint(amount, signature)
    ).to.be.revertedWith("Invalid signature.");

    // Invalid amount
    await expect(
      DC.connect(account1).mint(amount + 1, signature)
    ).to.be.revertedWith("Invalid signature.");

    // Valid mint
    await DC.connect(account1).mint(amount, signature);
  });

  it("walletUsed returns right value", async function () {
    expect(await DC.walletUsed(account1.address)).to.equal(false);

    const amount = 5;
    const message = ethers.utils.solidityKeccak256(
      ["address", "uint256", "address"],
      [account1.address, amount, DC.address]
    );
    const signature = await signer.signMessage(ethers.utils.arrayify(message));

    await DC.connect(account1).mint(amount, signature);

    expect(await DC.walletUsed(account1.address)).to.equal(true);

    const tokenIds = await DC.walletOfOwner(account1.address);
    expect(tokenIds.length).to.equal(5);
    expect(tokenIds[0]).to.equal(1);
    expect(tokenIds[1]).to.equal(2);
    expect(tokenIds[2]).to.equal(3);
    expect(tokenIds[3]).to.equal(4);
    expect(tokenIds[4]).to.equal(5);
  });

  it("Change signer", async function() {
    expect(await DC['signer()']()).to.equal(signer.address);

    await expect(DC.connect(account1).setSigner(account1.address)
    ).to.be.revertedWith('Ownable: caller is not the owner');

    await expect(DC.setSigner(ethers.constants.AddressZero)
    ).to.be.revertedWith('Zero address not allowed');

    await DC.setSigner(account1.address);
    expect(await DC['signer()']()).to.equal(account1.address);
  });

  it("Change baseURI", async function() {
    expect(await DC.walletUsed(account1.address)).to.equal(false);

    const amount = 1;
    const message = ethers.utils.solidityKeccak256(
      ["address", "uint256", "address"],
      [account1.address, amount, DC.address]
    );
    const signature = await signer.signMessage(ethers.utils.arrayify(message));

    await DC.connect(account1).mint(amount, signature);

    expect(await DC.tokenURI(1)).to.equal("http://example.com/1.json");

    await expect(DC.connect(account1).setBaseURI("http://dummy.com/")
    ).to.be.revertedWith('Ownable: caller is not the owner');

    await expect(DC.connect(account1).setBaseExtension("")
    ).to.be.revertedWith('Ownable: caller is not the owner');

    await DC.connect(owner).setBaseURI("http://dummy.com/");
    await DC.connect(owner).setBaseExtension("");

    expect(await DC.tokenURI(1)).to.equal("http://dummy.com/1");
  });
});
