require("@nomicfoundation/hardhat-ethers");
require("dotenv").config();

const ARC_TESTNET_RPC_URL =
  process.env.ARC_TESTNET_RPC_URL || "https://rpc.testnet.arc.network";
const ARC_TESTNET_PRIVATE_KEY = process.env.ARC_TESTNET_PRIVATE_KEY || "";

module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    arcTestnet: {
      url: ARC_TESTNET_RPC_URL,
      chainId: 5042002,
      accounts: ARC_TESTNET_PRIVATE_KEY ? [ARC_TESTNET_PRIVATE_KEY] : []
    }
  }
};
