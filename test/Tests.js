const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ERC20 token", function () {
    let owner;
    let addr1;
    let addr2;

    let vendor;
    let token;
  
    beforeEach(async () => {
      [owner, addr1, addr2] = await ethers.getSigners();
  
      const vendorContract = await ethers.getContractFactory('Vendor');
      vendor = await vendorContract.deploy();
      
      tokenAddr = await vendor.tokenAddress();
      token = await hre.ethers.getContractAt("myToken", tokenAddr);
    });

  describe("Initial states", function () {
    it("Ownership", async function () {
        expect(await vendor.admin()).to.equal(owner.address);
    });

    it("Balance", async function () {
        expect(await token.balanceOf(vendor.address)).to.equal("1000");
    });

    it("Price", async function () {
      const price = await vendor.price();

      expect(price.toString()).to.equal('1');
    });
  });

  describe("BUY tokens", function () {

    it("Require ETH > 0", async function () {
        await expect(
        vendor.connect(addr1).buyTokens({ value: 0 }))
        .to.be.revertedWith("ETH should be > 0");
    });

    it('Sufficient token balance', async () => {
      await expect(
        vendor.connect(addr1).buyTokens({ value: 1001 }))
        .to.be.revertedWith('Not enough tokens in reserves');
    });

    it("BUY", async function () {
        let vendorBalance = await token.balanceOf(vendor.address);
        let addr1Balance = await token.balanceOf(addr1.address);

        console.log("Inital state");
        console.log("Vendor address:", vendorBalance.toString());
        console.log("Addr1 balance:", addr1Balance.toString());

        await expect(await vendor.connect(addr1).buyTokens({value: 100}))
        .to.emit(vendor, "Bought")
        .withArgs(addr1.address, 100, 100);

        vendorBalance = await token.balanceOf(vendor.address);
        addr1Balance = await token.balanceOf(addr1.address);

        console.log("After trade");
        console.log("Vendor address:", vendorBalance.toString());
        console.log("Addr1 balance:", addr1Balance.toString());
    });
  });

  describe("SELL tokens", function () {

    it("Sell amount > 0", async function () {
      await expect(
        vendor.connect(addr1).sellTokens(0))
        .to.be.revertedWith('Sell amount > 0');
    });

    it("Allowance", async function () {
      await vendor.connect(addr1).buyTokens({value: 100});

      await expect(
        vendor.connect(addr1).sellTokens(100))
        .to.be.revertedWith('No token allowance');
    });

    it("SELL", async function () {
        await vendor.connect(addr1).buyTokens({value: 100});

        const approve = await token.connect(addr1).approve(vendor.address, 100);
        await expect(approve).to.emit(token, "Approval").withArgs(addr1.address, vendor.address, 100);
        let allowance = await token.allowance(addr1.address, vendor.address);
        expect(allowance).to.equal(100);
        
        const sold = await vendor.connect(addr1).sellTokens(50);
        await expect(sold).to.emit(vendor, "Sold").withArgs(addr1.address, 50, 50);

        allowance = await token.allowance(addr1.address, vendor.address);
        expect(allowance).to.equal(50);
    });
  });

});
