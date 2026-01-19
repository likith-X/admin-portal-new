import { ethers } from "ethers";

const ABI = [
  "function createContest(string question,uint256 deadline,uint8 resolutionType) returns (uint256)",
  "function resolveManual(uint256 contestId,bool outcome,string proofURI)",
  "function resolveContest(uint256 contestId,bool outcome,bytes signature)",
  "function setResolverSigner(address _signer)",
  "function resolverSigner() view returns (address)",
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
