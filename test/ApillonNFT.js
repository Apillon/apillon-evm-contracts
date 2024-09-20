const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ApillonNFT", function () {
  let CC_onlyOwner,
    CC_drop_soulbound_revokable,
    CC_manual,
    CC_manual_drop,
    controller,
    admin,
    account1,
    account2,
    royalties,
    dropStartPresent,
    dropStartFuture;
  let controllerRole = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes("CONTROLLER_ROLE")
  );
  let adminRole =
    "0x0000000000000000000000000000000000000000000000000000000000000000";

  before(async () => {
    await hre.network.provider.send("hardhat_reset");
  });

  beforeEach(async () => {
    [controller, account1, account2, royalties, admin] =
      await ethers.getSigners();
    const CContract = await ethers.getContractFactory("ApillonNFT");

    dropStartPresent = Math.ceil(new Date().getTime() / 1000); // present
    dropStartFuture = Math.ceil(new Date().getTime() / 1000) + 3600; // 1h in future

    CC_onlyOwner = await CContract.deploy(
      "Test", // _name
      "XXX", // _symbol
      "https://api.example.com/nfts/1/", // _initBaseURI
      ".json", // _baseExtension
      [false, false, false, true], //  _settings - [isDrop, isSoulbound, isRevokable, isAutoIncrement]
      [ethers.utils.parseEther("0.01"), dropStartFuture, 10, 6, 500], //  _price, _dropStart, _maxSupply, _reserve, _royaltiesFees (100 = 1%)
      royalties.address, // _royaltiesAddress
      admin.address
    );
    await CC_onlyOwner.deployed();

    CC_drop_soulbound_revokable = await CContract.deploy(
      "Test", // _name
      "XXX", // _symbol
      "https://api.example.com/nfts/1/", // _initBaseURI
      ".json", // _baseExtension
      [true, true, true, true], //  _settings - [isDrop, isSoulbound, isRevokable, isAutoIncrement]
      [ethers.utils.parseEther("0.01"), dropStartFuture, 10, 6, 5], //  _price, _dropStart, _maxSupply, _reserve, _royaltiesFees (100 = 1%)
      royalties.address, // _royaltiesAddress
      admin.address // _admin
    );
    await CC_drop_soulbound_revokable.deployed();

    CC_manual_drop = await CContract.deploy(
      "Test", // _name
      "XXX", // _symbol
      "https://api.example.com/nfts/1/", // _initBaseURI
      ".json", // _baseExtension
      [true, false, false, false], //  _settings - [isDrop, isSoulbound, isRevokable, isAutoIncrement]
      [ethers.utils.parseEther("0.01"), dropStartFuture, 10, 6, 500], //  _price, _dropStart, _maxSupply, _reserve, _royaltiesFees (100 = 1%)
      royalties.address, // _royaltiesAddress
      admin.address // _admin
    );
    await CC_manual_drop.deployed();

    CC_manual = await CContract.deploy(
      "Test", // _name
      "XXX", // _symbol
      "https://api.example.com/nfts/1/", // _initBaseURI
      ".json", // _baseExtension
      [false, false, false, false], //  _settings - [isDrop, isSoulbound, isRevokable, isAutoIncrement]
      [ethers.utils.parseEther("0.01"), dropStartFuture, 50, 6, 500], //  _price, _dropStart, _maxSupply, _reserve, _royaltiesFees (100 = 1%)
      royalties.address, // _royaltiesAddress
      admin.address // _admin
    );
    await CC_manual.deployed();
  });

  it("Admin wallet should be the admin of the contract", async function () {
    expect(await CC_onlyOwner.hasRole(adminRole, admin.address)).to.equal(true);
  });

  it("Transfer admin role", async function () {
    await CC_onlyOwner.connect(admin).grantRole(adminRole, royalties.address);
    await CC_onlyOwner.connect(admin).revokeRole(adminRole, admin.address);
    expect(await CC_onlyOwner.hasRole(adminRole, admin.address)).to.equal(
      false
    );
    expect(await CC_onlyOwner.hasRole(adminRole, royalties.address)).to.equal(
      true
    );
  });

  it("Deployer should be the controller of the contract", async function () {
    expect(
      await CC_onlyOwner.hasRole(controllerRole, controller.address)
    ).to.equal(true);
  });

  it("tokenURI should be same as set in constructor", async function () {
    await CC_onlyOwner.ownerMint(controller.address, 3);
    expect(await CC_onlyOwner.tokenURI(3)).to.equal(
      "https://api.example.com/nfts/1/3.json"
    );

    await expect(CC_onlyOwner.tokenURI(4)).to.be.revertedWith(
      "ERC721Metadata: URI query for nonexistent token"
    );
  });

  it("CC_onlyOwner only owner can mint", async function () {
    await expect(
      CC_onlyOwner.connect(account1).ownerMint(controller.address, 1)
    ).to.be.revertedWith(``);

    await expect(
      CC_onlyOwner.connect(account1).mint(controller.address, 1)
    ).to.be.revertedWith("isDrop == false");
  });

  it("CC_onlyOwner allow only maxSupply", async function () {
    await CC_onlyOwner.ownerMint(controller.address, 6);
    await CC_onlyOwner.ownerMint(controller.address, 4);
    await expect(CC_onlyOwner.ownerMint(controller.address, 1)).to.be.reverted;
  });

  it("CC_onlyOwner can set metadata for specific token", async function () {
    await CC_onlyOwner.connect(controller).ownerMint(controller.address, 1);
    expect(await CC_onlyOwner.tokenURI(1)).to.equal(
      "https://api.example.com/nfts/1/1.json"
    );
    const tokenUri = "https://custom.com/1";
    await CC_onlyOwner.connect(controller).setTokenURI(1, tokenUri);
    expect(await CC_onlyOwner.tokenURI(1)).to.equal(tokenUri);
    await CC_onlyOwner.connect(controller).setTokenURI(1, "");
    expect(await CC_onlyOwner.tokenURI(1)).to.equal(
      "https://api.example.com/nfts/1/1.json"
    );
  });

  it("CC_onlyOwner owner can mint with setting URIs", async function () {
    await CC_onlyOwner.connect(controller).ownerMint(controller.address, 1);
    const tokenUri = "http://test.com";
    const mints = [];
    mints.push({
      to: controller.address,
      numToMint: 1,
      idsToMint: [],
      URIs: [tokenUri],
    });
    await CC_onlyOwner.connect(controller).ownerMintIdsWithUri(mints);

    expect(await CC_onlyOwner.tokenURI(1)).to.equal(
      "https://api.example.com/nfts/1/1.json"
    );
    expect(await CC_onlyOwner.tokenURI(2)).to.equal(tokenUri);
  });

  it("CC_drop_soulbound_revokable allow only reserve", async function () {
    await CC_drop_soulbound_revokable.ownerMint(controller.address, 2);
    await CC_drop_soulbound_revokable.ownerMint(controller.address, 4);
    await expect(
      CC_drop_soulbound_revokable.ownerMint(controller.address, 1)
    ).to.be.revertedWith("quantity > reserve");
  });

  it("CC_drop_soulbound_revokable regular mint", async function () {
    await expect(
      CC_drop_soulbound_revokable.connect(account1).mint(controller.address, 2)
    ).to.be.revertedWith("Minting not started yet.");

    await expect(
      CC_drop_soulbound_revokable.connect(account1).setDropStart(
        dropStartPresent
      )
    ).to.be.revertedWith(
      `AccessControl: account ${account1.address.toLowerCase()} is missing role ${controllerRole}`
    );

    await CC_drop_soulbound_revokable.setDropStart(dropStartPresent);

    await expect(
      CC_drop_soulbound_revokable.connect(account1).mint(controller.address, 2)
    ).to.be.revertedWith("Insufficient amount.");

    await CC_drop_soulbound_revokable.connect(account1).mint(
      controller.address,
      2,
      {
        value: ethers.utils.parseEther("0.01").mul("2"),
      }
    );

    await expect(
      CC_drop_soulbound_revokable.connect(account1).mintIds(
        controller.address,
        0,
        [1, 2]
      )
    ).to.be.revertedWith(
      "isAutoIncrement ON: set numToMint > 0 & leave IDs empty"
    );
  });

  it("Check burn availabilty", async function () {
    await CC_onlyOwner.ownerMint(controller.address, 6);
    await expect(CC_onlyOwner.connect(account1).burn(1)).to.be.revertedWith(
      `AccessControl: account ${account1.address.toLowerCase()} is missing role ${controllerRole}`
    );
    await expect(CC_onlyOwner.burn(1)).to.be.revertedWith("NFT not revokable!");

    await CC_drop_soulbound_revokable.ownerMint(controller.address, 6);
    await expect(
      CC_drop_soulbound_revokable.connect(account1).burn(1)
    ).to.be.revertedWith(
      `AccessControl: account ${account1.address.toLowerCase()} is missing role ${controllerRole}`
    );
    await CC_drop_soulbound_revokable.burn(1);

    await expect(CC_drop_soulbound_revokable.burn(10)).to.be.revertedWith(
      "ERC721: invalid token ID"
    );
  });

  it("Check mint after burn", async function () {
    //mint 2 NFTs
    await CC_drop_soulbound_revokable.ownerMint(controller.address, 2);
    let ids = await CC_drop_soulbound_revokable.walletOfOwner(
      controller.address
    );
    expect(ids.length).to.equal(2);
    expect(ids[0]).to.equal(1);
    expect(ids[1]).to.equal(2);

    //burn 1 NFTs
    await CC_drop_soulbound_revokable.connect(controller).burn(1);
    ids = await CC_drop_soulbound_revokable.walletOfOwner(controller.address);
    expect(ids.length).to.equal(1);

    //mint 2 NFTs
    await CC_drop_soulbound_revokable.ownerMint(controller.address, 2);
    ids = await CC_drop_soulbound_revokable.walletOfOwner(controller.address);
    expect(ids.length).to.equal(3);
    expect(ids[0]).to.equal(2);
    expect(ids[1]).to.equal(3);
    expect(ids[2]).to.equal(4);
  });

  it("Check transfer availabilty", async function () {
    await CC_onlyOwner.ownerMint(controller.address, 6);
    await CC_onlyOwner.transferFrom(controller.address, account1.address, 1);

    await CC_drop_soulbound_revokable.ownerMint(controller.address, 6);
    await expect(
      CC_drop_soulbound_revokable.transferFrom(
        controller.address,
        account1.address,
        1
      )
    ).to.be.revertedWith("Transfers not allowed!");
  });

  it("Only owner can updateRoyaltyRecipient", async function () {
    await expect(
      CC_onlyOwner.connect(account1).updateRoyaltyRecipient(account2.address)
    ).to.be.revertedWith(
      `AccessControl: account ${account1.address.toLowerCase()} is missing role ${controllerRole}`
    );

    await CC_onlyOwner.updateRoyaltyRecipient(account2.address);
  });

  it("Only owner can setDropStart", async function () {
    await expect(
      CC_drop_soulbound_revokable.connect(account1).setDropStart(0)
    ).to.be.revertedWith(
      `AccessControl: account ${account1.address.toLowerCase()} is missing role ${controllerRole}`
    );

    await CC_drop_soulbound_revokable.setDropStart(10);

    await expect(
      CC_drop_soulbound_revokable.setDropStart(0)
    ).to.be.revertedWith("Minting already started!");
  });

  it("supportsInterface", async function () {
    expect(await CC_onlyOwner.supportsInterface("0x2a55205a")).to.equal(true);
    expect(await CC_onlyOwner.supportsInterface("0x2a552059")).to.equal(false);
  });

  it("royaltyInfo", async function () {
    const resp = await CC_onlyOwner.royaltyInfo(0, 100);
    expect(resp.receiver).to.equal(royalties.address);
    expect(resp.royaltyAmount).to.equal(5);
  });

  it("Change baseURI", async function () {
    await CC_onlyOwner.ownerMint(controller.address, 1);

    expect(await CC_onlyOwner.tokenURI(1)).to.equal(
      "https://api.example.com/nfts/1/1.json"
    );

    const baseURI = "https://fakeurl.com/";
    const baseEXT = ".txt";

    await expect(
      CC_onlyOwner.connect(account1).setBaseURI(baseURI)
    ).to.be.revertedWith(
      `AccessControl: account ${account1.address.toLowerCase()} is missing role ${controllerRole}`
    );

    await expect(
      CC_onlyOwner.connect(account1).setBaseExtension(baseEXT)
    ).to.be.revertedWith(
      `AccessControl: account ${account1.address.toLowerCase()} is missing role ${controllerRole}`
    );

    await CC_onlyOwner.setBaseURI(baseURI);
    await CC_onlyOwner.setBaseExtension(baseEXT);

    expect(await CC_onlyOwner.tokenURI(1)).to.equal(`${baseURI}1${baseEXT}`);
  });

  it("Withdraw", async function () {
    await CC_drop_soulbound_revokable.setDropStart(10);
    await CC_drop_soulbound_revokable.connect(account1).mint(
      account1.address,
      1,
      { value: ethers.utils.parseEther("0.01") }
    );

    const ownerBalanceBefore = await controller.getBalance();

    await expect(
      CC_drop_soulbound_revokable.connect(account1).withdrawRaised(
        controller.address,
        ethers.utils.parseEther("0.01")
      )
    ).to.be.revertedWith(
      `AccessControl: account ${account1.address.toLowerCase()} is missing role ${controllerRole}`
    );

    const tx = await CC_drop_soulbound_revokable.withdrawRaised(
      controller.address,
      ethers.utils.parseEther("0.01")
    );

    const receipt = await tx.wait();
    const gasSpent = receipt.gasUsed.mul(receipt.effectiveGasPrice);

    const ownerBalanceAfter = await controller.getBalance();

    expect(ownerBalanceAfter.add(gasSpent).sub(ownerBalanceBefore)).to.equal(
      ethers.utils.parseEther("0.01")
    );
  });

  it("Check walletOfOwner & allTokens function", async function () {
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

  it("CC_manual_drop regular mint", async function () {
    // Mint with non-owner
    await expect(
      CC_manual_drop.connect(account1).mint(controller.address, 2)
    ).to.be.revertedWith("Minting not started yet.");

    await expect(
      CC_manual_drop.connect(account1).setDropStart(dropStartPresent)
    ).to.be.revertedWith(
      `AccessControl: account ${account1.address.toLowerCase()} is missing role ${controllerRole}`
    );

    await CC_manual_drop.setDropStart(dropStartPresent);

    await expect(
      CC_manual_drop.connect(account1).mint(controller.address, 2)
    ).to.be.revertedWith("isAutoIncrement OFF: specify IDs");

    await expect(
      CC_manual_drop.connect(account1).mintIds(controller.address, 0, [1, 2])
    ).to.be.revertedWith("Insufficient amount.");

    await CC_manual_drop.connect(account1).mintIds(
      controller.address,
      0,
      [1, 2],
      {
        value: ethers.utils.parseEther("0.01").mul("2"),
      }
    );

    // Owner mint
    await expect(
      CC_manual_drop.connect(controller).ownerMintIds(controller.address, 0, [
        1,
      ])
    ).to.be.revertedWith("ERC721: token already minted");

    await expect(
      CC_manual_drop.connect(controller).ownerMintIds(controller.address, 2, [])
    ).to.be.revertedWith("isAutoIncrement OFF: specify IDs");

    await CC_manual_drop.connect(controller).ownerMintIds(
      controller.address,
      0,
      [777, 888]
    );
  });

  it("CC_manual owner mint", async function () {
    // Try mint with non-owner
    await expect(
      CC_manual.connect(account1).mint(controller.address, 2)
    ).to.be.revertedWith("isDrop == false");

    await expect(
      CC_manual.connect(account1).setDropStart(dropStartPresent)
    ).to.be.revertedWith(
      `AccessControl: account ${account1.address.toLowerCase()} is missing role ${controllerRole}`
    );

    await CC_manual.setDropStart(dropStartPresent);

    await expect(
      CC_manual.connect(account1).mint(controller.address, 2)
    ).to.be.revertedWith("isDrop == false");

    // Owner mint
    await CC_manual.connect(controller).ownerMintIds(
      controller.address,
      0,
      [1, 2, 3]
    );

    await expect(
      CC_manual.connect(controller).ownerMintIds(controller.address, 0, [1])
    ).to.be.revertedWith("ERC721: token already minted");

    await expect(
      CC_manual.connect(controller).ownerMintIds(controller.address, 2, [])
    ).to.be.revertedWith("isAutoIncrement OFF: specify IDs");

    await CC_manual.connect(controller).ownerMintIds(
      controller.address,
      0,
      [777, 888]
    );
  });

  it("CC_manual owner can mint with setting URIs", async function () {
    const mints = [];
    mints.push({
      to: controller.address,
      numToMint: 0,
      idsToMint: [1, 5, 6],
      URIs: ["", "https://test.com/5", "https://test.com/6"],
    });
    await CC_manual.connect(controller).ownerMintIdsWithUri(mints);

    expect(await CC_manual.tokenURI(1)).to.equal(
      "https://api.example.com/nfts/1/1.json"
    );
    expect(await CC_manual.tokenURI(5)).to.equal("https://test.com/5");
  });

  it("CC_manual owner can mint multiple nfts to multiple addresses", async function () {
    const mints = [];
    mints.push({
      to: controller.address,
      numToMint: 0,
      idsToMint: [1, 5, 6],
      URIs: ["", "https://test.com/5", "https://test.com/6"],
    });

    for (let i = 0; i < 17; i++) {
      mints.push({
        to: account2.address,
        numToMint: 0,
        idsToMint: [7 + i],
        URIs: [`https://test.com/${7 + i}`],
      });
    }

    await CC_manual.connect(controller).ownerMintIdsWithUri(mints);

    expect(await CC_manual.tokenURI(1)).to.equal(
      "https://api.example.com/nfts/1/1.json"
    );
    expect(await CC_manual.tokenURI(5)).to.equal("https://test.com/5");
    expect(await CC_manual.balanceOf(account2.address)).to.equal(17);
  });
});
