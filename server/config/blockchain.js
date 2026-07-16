const path = require('path');
const fs = require('fs');
const { ethers } = require('ethers');

require('dotenv').config({ path: path.resolve(__dirname, '../../contracts/.env') });

const artifactPath = path.resolve(
  __dirname,
  '../../contracts/artifacts/contracts/CertificateRegistry.sol/CertificateRegistry.json'
);
const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contractAddress = process.env.CONTRACT_ADDRESS;

const contract = new ethers.Contract(contractAddress, artifact.abi, signer);

module.exports = contract;
