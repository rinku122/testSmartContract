import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-network-helpers");

describe("Mindpay", () => {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  const deployMindpay = async () => {
    let stakingContract: any = await ethers.getContractFactory("Staking");
    stakingContract = await stakingContract.deploy();
    const [owner, liquidityContract] = await ethers.getSigners();
    let mindpay: any = await ethers.getContractFactory("Mindpay");
    mindpay = await mindpay.deploy(
      stakingContract.address,
      liquidityContract.address,
      "MP"
    );
    return { mindpay, stakingContract };
  };

  describe("Investment", () => {
    it("Contract should get mindpay tokens according to user invetstment", async () => {
      const [owner, liquidityContract] = await ethers.getSigners();
      const { mindpay } = await loadFixture(deployMindpay);
      let value: any = ethers.utils.parseEther("10");
      let ethBalanceBeforeLiquiditContract = await ethers.provider.getBalance(
        liquidityContract.address
      );
      let transaction = await mindpay.connect(owner).invest({ value });
      console.log("Transaction hash investment:", transaction.hash);
      await expect(mindpay.connect(owner).invest({ value })).to.be.revertedWith(
        "User already invetsted"
      );

      const tokens = await mindpay.balanceOf(mindpay.address);
      let ethBalanceAfterLiquiditContract = await ethers.provider.getBalance(
        liquidityContract.address
      );
      expect(tokens).to.be.eq("10800000000000000000000");

      expect(ethBalanceAfterLiquiditContract).to.be.above(
        ethBalanceBeforeLiquiditContract
      );
    });
  });

  describe("Cancel Investment", () => {
    it("Mindpay token should be burned", async () => {
      const [owner, liquidityContract] = await ethers.getSigners();
      const { mindpay, stakingContract } = await loadFixture(deployMindpay);
      let value: any = ethers.utils.parseEther("10");
      await mindpay.connect(owner).invest({ value });
      let ethBalanceBeforeOwner = await ethers.provider.getBalance(
        owner.address
      );

      await expect(
        mindpay.connect(owner).cancelInvestment()
      ).to.be.revertedWith("Locking period not over");

      await helpers.time.increase(900);

      let transaction = await mindpay.connect(owner).cancelInvestment();
      console.log("Transaction hash Cancel investment:", transaction.hash);
      const tokens = await mindpay.balanceOf(mindpay.address);

      const totalInvestment = (await mindpay.users(owner.address))
        .totalInvestment;
      const lockedInvestment = (await mindpay.users(owner.address))
        .lockedInvestment;
      let ethBalanceAfterOwner = await ethers.provider.getBalance(
        owner.address
      );

      expect(totalInvestment).to.be.eq("0");
      expect(lockedInvestment).to.be.eq("0");
      expect(tokens).to.be.eq("0");
      expect(ethBalanceAfterOwner).to.be.above(ethBalanceBeforeOwner);
    });
  });

  describe("Staking Investment", () => {
    it("Mindpay token should be transferred to staking contract", async () => {
      const [owner, liquidityContract] = await ethers.getSigners();
      const { mindpay, stakingContract } = await loadFixture(deployMindpay);
      let value: any = ethers.utils.parseEther("10");
      let ethBalanceBeforeLiquidityContract = await ethers.provider.getBalance(
        liquidityContract.address
      );

      let mindpayBalanceBeforeStakingContract = await mindpay.balanceOf(
        stakingContract.address
      );
      await mindpay.connect(owner).invest({ value });

      await helpers.time.increase(900);

      let transaction = await mindpay.connect(owner).stakeInvestment();
      console.log("Transaction hash Staking investment:", transaction.hash);

      let ethBalanceAfterLiquidityContract = await ethers.provider.getBalance(
        liquidityContract.address
      );

      let mindpayBalanceAfterStakingContract = await mindpay.balanceOf(
        stakingContract.address
      );

      expect(ethBalanceAfterLiquidityContract).to.be.above(
        ethBalanceBeforeLiquidityContract
      );
      expect(mindpayBalanceAfterStakingContract).to.be.above(
        mindpayBalanceBeforeStakingContract
      );
    });
  });

  describe("Remove funds from staking", () => {
    it("Can only be removed by owner", async () => {
      const [owner,liquidityContract,hackerAccount] = await ethers.getSigners();
      const { mindpay, stakingContract } = await loadFixture(deployMindpay);
      let value: any = ethers.utils.parseEther("10");

      await mindpay.connect(owner).invest({ value });

      await helpers.time.increase(900);
      const mindpayBalanceStakingBefore = await mindpay.balanceOf(
        owner.address
      );
      expect(mindpayBalanceStakingBefore).to.be.eq("0");
      await mindpay.connect(owner).stakeInvestment();

      await expect(
        stakingContract.connect(hackerAccount).removeFunds(mindpay.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");


      let transaction = await stakingContract.removeFunds(mindpay.address);
      console.log(
        "Transaction hash Removing funds from staking:",
        transaction.hash
      );

      const mindpayBalanceStakingAfter = await mindpay.balanceOf(owner.address);
      expect(mindpayBalanceStakingAfter).to.be.above(
        mindpayBalanceStakingBefore
      );
    });
  });
});
