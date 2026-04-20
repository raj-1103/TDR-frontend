"use client";

import React, { useState } from "react";
import { Card, CardTitle, FormGroup, Input, Button, Alert, JSONView, TwoCol } from "@/app/components/ui";
import { useApp } from "@/app/context/AppContext";
import type { AlertState } from "@/lib/types";
import { apiGet } from "@/lib/api";

export default function QueryPanel() {
  const { apiBase } = useApp();
  const [fabricID, setFabricID] = useState("");
  const [tdrID, setTdrID] = useState("");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  const handleSubmit = async () => {
    if (!fabricID || !tdrID) {
      return setAlert({ type: "error", message: "Both fields are required" });
    }
    setLoading(true);
    setAlert(null);
    try {
      const data = await apiGet(apiBase, "/get-tdr", { fabricID, tdrID });
      setResult(data);
      setAlert({ type: "success", message: "TDR record fetched from chain" });
    } catch (e: unknown) {
      setAlert({ type: "error", message: e instanceof Error ? e.message : "Query failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ animation: "fadeIn 0.2s ease" }}>
      <TwoCol>
        <Card>
          <CardTitle icon="◎">Query TDR Record</CardTitle>
          <Alert alert={alert} />
          <FormGroup label="Fabric ID">
            <Input placeholder="Your fabricID" value={fabricID} onChange={(e) => setFabricID(e.target.value)} />
          </FormGroup>
          <FormGroup label="TDR Certificate ID">
            <Input placeholder="TDR-CERT-001" value={tdrID} onChange={(e) => setTdrID(e.target.value)} />
          </FormGroup>
          <Button loading={loading} onClick={handleSubmit}>
            Fetch from Chain
          </Button>
        </Card>

        <Card>
          <CardTitle icon="◈">TDR Record</CardTitle>
          {!result ? (
            <p style={{ color: "var(--text3)", fontSize: "13px", lineHeight: 1.8 }}>
              Query reads directly from the Hyperledger Fabric ledger state using{" "}
              <span style={{ fontFamily: "'DM Mono', monospace", color: "var(--primary)", fontSize: "11px", background: "var(--primary-dim)", padding: "2px 6px", borderRadius: "4px" }}>
                EvaluateTransaction
              </span>{" "}
              — no ordering or endorsement required, instant read.
            </p>
          ) : (
            <JSONView data={result} />
          )}
        </Card>
      </TwoCol>
    </div>
  );
}
