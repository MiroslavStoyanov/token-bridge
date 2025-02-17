const { ethers } = require("hardhat");

async function main() {
  // Deploy Token contract
  const Token = await ethers.getContractFactory("Token");
  const token = await Token.deploy("BridgeToken", "BTK");
  await token.waitForDeployment();
  console.log(`BSC Token deployed at: ${await token.getAddress()}`);

  // Deploy Bridge contract
  const owner = (await ethers.getSigners())[0].address; // Get deployer's address
  const Bridge = await ethers.getContractFactory("Bridge");
  const bridge = await Bridge.deploy(await token.getAddress(), owner);
  await bridge.waitForDeployment();
  console.log(`BSC Bridge deployed at: ${await bridge.getAddress()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
