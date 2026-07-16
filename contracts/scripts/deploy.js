const { ethers } = require('hardhat');

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with account:', deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log('Deployer balance:', ethers.formatEther(balance), 'ETH');

  const CertificateRegistry = await ethers.getContractFactory('CertificateRegistry');
  const certificateRegistry = await CertificateRegistry.deploy();

  await certificateRegistry.waitForDeployment();

  console.log('CertificateRegistry deployed to:', certificateRegistry.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
