import { ethers } from "hardhat";

const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms * 1000));

async function main() {
  let stakingContract: any = await ethers.getContractFactory("Staking");
  stakingContract = await stakingContract.deploy();
  const [owner] = await ethers.getSigners();
  let mindpay: any = await ethers.getContractFactory("Mindpay");
  mindpay = await mindpay.deploy(stakingContract.address, owner.address, "MP");
  
  console.log("Mindpay", mindpay.address);
  console.log("Staking", stakingContract.address);
  console.log("Deployment Finished.............");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
