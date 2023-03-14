const { expect } = require("chai");

describe("ApillonNFT", function() {
  let CC, reserve, cost, owner, account1, account2, royalties, dropStartPresent, dropStartFuture;

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
      [false, false, false], //  _settings - [isDrop, isSoulbound, isRevokable]
      ethers.utils.parseEther('0.01'), //  _price
      dropStartFuture, //  _dropStart
      10, //  _maxSupply
      6, //  _reserve
      royalties.address, // _royaltiesAddress
      5, // _royaltiesFees
    );
    await CC_onlyOwner.deployed();

    CC_drop_soulbound_revokable = await CContract.deploy(
      "Test", // _name
      "XXX", // _symbol
      "https://api.example.com/nfts/1/", // _initBaseURI
      ".json", // _baseExtension
      [true, true, true], //  _settings - [isDrop, isSoulbound, isRevokable]
      ethers.utils.parseEther('0.01'), //  _price
      dropStartFuture, //  _dropStart
      10, //  _maxSupply
      6, //  _reserve
      royalties.address, // _royaltiesAddress
      5, // _royaltiesFees
    );
    await CC_drop_soulbound_revokable.deployed();


  });

  it("Deployer should be the owner of the contract", async function() {
    expect(await CC_onlyOwner.owner()).to.equal(owner.address);
  });

  it("tokenURI should be same as set in constructor", async function() {
    await CC_onlyOwner.ownerMint(3, owner.address);
    expect(await CC_onlyOwner.tokenURI(3)).to.equal("https://api.example.com/nfts/1/3.json");

    await expect(CC_onlyOwner.tokenURI(4)).to.be.revertedWith('ERC721Metadata: URI query for nonexistent token');
  });

  it("CC_onlyOwner only owner can mint", async function() {
    await expect(CC_onlyOwner.connect(account1).ownerMint(1, owner.address))
    .to.be.revertedWith('Ownable: caller is not the owner');

    await expect(CC_onlyOwner.connect(account1).mint(owner.address, 1))
    .to.be.revertedWith('isDrop == false');
  });

  it("CC_onlyOwner allow only maxSupply", async function() {
    await CC_onlyOwner.ownerMint(6, owner.address);
    await CC_onlyOwner.ownerMint(4, owner.address);
    await expect(CC_onlyOwner.ownerMint(1, owner.address)).to.be.reverted;
  });

  it("CC_drop_soulbound_revokable allow only reserve", async function() {
    await CC_drop_soulbound_revokable.ownerMint(2, owner.address);
    await CC_drop_soulbound_revokable.ownerMint(4, owner.address);
    await expect(CC_drop_soulbound_revokable.ownerMint(1, owner.address))
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
  });

  it("Check burn availabilty", async function() {
    await CC_onlyOwner.ownerMint(6, owner.address);
    await expect(CC_onlyOwner.connect(account1).burn(1)).to.be.revertedWith('Ownable: caller is not the owner');
    await expect(CC_onlyOwner.burn(1)).to.be.revertedWith('NFT not revokable!');

    await CC_drop_soulbound_revokable.ownerMint(6, owner.address);
    await expect(CC_drop_soulbound_revokable.connect(account1).burn(1)).to.be.revertedWith('Ownable: caller is not the owner');
    await CC_drop_soulbound_revokable.burn(1);

    await expect(CC_drop_soulbound_revokable.burn(10)).to.be.revertedWith('ERC721: invalid token ID');
  });

  it("Check transfer availabilty", async function() {
    await CC_onlyOwner.ownerMint(6, owner.address);
    await CC_onlyOwner.transferFrom(owner.address, account1.address, 1);

    await CC_drop_soulbound_revokable.ownerMint(6, owner.address);
    await expect(CC_drop_soulbound_revokable.transferFrom(owner.address, account1.address, 1)).to.be.revertedWith('Transfers not allowed!');
  });

  it("Only owner can setPrice", async function() {
    await expect(CC_onlyOwner.connect(account1).setPrice(ethers.utils.parseUnits('0.5')))
      .to.be.revertedWith('Ownable: caller is not the owner');

    await CC_onlyOwner.setPrice(ethers.utils.parseUnits('0.5'));
  });

  it("Only owner can setRoyaltiesFees", async function() {
    await expect(CC_onlyOwner.connect(account1).setRoyaltiesFees(1))
      .to.be.revertedWith('Ownable: caller is not the owner');

    await expect(CC_onlyOwner.setRoyaltiesFees(101))
      .to.be.revertedWith('royaltiesFees too high.');

    await CC_onlyOwner.setRoyaltiesFees(1);
  });

  it("Only owner can setRoyaltiesAddress", async function() {
    await expect(CC_onlyOwner.connect(account1).setRoyaltiesAddress(account2.address))
      .to.be.revertedWith('Ownable: caller is not the owner');

    await CC_onlyOwner.setRoyaltiesAddress(account2.address);
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
    await CC_onlyOwner.ownerMint(1, owner.address);

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

    await expect(CC_drop_soulbound_revokable.connect(account1).withdraw())
      .to.be.revertedWith('Ownable: caller is not the owner');

    const tx = await CC_drop_soulbound_revokable.withdraw();

    const receipt = await tx.wait()
    const gasSpent = receipt.gasUsed.mul(receipt.effectiveGasPrice);

    const ownerBalanceAfter = await owner.getBalance();

    expect(ownerBalanceAfter.add(gasSpent).sub(ownerBalanceBefore)).to.equal(ethers.utils.parseEther('0.01'));
  });

  it("Check walletOfOwner function", async function() {
    await CC_onlyOwner.ownerMint(2, account1.address);

    expect(await CC_onlyOwner.balanceOf(account1.address)).to.equal(2);
    const ids = await CC_onlyOwner.walletOfOwner(account1.address);
    expect(ids[0]).to.equal(1);
    expect(ids[1]).to.equal(2);

    await CC_onlyOwner.ownerMint(1, account2.address);
    expect(await CC_onlyOwner.balanceOf(account2.address)).to.equal(1);
  });
});
