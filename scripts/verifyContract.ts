import { ethers } from "ethers";

/**
 * Verify Contract Deployment
 * Checks if the ContestOracle contract is properly deployed and accessible
 */
async function verifyContract() {
  console.log("🔍 Verifying ContestOracle contract...\n");

  const rpcUrl = process.env.BASE_MAINNET_RPC || "https://mainnet.base.org";
  const contractAddress = process.env.CONTEST_ORACLE_ADDRESS;

  if (!contractAddress) {
    console.error("❌ CONTEST_ORACLE_ADDRESS not set in environment variables");
    process.exit(1);
  }

  console.log(`📡 RPC Endpoint: ${rpcUrl}`);
  console.log(`📍 Contract Address: ${contractAddress}\n`);

  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    // Check network
    const network = await provider.getNetwork();
    console.log(`🌐 Network: ${network.name} (Chain ID: ${network.chainId})`);
    
    // Check if address has code
    const code = await provider.getCode(contractAddress);
    console.log(`📝 Contract code length: ${code.length} characters`);
    
    if (code === '0x' || code === '') {
      console.error(`\n❌ No contract deployed at ${contractAddress}`);
      console.error("Possible issues:");
      console.error("   - Wrong contract address");
      console.error("   - Contract not deployed to this network");
      console.error("   - Wrong RPC endpoint");
      process.exit(1);
    }

    console.log("✅ Contract exists at this address\n");

    // Try to call contestCount
    const ABI = [
      "function contestCount() view returns (uint256)",
      "function admin() view returns (address)",
      "function resolverSigner() view returns (address)"
    ];

    const contract = new ethers.Contract(contractAddress, ABI, provider);

    try {
      const contestCount = await contract.contestCount();
      console.log(`📊 Contest Count: ${contestCount.toString()}`);
      
      const admin = await contract.admin();
      console.log(`👤 Admin Address: ${admin}`);
      
      try {
        const resolverSigner = await contract.resolverSigner();
        console.log(`🔑 Resolver Signer: ${resolverSigner}`);
      } catch (e) {
        console.log("⚠️  Resolver signer not set yet");
      }

      console.log("\n✅ Contract is fully functional and accessible!");
      console.log(`\n💡 If creating first contest, contestCount will be 0 (normal)`);
    } catch (callError: any) {
      console.error(`\n❌ Error calling contract methods: ${callError.message}`);
      console.error("The contract exists but may have a different ABI");
      process.exit(1);
    }

  } catch (error: any) {
    console.error(`\n❌ Verification failed: ${error.message}`);
    console.error("Full error:", error);
    process.exit(1);
  }
}

verifyContract();
