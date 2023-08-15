import { ethers } from "ethers";
import ContractABI from "./controller/abi.json";
import dotenv from 'dotenv'
dotenv.config();


const contractAddress = process.env.CONTRACT_ADDRESS || "";

const privateKey = process.env.PRIVATEKEY || "";

const apikey = process.env.API_KEY || "";

const provider = new ethers.providers.JsonRpcProvider(
  `https://polygon-mumbai.g.alchemy.com/v2/${apikey}`,
);
const wallet = new ethers.Wallet(privateKey, provider);

const contract = new ethers.Contract(contractAddress, ContractABI, wallet);

export async function mintNft(to: string, tokenURI: number): Promise<string> {
  const transaction = await contract.mintNFT(to, tokenURI);
  const mintHash: any = await transaction.wait();
  return mintHash.transactionHash;
}