"use client";

import React from "react";
import { useApp } from "@/app/context/AppContext";
import type { Panel } from "@/lib/types";

const navItems: { id: Panel; icon: string; label: string; section?: string }[] = [
  { id: "dashboard", icon: "◈", label: "Dashboard", section: "Core" },
  { id: "register", icon: "⊕", label: "Register User" },
  { id: "upload", icon: "↑", label: "Upload Document" },
  { id: "issue", icon: "⬡", label: "Issue TDR", section: "TDR Operations" },
  { id: "transfer", icon: "⇄", label: "Transfer TDR" },
  { id: "query", icon: "◎", label: "Query TDR" },
  { id: "verify", icon: "✓", label: "Verify Document", section: "Audit & Verify" },
  { id: "history", icon: "⊟", label: "History" },
  { id: "graph", icon: "⟳", label: "Ownership Graph" },
];

export default function Sidebar() {
  const { panel, setPanel } = useApp();

  return (
    <nav
      style={{
        width: "240px",
        minHeight: "100vh",
        background: "var(--bg2)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 100,
      }}
    >
      {/* Logo */}
      <div style={{ padding: "28px 24px 20px", borderBottom: "1px solid var(--border)" }}>
        <div
          style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: "22px",
            color: "var(--gold2)",
            letterSpacing: "-0.3px",
            lineHeight: 1,
          }}
        >
          
          Surat Municipal Corp.
        </div>
        <div
          style={{
            fontSize: "10px",
            color: "var(--text3)",
            textTransform: "uppercase",
            letterSpacing: "1.5px",
            marginTop: "5px",
          }}
        >
          TDR Chain
        </div>
      </div>

      {/* Nav */}
      <div style={{ padding: "16px 12px", flex: 1, overflowY: "auto" }}>
        {navItems.map((item) => (
          <React.Fragment key={item.id}>
            {item.section && (
              <div
                style={{
                  fontSize: "10px",
                  textTransform: "uppercase",
                  letterSpacing: "1.5px",
                  color: "var(--text3)",
                  padding: "0 12px",
                  margin: "16px 0 8px",
                }}
              >
                {item.section}
              </div>
            )}
            <button
              onClick={() => setPanel(item.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 12px",
                borderRadius: "8px",
                cursor: "pointer",
                color: panel === item.id ? "var(--gold2)" : "var(--text2)",
                fontSize: "13px",
                fontWeight: 400,
                fontFamily: "'Sora', sans-serif",
                border: panel === item.id ? "1px solid rgba(201,168,76,0.2)" : "1px solid transparent",
                background: panel === item.id ? "var(--gold-dim)" : "transparent",
                width: "100%",
                textAlign: "left",
                transition: "all 0.15s",
              }}
            >
              <span style={{ fontSize: "16px", width: "20px", flexShrink: 0 }}>{item.icon}</span>
              {item.label}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              background: "var(--gold-dim)",
              border: "1px solid rgba(201,168,76,0.3)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              color: "var(--gold)",
              fontWeight: 500,
            }}
          >
            AD
          </div>
          <div>
            <div style={{ fontSize: "12px", fontWeight: 500, color: "var(--text)" }}>Admin</div>
            <div style={{ fontSize: "10px", color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.8px" }}>
              ADMIN Role
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
