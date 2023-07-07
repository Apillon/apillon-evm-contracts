const { expect } = require("chai");

describe("ApillonNFTNestable", function() {
  let CC, reserve, cost, owner, account1, account2, royalties, dropStartPresent, dropStartFuture;

  before(async () => {
    await hre.network.provider.send("hardhat_reset");
  });

  beforeEach(async () => {
    [ owner, account1, account2, royalties ] = await ethers.getSigners();
    const CContract = await ethers.getContractFactory("ApillonNFTNestable");

    dropStartPresent = Math.ceil(new Date().getTime() / 1000); // present
    dropStartFuture = Math.ceil(new Date().getTime() / 1000) + 3600; // 1h in future

    CC_onlyOwner = await CContract.deploy(
      "Test", // _name
      "XXX", // _symbol
      "https://api.example.com/nfts/1/", // _initBaseURI
      ".json", // baseExtension
      [false, false, false], //  _settings - [isDrop, isSoulbound, isRevokable]
      dropStartFuture, //  _dropStart
      6, //  _reserve
      {
        erc20TokenAddress: ethers.constants.AddressZero,
        tokenUriIsEnumerable: true,
        royaltyRecipient: royalties.address,
        royaltyPercentageBps: 500, // 1 basis point == 0.01%
        maxSupply: 10,
        pricePerMint: ethers.utils.parseEther('0.01'), //  _price
      }
    );
    await CC_onlyOwner.deployed();

    CC_drop_soulbound_revokable = await CContract.deploy(
      "Test", // _name
      "XXX", // _symbol
      "https://api.example.com/nfts/1/", // _initBaseURI
      ".json", // baseExtension
      [true, true, true], //  _settings - [isDrop, isSoulbound, isRevokable]
      dropStartFuture, //  _dropStart
      6, //  _reserve
      {
        erc20TokenAddress: ethers.constants.AddressZero,
        tokenUriIsEnumerable: true,
        royaltyRecipient: royalties.address,
        royaltyPercentageBps: 500, // 1 basis point == 0.01%
        maxSupply: 10,
        pricePerMint: ethers.utils.parseEther('0.01'), //  _price
      }
    );
    await CC_drop_soulbound_revokable.deployed();


  });

  it("Deployer should be the owner of the contract", async function() {
    expect(await CC_onlyOwner.owner()).to.equal(owner.address);
  });

  it("tokenURI should be same as set in constructor", async function() {
    await CC_onlyOwner.ownerMint(owner.address, 3);
    expect(await CC_onlyOwner.tokenURI(3)).to.equal("https://api.example.com/nfts/1/3.json");
  });

  it("CC_onlyOwner only owner can mint", async function() {
    await expect(CC_onlyOwner.connect(account1).ownerMint(owner.address, 1))
    .to.be.revertedWith('RMRKNotOwner()');

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
      .to.be.revertedWith('_numToMint > reserve');
  });

  it("CC_drop_soulbound_revokable regular mint", async function() {
    await expect(CC_drop_soulbound_revokable.connect(account1).mint(owner.address, 2))
      .to.be.revertedWith('Minting not started yet.');

    await expect(CC_drop_soulbound_revokable.connect(account1).setDropStart(dropStartPresent))
      .to.be.revertedWith('RMRKNotOwner()');

    await CC_drop_soulbound_revokable.setDropStart(dropStartPresent);

    await expect(CC_drop_soulbound_revokable.connect(account1).mint(owner.address, 2))
      .to.be.revertedWith('RMRKMintUnderpriced()');

    await CC_drop_soulbound_revokable.connect(account1)
      .mint(owner.address, 2, {value: ethers.utils.parseEther('0.01').mul('2')});
  });

  it("Check burn availabilty", async function() {
    await CC_onlyOwner.ownerMint(owner.address, 6);
    await expect(CC_onlyOwner.connect(account1)['burn(uint256,uint256)'](1, 0)).to.be.revertedWith('RMRKNotOwner()');
    await expect(CC_onlyOwner['burn(uint256,uint256)'](1, 0)).to.be.revertedWith('NFT not revokable!');

    await CC_drop_soulbound_revokable.ownerMint(owner.address, 6);
    await expect(CC_drop_soulbound_revokable.connect(account1)['burn(uint256,uint256)'](1, 0)).to.be.revertedWith('RMRKNotOwner()');
    await CC_drop_soulbound_revokable['burn(uint256,uint256)'](1, 0);

    await expect(CC_drop_soulbound_revokable['burn(uint256,uint256)'](10, 0)).to.be.revertedWith('ERC721InvalidTokenId()');
  });

  it("Check transfer availabilty", async function() {
    await CC_onlyOwner.ownerMint(owner.address, 6);
    await CC_onlyOwner.transferFrom(owner.address, account1.address, 1);

    await CC_drop_soulbound_revokable.ownerMint(owner.address, 6);
    await expect(CC_drop_soulbound_revokable.transferFrom(owner.address, account1.address, 1)).to.be.revertedWith('Transfers not allowed!');
  });

  it("Only owner can updateRoyaltyRecipient", async function() {
    await expect(CC_onlyOwner.connect(account1).updateRoyaltyRecipient(account2.address))
      .to.be.revertedWith('RMRKNotOwner()');

    await CC_onlyOwner.updateRoyaltyRecipient(account2.address);
  });

  it("Only owner can setDropStart", async function() {
    await expect(CC_drop_soulbound_revokable.connect(account1).setDropStart(0))
      .to.be.revertedWith('RMRKNotOwner()');

    await CC_drop_soulbound_revokable.setDropStart(10);

    await expect(CC_drop_soulbound_revokable.setDropStart(0))
      .to.be.revertedWith('Minting already started!');
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
    ).to.be.revertedWith('RMRKNotOwner()');

    await expect(CC_onlyOwner.connect(account1).setBaseExtension(baseEXT)
    ).to.be.revertedWith('RMRKNotOwner()');

    await CC_onlyOwner.setBaseURI(baseURI);
    await CC_onlyOwner.setBaseExtension(baseEXT);
    
    expect(await CC_onlyOwner.tokenURI(1)).to.equal(`${baseURI}1${baseEXT}`);
  });

  it("withdrawRaised", async function() {
    await CC_drop_soulbound_revokable.setDropStart(10);
    await CC_drop_soulbound_revokable.connect(account1)
      .mint(account1.address, 1, {value: ethers.utils.parseEther('0.01')});

    const ownerBalanceBefore = await owner.getBalance();

    await expect(CC_drop_soulbound_revokable.connect(account1).withdrawRaised(account1.address, ethers.utils.parseEther('0.01')))
      .to.be.revertedWith('RMRKNotOwner()');

    const tx = await CC_drop_soulbound_revokable.withdrawRaised(owner.address, ethers.utils.parseEther('0.01'));

    const receipt = await tx.wait()
    const gasSpent = receipt.gasUsed.mul(receipt.effectiveGasPrice);

    const ownerBalanceAfter = await owner.getBalance();

    expect(ownerBalanceAfter.add(gasSpent).sub(ownerBalanceBefore)).to.equal(ethers.utils.parseEther('0.01'));
  });

  it("Check walletOfOwner function", async function() {
    await CC_onlyOwner.ownerMint(account1.address, 2);

    expect(await CC_onlyOwner.balanceOf(account1.address)).to.equal(2);
    const ids = await CC_onlyOwner.walletOfOwner(account1.address);
    expect(ids[0]).to.equal(1);
    expect(ids[1]).to.equal(2);

    await CC_onlyOwner.ownerMint(account2.address, 1);
    expect(await CC_onlyOwner.balanceOf(account2.address)).to.equal(1);
  });

});
