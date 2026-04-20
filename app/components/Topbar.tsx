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
  const { panel, apiBase, setApiBase, toggleSidebar, sidebarOpen } = useApp();
  const [title, sub] = pageInfo[panel];

  return (
    <div>
      {/* Config bar */}
      <div
        style={{
          background: "var(--card)",
          borderBottom: "1px solid var(--border)",
          padding: "10px 24px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <label style={{ fontSize: "12px", color: "var(--primary)", fontWeight: 600, whiteSpace: "nowrap" }}>
          API Base URL
        </label>
        <input
          value={apiBase}
          onChange={(e) => setApiBase(e.target.value)}
          style={{
            flex: 1,
            minWidth: "160px",
            background: "var(--bg3)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "7px 12px",
            color: "var(--text)",
            fontFamily: "'DM Mono', monospace",
            fontSize: "12px",
            outline: "none",
            transition: "border-color 0.15s",
          }}
        />
        <span className="topbar-hint" style={{ fontSize: "11px", color: "var(--text3)" }}>All requests route through this endpoint</span>
      </div>

      {/* Title bar */}
      <div
        style={{
          padding: "16px 24px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "var(--card)",
          position: "sticky",
          top: 0,
          zIndex: 50,
          boxShadow: "var(--shadow-sm)",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Hamburger menu button */}
          <button
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
            style={{
              background: sidebarOpen ? "var(--primary-dim)" : "transparent",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "0",
              cursor: "pointer",
              width: "38px",
              height: "38px",
              position: "relative",
              flexShrink: 0,
              transition: "background 0.15s ease",
            }}
          >
            <span style={{ position: "absolute", left: "10px", top: "12px", width: "18px", height: "2px", background: "var(--text2)", borderRadius: "1px" }} />
            <span style={{ position: "absolute", left: "10px", top: "18px", width: "18px", height: "2px", background: "var(--text2)", borderRadius: "1px" }} />
            <span style={{ position: "absolute", left: "10px", top: "24px", width: "18px", height: "2px", background: "var(--text2)", borderRadius: "1px" }} />
          </button>

          <div>
            <div style={{ fontSize: "18px", fontWeight: 600, color: "var(--text)" }}>{title}</div>
            <div className="topbar-subtitle" style={{ fontSize: "12px", color: "var(--text3)", marginTop: "2px" }}>{sub}</div>
          </div>
        </div>
        <div className="topbar-status" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "var(--teal-dim)",
              border: "1px solid rgba(5,150,105,0.15)",
              padding: "6px 14px",
              borderRadius: "20px",
              fontSize: "11px",
              color: "var(--teal)",
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "var(--teal)",
                animation: "pulse 2s infinite",
                flexShrink: 0,
              }}
            />
            <span className="fabric-label-full">Hyperledger Fabric · mychannel</span>
            <span className="fabric-label-short">Fabric</span>
          </div>
        </div>
      </div>
    </div>
  );
}
