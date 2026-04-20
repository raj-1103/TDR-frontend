"use client";

import React, { useState } from "react";
import { Card, CardTitle, FormGroup, Input, Button, Alert } from "@/app/components/ui";
import { useApp } from "@/app/context/AppContext";
import type { AlertState, VerifyResult } from "@/lib/types";
import { apiGet } from "@/lib/api";

export default function VerifyPanel() {
  const { apiBase } = useApp();
  const [docID, setDocID] = useState("");
  const [hash, setHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [result, setResult] = useState<VerifyResult | null>(null);

  const handleSubmit = async () => {
    if (!docID || !hash) {
      return setAlert({ type: "error", message: "Both fields are required" });
    }
    setLoading(true);
    setAlert(null);
    try {
      const data: VerifyResult = await apiGet(apiBase, "/verify", { docID, hash });
      setResult(data);
    } catch (e: unknown) {
      setAlert({ type: "error", message: e instanceof Error ? e.message : "Verification failed" });
    } finally {
      setLoading(false);
    }
  };

  const detailRows: [string, string, boolean][] = result
    ? [
        ["Reason", result.reason, false],
        ["Status", result.status || "—", false],
        ["Document ID", result.docID || docID, false],
        ["Ethereum TxHash", result.ethTxHash || "—", true],
        ["Merkle Root", result.merkleRoot || "—", true],
        ["Batch ID", result.batchID || "—", false],
      ]
    : [];

  return (
    <div style={{ animation: "fadeIn 0.2s ease" }}>
      <Card style={{ maxWidth: "600px" }}>
        <CardTitle icon="✓">Verify Document Authenticity</CardTitle>
        <Alert alert={alert} />
        <FormGroup label="Document ID">
          <Input placeholder="TDR-2025-XXXX" value={docID} onChange={(e) => setDocID(e.target.value)} />
        </FormGroup>
        <FormGroup label="Document Hash (Keccak-256)">
          <Input
            placeholder="64-character hex hash"
            value={hash}
            onChange={(e) => setHash(e.target.value)}
            style={{ fontFamily: "'DM Mono', monospace", fontSize: "12px" }}
          />
        </FormGroup>
        <Button loading={loading} onClick={handleSubmit}>
          Verify Integrity
        </Button>
      </Card>

      {result && (
        <div
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            padding: "28px",
            marginTop: "20px",
            animation: "fadeIn 0.2s ease",
          }}
        >
          <div
            style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: "32px",
              marginBottom: "20px",
              color: result.valid ? "var(--teal)" : "var(--red)",
            }}
          >
            {result.valid ? "✓ Authentic" : "✗ Tampered"}
          </div>

          <dl
            style={{
              display: "grid",
              gridTemplateColumns: "160px 1fr",
              gap: "12px",
              fontSize: "13px",
            }}
          >
            {detailRows.map(([label, value, mono]) => (
              <React.Fragment key={label}>
                <dt style={{ color: "var(--text3)", fontWeight: 500 }}>{label}</dt>
                <dd
                  style={{
                    color: "var(--text)",
                    wordBreak: "break-all",
                    fontFamily: mono ? "'DM Mono', monospace" : "inherit",
                    fontSize: mono ? "11px" : "13px",
                  }}
                >
                  {value}
                </dd>
              </React.Fragment>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}
