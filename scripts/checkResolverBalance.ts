require("dotenv").config({ path: ".env.local" });
import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider(process.env.BASE_MAINNET_RPC);

async function checkBalance() {
  const address = process.env.RESOLVER_ADDRESS!;
  const balance = await provider.getBalance(address);
  
  console.log("═══════════════════════════════════════");
  console.log("  Resolver Wallet Balance Check");
  console.log("═══════════════════════════════════════");
  console.log(`Address: ${address}`);
  console.log(`Balance: ${ethers.formatEther(balance)} ETH`);
  console.log(`Wei:     ${balance.toString()}`);
  console.log("═══════════════════════════════════════");
  
  if (balance === 0n) {
    console.log("⚠️  Wallet has no funds!");
  } else {
    console.log("✅ Wallet funded and ready!");
  }
}

checkBalance().then(() => process.exit(0)).catch(console.error);
