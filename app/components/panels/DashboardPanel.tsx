"use client";

import React from "react";
import { Card, CardTitle } from "@/app/components/ui";
import { useApp } from "@/app/context/AppContext";

export default function DashboardPanel() {
  const { setPanel } = useApp();

  const stats = [
    { label: "Total Documents", value: "—", sub: "Uploaded to chain" },
    { label: "TDRs Issued", value: "—", sub: "Active certificates" },
    { label: "Transfers", value: "—", sub: "Ownership changes" },
    { label: "EVM Anchored", value: "—", sub: "Cross-chain verified" },
  ];

  return (
    <div style={{ animation: "fadeIn 0.2s ease" }}>
      {/* Stats row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "16px",
          marginBottom: "28px",
        }}
      >
        {stats.map((s) => (
          <div
            key={s.label}
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: "20px",
            }}
          >
            <div style={{ fontSize: "11px", color: "var(--text3)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "10px" }}>
              {s.label}
            </div>
            <div style={{ fontSize: "28px", fontFamily: "'DM Serif Display', serif", color: "var(--gold2)", lineHeight: 1 }}>
              {s.value}
            </div>
            <div style={{ fontSize: "11px", color: "var(--text3)", marginTop: "6px" }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Cards row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        <Card>
          <CardTitle icon="⊟">Quick Actions</CardTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[
              { icon: "↑", label: "Upload New Document", panel: "upload" as const },
              { icon: "⬡", label: "Issue TDR", panel: "issue" as const },
              { icon: "⇄", label: "Transfer TDR", panel: "transfer" as const },
              { icon: "✓", label: "Verify Document", panel: "verify" as const },
            ].map((a) => (
              <button
                key={a.panel}
                onClick={() => setPanel(a.panel)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "11px 16px",
                  background: "var(--bg)",
                  border: "1px solid var(--border2)",
                  borderRadius: "8px",
                  color: "var(--text2)",
                  fontSize: "13px",
                  fontFamily: "'Sora', sans-serif",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--card2)";
                  e.currentTarget.style.color = "var(--text)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--bg)";
                  e.currentTarget.style.color = "var(--text2)";
                }}
              >
                <span style={{ fontSize: "16px" }}>{a.icon}</span>
                {a.label}
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <CardTitle icon="◈">About TDR Chain</CardTitle>
          <div style={{ fontSize: "13px", color: "var(--text2)", lineHeight: 1.8 }}>
            <p>
              This platform manages{" "}
              <strong style={{ color: "var(--text)" }}>Transfer of Development Rights</strong> certificates on a
              permissioned Hyperledger Fabric blockchain.
            </p>
            <br />
            <p>
              Each document is hashed with{" "}
              <span style={{ color: "var(--gold)", fontFamily: "'DM Mono', monospace", fontSize: "11px" }}>
                Keccak-256
              </span>{" "}
              and anchored to Ethereum for cross-chain verifiability.
            </p>
            <br />
            <p>All actions are immutably logged as audit entries on-chain via the Fabric CA.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
