"use client";

import React, { useState } from "react";
import { Card, CardTitle, FormGroup, Input, Button, Alert, JSONView, TwoCol } from "@/app/components/ui";
import { useApp } from "@/app/context/AppContext";
import type { AlertState } from "@/lib/types";

export default function TransferPanel() {
  const { apiBase } = useApp();
  const [fabricID, setFabricID] = useState("");
  const [docID, setDocID] = useState("");
  const [newOwner, setNewOwner] = useState("");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  const handleSubmit = async () => {
    if (!fabricID || !docID || !newOwner) {
      return setAlert({ type: "error", message: "All fields are required" });
    }
    setLoading(true);
    setAlert(null);
    try {
      const res = await fetch(`${apiBase}/transfer-tdr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fabricID, docID, newOwner }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Transfer failed");
      }
      const ct = res.headers.get("Content-Type") || "";
      const txID = res.headers.get("X-Tx-ID") || "";
      if (ct.includes("pdf")) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `TDR_${docID}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        setAlert({ type: "success", message: `Transfer complete! TxID: ${txID}. PDF downloaded.` });
        setResult({ txID, docID, newOwner, status: "TRANSFERRED" });
      } else {
        const data = await res.json();
        setAlert({ type: "success", message: "Transfer complete!" });
        setResult(data);
      }
    } catch (e: unknown) {
      setAlert({ type: "error", message: e instanceof Error ? e.message : "Transfer failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ animation: "fadeIn 0.2s ease" }}>
      <TwoCol>
        <Card>
          <CardTitle icon="⇄">Transfer TDR Ownership</CardTitle>
          <Alert alert={alert} />
          <FormGroup label="Your Fabric ID">
            <Input placeholder="Current owner's fabricID" value={fabricID} onChange={(e) => setFabricID(e.target.value)} />
          </FormGroup>
          <FormGroup label="Document ID">
            <Input placeholder="TDR-2025-XXXX" value={docID} onChange={(e) => setDocID(e.target.value)} />
          </FormGroup>
          <FormGroup label="New Owner Fabric ID">
            <Input placeholder="New owner's fabricID" value={newOwner} onChange={(e) => setNewOwner(e.target.value)} />
          </FormGroup>
          <div
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "14px",
              marginBottom: "18px",
              fontSize: "12px",
              color: "var(--text3)",
              lineHeight: 1.7,
            }}
          >
            ⚠ Transfer triggers OCR extraction, PDF regeneration with new owner details, and EVM anchoring. This may
            take 60–90 seconds. A new TDR certificate PDF will be downloaded automatically.
          </div>
          <Button loading={loading} onClick={handleSubmit}>
            Transfer Ownership
          </Button>
        </Card>

        <Card>
          <CardTitle icon="◈">Transfer Result</CardTitle>
          {!result ? (
            <p style={{ color: "var(--text3)", fontSize: "13px", lineHeight: 1.8 }}>
              On success, the backend will: run OCR, update beneficiary name, submit blockchain transaction, anchor to
              Ethereum, generate QR code, and return a signed PDF certificate.
            </p>
          ) : (
            <JSONView data={result} />
          )}
        </Card>
      </TwoCol>
    </div>
  );
}
