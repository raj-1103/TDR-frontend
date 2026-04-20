"use client";

import React from "react";
import { useApp } from "@/app/context/AppContext";
import type { Panel } from "@/lib/types";

const pageInfo: Record<Panel, [string, string]> = {
  dashboard: ["Dashboard", "Overview of TDR chain activity"],
  register: ["Register User", "Enroll a new identity with Fabric CA"],
  upload: ["Upload Document", "Hash and anchor a TDR document to chain"],
  issue: ["Issue TDR", "Admin: Issue a TDR certificate on-chain"],
  transfer: ["Transfer TDR", "Transfer ownership with OCR & PDF generation"],
  query: ["Query TDR", "Read TDR record directly from ledger state"],
  verify: ["Verify Document", "Check document authenticity against chain hash"],
  history: ["History", "Full audit trail for any document"],
  graph: ["Ownership Graph", "Visual chain of custody"],
};

export default function Topbar() {
  const { panel, apiBase, setApiBase } = useApp();
  const [title, sub] = pageInfo[panel];

  return (
    <div>
      {/* Config bar */}
      <div
        style={{
          background: "var(--card)",
          borderBottom: "1px solid var(--gold)",
          padding: "12px 32px",
          display: "flex",
          alignItems: "center",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <label style={{ fontSize: "12px", color: "var(--gold)", fontWeight: 500, whiteSpace: "nowrap" }}>
          API Base URL
        </label>
        <input
          value={apiBase}
          onChange={(e) => setApiBase(e.target.value)}
          style={{
            flex: 1,
            minWidth: "200px",
            background: "var(--bg)",
            border: "1px solid var(--border2)",
            borderRadius: "8px",
            padding: "7px 12px",
            color: "var(--text)",
            fontFamily: "'DM Mono', monospace",
            fontSize: "12px",
            outline: "none",
          }}
        />
        <span style={{ fontSize: "11px", color: "var(--text3)" }}>All requests route through this endpoint</span>
      </div>

      {/* Title bar */}
      <div
        style={{
          padding: "20px 32px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "var(--bg)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div>
          <div style={{ fontSize: "18px", fontWeight: 500 }}>{title}</div>
          <div style={{ fontSize: "12px", color: "var(--text3)", marginTop: "2px" }}>{sub}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "var(--teal-dim)",
              border: "1px solid rgba(77,217,172,0.2)",
              padding: "6px 12px",
              borderRadius: "20px",
              fontSize: "11px",
              color: "var(--teal)",
              fontWeight: 500,
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "var(--teal)",
                animation: "pulse 2s infinite",
              }}
            />
            Hyperledger Fabric · mychannel
          </div>
        </div>
      </div>
    </div>
  );
}
