import { ethers } from "ethers";

const ABI = [
  "function createContest(string question,uint256 deadline,uint8 resolutionType) returns (uint256)",
  "function resolveManual(uint256 contestId,bool outcome,string proofURI)",
  "function resolveContest(uint256 contestId,bool outcome,bytes signature)",
  "function setResolverSigner(address _signer)",
  "function resolverSigner() view returns (address)",
  "function contestCount() view returns (uint256)",
  "event ContestCreated(uint256 indexed contestId,string question,uint256 deadline,uint8 resolutionType)",
  "event ContestResolved(uint256 indexed contestId,bool outcome,uint8 resolutionType,string proofURI)"
];

export function getContestOracle() {
  const provider = new ethers.JsonRpcProvider(
    process.env.BASE_MAINNET_RPC
  );

  const wallet = new ethers.Wallet(
    process.env.ADMIN_SIGNER_PRIVATE_KEY!,
    provider
  );

  return new ethers.Contract(
    process.env.CONTEST_ORACLE_ADDRESS!,
    ABI,
    wallet
  );
}

/**
 * Create a contest with proper nonce management
 */
export async function createContestWithNonce(
  oracle: ethers.Contract,
  question: string,
  deadline: number,
  resolutionType: number,
  manualNonce?: number
) {
  const options: any = {};
  
  if (manualNonce !== undefined) {
    options.nonce = manualNonce;
  }
  
  return oracle.createContest(question, deadline, resolutionType, options);
}

/**
 * Extract contest ID from transaction receipt with multiple fallback strategies
 */
export async function extractContestId(
  oracle: ethers.Contract,
  receipt: ethers.TransactionReceipt
): Promise<string> {
  // Strategy 1: Parse ContestCreated event from logs
  for (const log of receipt.logs) {
    try {
      const parsed = oracle.interface.parseLog({
        topics: [...log.topics],
        data: log.data,
      });
      
      if (parsed && parsed.name === "ContestCreated" && parsed.args?.contestId) {
        const contestId = parsed.args.contestId.toString();
        console.log(`✅ Extracted contestId from event: ${contestId}`);
        return contestId;
      }
    } catch (e) {
      // Continue to next log
    }
  }
  
  // Strategy 2: Query the contract for contestCount
  // Since contestCount is incremented before creating the contest,
  // the current contestCount equals the just-created contest ID
  try {
    console.log("⚠️ Event parsing failed, querying contract for contestCount...");
    
    // First verify the contract is deployed
    const code = await oracle.runner?.provider?.getCode(await oracle.getAddress());
    console.log(`📝 Contract code length: ${code?.length || 0}`);
    
    if (!code || code === '0x') {
      throw new Error(`No contract deployed at address: ${await oracle.getAddress()}`);
    }
    
    const count = await oracle.contestCount();
    console.log(`📊 Raw contestCount response: ${count}`);
    
    const contestId = count.toString();
    if (contestId === '0') {
      throw new Error("contestCount returned 0 - this may be the first contest or contract state issue");
    }
    
    console.log(`✅ Got contestId from contestCount: ${contestId}`);
    return contestId;
  } catch (e: any) {
    console.error("❌ Failed to query contestCount:", e.message);
    console.error("Full error:", e);
    throw new Error(`Cannot determine contest ID: ${e.message}. Contract address: ${await oracle.getAddress()}`);
  }
}
