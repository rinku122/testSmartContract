import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

import dotenv from "dotenv";
dotenv.config();
const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.7",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },

  gasReporter: {
    enabled: false,
  },

  networks: {
    // localhost: {
    //   url: "http://127.0.0.1:8545",
    //   accounts: [`${process.env.PRIVATE_KEY}`],
    // },
    // Rinkeby: {
    //   url: process.env.INFURA_RINKEBY,
    //   accounts: [`${process.env.PRIVATE_KEY}`],
    //   gas: "auto",
    //   gasPrice: "auto",
    // },
  },
};

export default config;
