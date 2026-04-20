export type Panel =
  | "dashboard"
  | "register"
  | "upload"
  | "issue"
  | "transfer"
  | "query"
  | "verify"
  | "history"
  | "graph";

export interface AlertState {
  type: "success" | "error" | "info";
  message: string;
}

export interface TDR {
  tdrId: string;
  owner: string;
  fabricId: string;
  area: number;
}

export interface HistoryEntry {
  action: string;
  actor: string;
  fromOwner: string;
  toOwner: string;
  txID: string;
  timestamp: string;
}

export interface GraphData {
  docID: string;
  chain: string;
  nodes: { id: string; label: string }[];
  edges: { source: string; target: string; label: string; action: string; txID: string }[];
}

export interface VerifyResult {
  valid: boolean;
  status: string;
  docID: string;
  ethTxHash: string;
  merkleRoot: string;
  batchID: string;
  reason: string;
}
