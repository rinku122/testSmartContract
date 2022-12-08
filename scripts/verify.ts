const hre = require("hardhat");

async function main() {
  await hre.run("verify:verify", {
    //Deployed contract address
    address: "0x99196080372956ad02843F6c5042454BA3aBBd07",
    //Pass arguments as string and comma seprated values
    constructorArguments: [],
    //Path of your main contract.
    contract: "contracts/Mindpay.sol:Mindpay",
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
//npx hardhat run --network rinkeby  scripts/verify.ts
