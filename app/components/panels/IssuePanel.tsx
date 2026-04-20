"use client";

import React, { useState } from "react";
import { Card, CardTitle, FormGroup, Input, Button, Alert, JSONView, TwoCol } from "@/app/components/ui";
import { useApp } from "@/app/context/AppContext";
import type { AlertState } from "@/lib/types";
import { apiPost } from "@/lib/api";

export default function IssuePanel() {
  const { apiBase } = useApp();
  const [adminID, setAdminID] = useState("");
  const [docID, setDocID] = useState("");
  const [tdrID, setTdrID] = useState("");
  const [owner, setOwner] = useState("");
  const [area, setArea] = useState("");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  const handleSubmit = async () => {
    if (!adminID || !docID || !tdrID || !owner) {
      return setAlert({ type: "error", message: "All fields are required" });
    }
    setLoading(true);
    setAlert(null);
    try {
      const res = await apiPost(apiBase, "/issue-tdr", {
        adminID, docID, tdrID, owner, area: parseInt(area) || 0,
      });
      const data = await res.json();
      setAlert({ type: "success", message: `TDR issued! TxID: ${data.txID}` });
      setResult(data);
    } catch (e: unknown) {
      setAlert({ type: "error", message: e instanceof Error ? e.message : "Issue failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ animation: "fadeIn 0.2s ease" }}>
      <TwoCol>
        <Card>
          <CardTitle icon="⬡">Issue TDR Certificate</CardTitle>
          <Alert alert={alert} />
          <FormGroup label="Admin Fabric ID">
            <Input placeholder="Admin's fabricID" value={adminID} onChange={(e) => setAdminID(e.target.value)} />
          </FormGroup>
          <FormGroup label="Document ID">
            <Input placeholder="TDR-2025-XXXX" value={docID} onChange={(e) => setDocID(e.target.value)} />
          </FormGroup>
          <FormGroup label="TDR Certificate ID">
            <Input placeholder="TDR-CERT-001" value={tdrID} onChange={(e) => setTdrID(e.target.value)} />
          </FormGroup>
          <FormGroup label="Owner Fabric ID">
            <Input placeholder="Owner's fabricID" value={owner} onChange={(e) => setOwner(e.target.value)} />
          </FormGroup>
          <FormGroup label="Area (sq. meters)">
            <Input type="number" placeholder="250" value={area} onChange={(e) => setArea(e.target.value)} />
          </FormGroup>
          <Button loading={loading} onClick={handleSubmit}>
            Issue TDR on Chain
          </Button>
        </Card>

        <Card>
          <CardTitle icon="◈">Issuance Result</CardTitle>
          {!result ? (
            <p style={{ color: "var(--text3)", fontSize: "13px", lineHeight: 1.8 }}>
              Requires{" "}
              <span style={{ color: "var(--red)", fontSize: "11px", fontFamily: "'DM Mono', monospace" }}>ADMIN</span>{" "}
              role. The TDR will be linked to the owner&apos;s full X.509 clientID via the identity mapping, then the
              document status will be updated to{" "}
              <span style={{ fontFamily: "'DM Mono', monospace", color: "var(--gold)", fontSize: "11px" }}>TDR_ISSUED</span>.
            </p>
          ) : (
            <JSONView data={result} />
          )}
        </Card>
      </TwoCol>
    </div>
  );
}
