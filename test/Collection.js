const { expect } = require("chai");

describe("ApillonNFT", function() {
  let CC_onlyOwner, CC_drop_soulbound_revokable, CC_manual, CC_manual_drop, 
  owner, account1, account2, royalties, dropStartPresent, dropStartFuture;

  before(async () => {
    await hre.network.provider.send("hardhat_reset");
  });

  beforeEach(async () => {
    [ owner, account1, account2, royalties ] = await ethers.getSigners();
    const CContract = await ethers.getContractFactory("ApillonNFT");

    dropStartPresent = Math.ceil(new Date().getTime() / 1000); // present
    dropStartFuture = Math.ceil(new Date().getTime() / 1000) + 3600; // 1h in future

    CC_onlyOwner = await CContract.deploy(
      "Test", // _name
      "XXX", // _symbol
      "https://api.example.com/nfts/1/", // _initBaseURI
      ".json", // _baseExtension
      [false, false, false, true], //  _settings - [isDrop, isSoulbound, isRevokable, isAutoIncrement]
      ethers.utils.parseEther('0.01'), //  _price
      dropStartFuture, //  _dropStart
      10, //  _maxSupply
      6, //  _reserve
      royalties.address, // _royaltiesAddress
      500, // _royaltiesFees, 100 = 1%
    );
    await CC_onlyOwner.deployed();

    CC_drop_soulbound_revokable = await CContract.deploy(
      "Test", // _name
      "XXX", // _symbol
      "https://api.example.com/nfts/1/", // _initBaseURI
      ".json", // _baseExtension
      [true, true, true, true], //  _settings - [isDrop, isSoulbound, isRevokable, isAutoIncrement]
      ethers.utils.parseEther('0.01'), //  _price
      dropStartFuture, //  _dropStart
      10, //  _maxSupply
      6, //  _reserve
      royalties.address, // _royaltiesAddress
      5, // _royaltiesFees
    );
    await CC_drop_soulbound_revokable.deployed();

    CC_manual_drop = await CContract.deploy(
      "Test", // _name
      "XXX", // _symbol
      "https://api.example.com/nfts/1/", // _initBaseURI
      ".json", // _baseExtension
      [true, false, false, false], //  _settings - [isDrop, isSoulbound, isRevokable, isAutoIncrement]
      ethers.utils.parseEther('0.01'), //  _price
      dropStartFuture, //  _dropStart
      10, //  _maxSupply
      6, //  _reserve
      royalties.address, // _royaltiesAddress
      500, // _royaltiesFees, 100 = 1%
    );
    await CC_manual_drop.deployed();

    CC_manual = await CContract.deploy(
      "Test", // _name
      "XXX", // _symbol
      "https://api.example.com/nfts/1/", // _initBaseURI
      ".json", // _baseExtension
      [false, false, false, false], //  _settings - [isDrop, isSoulbound, isRevokable, isAutoIncrement]
      ethers.utils.parseEther('0.01'), //  _price
      dropStartFuture, //  _dropStart
      10, //  _maxSupply
      6, //  _reserve
      royalties.address, // _royaltiesAddress
      500, // _royaltiesFees, 100 = 1%
    );
    await CC_manual.deployed();
  });

  it("Deployer should be the owner of the contract", async function() {
    expect(await CC_onlyOwner.owner()).to.equal(owner.address);
  });

  it("tokenURI should be same as set in constructor", async function() {
    await CC_onlyOwner.ownerMint(owner.address, 3);
    expect(await CC_onlyOwner.tokenURI(3)).to.equal("https://api.example.com/nfts/1/3.json");

    await expect(CC_onlyOwner.tokenURI(4)).to.be.revertedWith('ERC721Metadata: URI query for nonexistent token');
  });

  it("CC_onlyOwner only owner can mint", async function() {
    await expect(CC_onlyOwner.connect(account1).ownerMint(owner.address, 1))
    .to.be.revertedWith('Ownable: caller is not the owner');

    await expect(CC_onlyOwner.connect(account1).mint(owner.address, 1))
    .to.be.revertedWith('isDrop == false');
  });

  it("CC_onlyOwner allow only maxSupply", async function() {
    await CC_onlyOwner.ownerMint(owner.address, 6);
    await CC_onlyOwner.ownerMint(owner.address, 4);
    await expect(CC_onlyOwner.ownerMint(owner.address, 1)).to.be.reverted;
  });

  it("CC_drop_soulbound_revokable allow only reserve", async function() {
    await CC_drop_soulbound_revokable.ownerMint(owner.address, 2);
    await CC_drop_soulbound_revokable.ownerMint(owner.address, 4);
    await expect(CC_drop_soulbound_revokable.ownerMint(owner.address, 1))
      .to.be.revertedWith('quantity > reserve');
  });

  it("CC_drop_soulbound_revokable regular mint", async function() {
    await expect(CC_drop_soulbound_revokable.connect(account1).mint(owner.address, 2))
      .to.be.revertedWith('Minting not started yet.');

    await expect(CC_drop_soulbound_revokable.connect(account1).setDropStart(dropStartPresent))
      .to.be.revertedWith('Ownable: caller is not the owner');

    await CC_drop_soulbound_revokable.setDropStart(dropStartPresent);

    await expect(CC_drop_soulbound_revokable.connect(account1).mint(owner.address, 2))
      .to.be.revertedWith('Insufficient amount.');

    await CC_drop_soulbound_revokable.connect(account1)
      .mint(owner.address, 2, {value: ethers.utils.parseEther('0.01').mul('2')});

    await expect(CC_drop_soulbound_revokable.connect(account1).mintIds(owner.address, 0, [1,2]))
      .to.be.revertedWith('isAutoIncrement ON: set numToMint > 0 & leave IDs empty');
  });

  it("Check burn availabilty", async function() {
    await CC_onlyOwner.ownerMint(owner.address, 6);
    await expect(CC_onlyOwner.connect(account1).burn(1)).to.be.revertedWith('Ownable: caller is not the owner');
    await expect(CC_onlyOwner.burn(1)).to.be.revertedWith('NFT not revokable!');

    await CC_drop_soulbound_revokable.ownerMint(owner.address, 6);
    await expect(CC_drop_soulbound_revokable.connect(account1).burn(1)).to.be.revertedWith('Ownable: caller is not the owner');
    await CC_drop_soulbound_revokable.burn(1);

    await expect(CC_drop_soulbound_revokable.burn(10)).to.be.revertedWith('ERC721: invalid token ID');
  });

  it("Check mint after burn", async function() {
    //mint 2 NFTs
    await CC_drop_soulbound_revokable.ownerMint(owner.address, 2);
    let ids = await CC_drop_soulbound_revokable.walletOfOwner(owner.address);
    expect(ids.length).to.equal(2);
    expect(ids[0]).to.equal(1);
    expect(ids[1]).to.equal(2);

    //burn 1 NFTs
    await CC_drop_soulbound_revokable.connect(owner).burn(1)
    ids = await CC_drop_soulbound_revokable.walletOfOwner(owner.address);
    expect(ids.length).to.equal(1);

    //mint 2 NFTs
    await CC_drop_soulbound_revokable.ownerMint(owner.address, 2);
    ids = await CC_drop_soulbound_revokable.walletOfOwner(owner.address);
    expect(ids.length).to.equal(3);
    expect(ids[0]).to.equal(2);
    expect(ids[1]).to.equal(3);
    expect(ids[2]).to.equal(4);
  });

  it("Check transfer availabilty", async function() {
    await CC_onlyOwner.ownerMint(owner.address, 6);
    await CC_onlyOwner.transferFrom(owner.address, account1.address, 1);

    await CC_drop_soulbound_revokable.ownerMint(owner.address, 6);
    await expect(CC_drop_soulbound_revokable.transferFrom(owner.address, account1.address, 1)).to.be.revertedWith('Transfers not allowed!');
  });

  it("Only owner can updateRoyaltyRecipient", async function() {
    await expect(CC_onlyOwner.connect(account1).updateRoyaltyRecipient(account2.address))
      .to.be.revertedWith('Ownable: caller is not the owner');

    await CC_onlyOwner.updateRoyaltyRecipient(account2.address);
  });

  it("Only owner can setDropStart", async function() {
    await expect(CC_drop_soulbound_revokable.connect(account1).setDropStart(0))
      .to.be.revertedWith('Ownable: caller is not the owner');

    await CC_drop_soulbound_revokable.setDropStart(10);

    await expect(CC_drop_soulbound_revokable.setDropStart(0))
      .to.be.revertedWith('Minting already started!');
  });

  it("supportsInterface", async function() {
    expect(await CC_onlyOwner.supportsInterface('0x2a55205a')).to.equal(true);
    expect(await CC_onlyOwner.supportsInterface('0x2a552059')).to.equal(false);
  });

  it("royaltyInfo", async function() {
    const resp = await CC_onlyOwner.royaltyInfo(0, 100);
    expect(resp.receiver).to.equal(royalties.address);
    expect(resp.royaltyAmount).to.equal(5);
  });

  it("Change baseURI", async function() {
    await CC_onlyOwner.ownerMint(owner.address, 1);

    expect(await CC_onlyOwner.tokenURI(1)).to.equal("https://api.example.com/nfts/1/1.json");

    const baseURI = 'https://fakeurl.com/';
    const baseEXT = '.txt';

    await expect(CC_onlyOwner.connect(account1).setBaseURI(baseURI)
    ).to.be.revertedWith('Ownable: caller is not the owner');

    await expect(CC_onlyOwner.connect(account1).setBaseExtension(baseEXT)
    ).to.be.revertedWith('Ownable: caller is not the owner');

    await CC_onlyOwner.setBaseURI(baseURI);
    await CC_onlyOwner.setBaseExtension(baseEXT);

    expect(await CC_onlyOwner.tokenURI(1)).to.equal(`${baseURI}1${baseEXT}`);
  });

  it("Withdraw", async function() {
    await CC_drop_soulbound_revokable.setDropStart(10);
    await CC_drop_soulbound_revokable.connect(account1)
      .mint(account1.address, 1, {value: ethers.utils.parseEther('0.01')});

    const ownerBalanceBefore = await owner.getBalance();

    await expect(CC_drop_soulbound_revokable.connect(account1).withdrawRaised(owner.address, ethers.utils.parseEther('0.01')))
      .to.be.revertedWith('Ownable: caller is not the owner');

    const tx = await CC_drop_soulbound_revokable.withdrawRaised(owner.address, ethers.utils.parseEther('0.01'));

    const receipt = await tx.wait()
    const gasSpent = receipt.gasUsed.mul(receipt.effectiveGasPrice);

    const ownerBalanceAfter = await owner.getBalance();

    expect(ownerBalanceAfter.add(gasSpent).sub(ownerBalanceBefore)).to.equal(ethers.utils.parseEther('0.01'));
  });

  it("Check walletOfOwner & allTokens function", async function() {
    await CC_onlyOwner.ownerMint(account1.address, 2);

    expect(await CC_onlyOwner.balanceOf(account1.address)).to.equal(2);
    const ids = await CC_onlyOwner.walletOfOwner(account1.address);
    expect(ids[0]).to.equal(1);
    expect(ids[1]).to.equal(2);

    await CC_onlyOwner.ownerMint(account2.address, 1);
    expect(await CC_onlyOwner.balanceOf(account2.address)).to.equal(1);

    const idsAll = await CC_onlyOwner.allTokens();
    expect(idsAll.length).to.equal(3);
  });

  it("CC_manual_drop regular mint", async function() {
    // Mint with non-owner
    await expect(CC_manual_drop.connect(account1).mint(owner.address, 2))
      .to.be.revertedWith('Minting not started yet.');

    await expect(CC_manual_drop.connect(account1).setDropStart(dropStartPresent))
      .to.be.revertedWith('Ownable: caller is not the owner');

    await CC_manual_drop.setDropStart(dropStartPresent);

    await expect(CC_manual_drop.connect(account1).mint(owner.address, 2))
      .to.be.revertedWith('isAutoIncrement OFF: specify IDs');

    await expect(CC_manual_drop.connect(account1).mintIds(owner.address, 0, [1,2]))
      .to.be.revertedWith('Insufficient amount.');

    await CC_manual_drop.connect(account1)
      .mintIds(owner.address, 0, [1,2], {value: ethers.utils.parseEther('0.01').mul('2')});

    // Owner mint
    await expect(CC_manual_drop.connect(owner).ownerMintIds(owner.address, 0, [1]))
      .to.be.revertedWith('ERC721: token already minted');

    await expect(CC_manual_drop.connect(owner).ownerMintIds(owner.address, 2, []))
      .to.be.revertedWith('isAutoIncrement OFF: specify IDs');

    await CC_manual_drop.connect(owner).ownerMintIds(owner.address, 0, [777,888]);
  });

  it("CC_manual owner mint", async function() {
    // Try mint with non-owner
    await expect(CC_manual.connect(account1).mint(owner.address, 2))
      .to.be.revertedWith('isDrop == false');

    await expect(CC_manual.connect(account1).setDropStart(dropStartPresent))
      .to.be.revertedWith('Ownable: caller is not the owner');

    await CC_manual.setDropStart(dropStartPresent);

    await expect(CC_manual.connect(account1).mint(owner.address, 2))
      .to.be.revertedWith('isDrop == false');

    // Owner mint
    await CC_manual.connect(owner).ownerMintIds(owner.address, 0, [1,2,3]);

    await expect(CC_manual.connect(owner).ownerMintIds(owner.address, 0, [1]))
      .to.be.revertedWith('ERC721: token already minted');

    await expect(CC_manual.connect(owner).ownerMintIds(owner.address, 2, []))
      .to.be.revertedWith('isAutoIncrement OFF: specify IDs');

    await CC_manual.connect(owner).ownerMintIds(owner.address, 0, [777,888]);
  });
});
