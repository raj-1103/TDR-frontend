"use client";

import React, { useState, useRef } from "react";
import { Card, CardTitle, FormGroup, Input, Button, Alert, JSONView, TwoCol } from "@/app/components/ui";
import { useApp } from "@/app/context/AppContext";
import type { AlertState } from "@/lib/types";
import { apiUpload } from "@/lib/api";

export default function UploadPanel() {
  const { apiBase } = useApp();
  const [fabricID, setFabricID] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => setFile(f);

  const handleSubmit = async () => {
    if (!fabricID) return setAlert({ type: "error", message: "Fabric ID is required" });
    if (!file) return setAlert({ type: "error", message: "Please select a document" });
    setLoading(true);
    setAlert(null);
    try {
      const form = new FormData();
      form.append("fabricID", fabricID);
      form.append("file", file);
      const data = await apiUpload(apiBase, "/upload", form);
      setAlert({ type: "success", message: `Document uploaded! DocID: ${data.docID}` });
      setResult(data);
    } catch (e: unknown) {
      setAlert({ type: "error", message: e instanceof Error ? e.message : "Upload failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ animation: "fadeIn 0.2s ease" }}>
      <TwoCol>
        <Card>
          <CardTitle icon="↑">Upload TDR Document</CardTitle>
          <Alert alert={alert} />
          <FormGroup label="Fabric ID">
            <Input
              placeholder="user_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              value={fabricID}
              onChange={(e) => setFabricID(e.target.value)}
            />
          </FormGroup>
          <FormGroup label="Document File">
            <div
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDrag(false);
                const f = e.dataTransfer.files[0];
                if (f) handleFile(f);
              }}
              style={{
                border: `2px dashed ${drag ? "var(--primary-light)" : "var(--border2)"}`,
                borderRadius: "12px",
                padding: "40px",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.2s",
                background: drag ? "var(--primary-dim)" : "var(--bg)",
              }}
            >
              <div style={{ fontSize: "36px", marginBottom: "12px" }}>📄</div>
              <div style={{ fontSize: "14px", color: "var(--text2)", fontWeight: 500 }}>Click or drag &amp; drop PDF</div>
              <div style={{ fontSize: "12px", color: "var(--text3)", marginTop: "6px" }}>TDR original documents only</div>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              style={{ display: "none" }}
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            {file && (
              <div
                style={{
                  marginTop: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "var(--bg3)",
                  padding: "8px 14px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "var(--text)",
                  border: "1px solid var(--border)",
                }}
              >
                <span>📎</span>
                <span>{file.name}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--text3)", cursor: "pointer", fontSize: "16px" }}
                >
                  ×
                </button>
              </div>
            )}
          </FormGroup>
          <Button loading={loading} onClick={handleSubmit}>
            Upload to Blockchain
          </Button>
        </Card>

        <Card>
          <CardTitle icon="◈">Upload Result</CardTitle>
          {!result ? (
            <p style={{ color: "var(--text3)", fontSize: "13px", lineHeight: 1.8 }}>
              The document will be hashed with{" "}
              <span style={{ fontFamily: "'DM Mono', monospace", color: "var(--primary)", fontSize: "11px", background: "var(--primary-dim)", padding: "2px 6px", borderRadius: "4px" }}>Keccak-256</span>{" "}
              and stored on Hyperledger Fabric. A{" "}
              <span style={{ fontFamily: "'DM Mono', monospace", color: "var(--primary)", fontSize: "11px", background: "var(--primary-dim)", padding: "2px 6px", borderRadius: "4px" }}>DocumentStored</span>{" "}
              event will be emitted on-chain.
            </p>
          ) : (
            <JSONView data={result} />
          )}
        </Card>
      </TwoCol>
    </div>
  );
}
