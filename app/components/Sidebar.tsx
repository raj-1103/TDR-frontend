"use client";

import React, { useEffect, useState } from "react";
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

const EXPANDED_WIDTH = 260;
const COLLAPSED_WIDTH = 68;
const MOBILE_BREAKPOINT = 768;

export default function Sidebar() {
  const { panel, setPanel, sidebarOpen, setSidebarOpen } = useApp();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [setSidebarOpen]);

  const width = sidebarOpen ? EXPANDED_WIDTH : COLLAPSED_WIDTH;

  const handleNav = (id: Panel) => {
    setPanel(id);
    if (isMobile) setSidebarOpen(false);
  };

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            zIndex: 99,
            backdropFilter: "blur(2px)",
            transition: "opacity 0.2s ease",
          }}
        />
      )}

      <nav
        style={{
          width: isMobile ? (sidebarOpen ? EXPANDED_WIDTH : 0) : width,
          minWidth: isMobile ? (sidebarOpen ? EXPANDED_WIDTH : 0) : width,
          minHeight: "100vh",
          background: "var(--sidebar-bg)",
          borderRight: "1px solid var(--sidebar-border)",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 100,
          transition: "width 0.25s cubic-bezier(0.4,0,0.2,1), min-width 0.25s cubic-bezier(0.4,0,0.2,1)",
          overflow: "hidden",
          transform: isMobile && !sidebarOpen ? "translateX(-100%)" : "translateX(0)",
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: sidebarOpen ? "28px 24px 22px" : "28px 0 22px",
            borderBottom: "1px solid var(--sidebar-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: sidebarOpen ? "flex-start" : "center",
            minHeight: "80px",
            overflow: "hidden",
            whiteSpace: "nowrap",
          }}
        >
          {sidebarOpen ? (
            <div>
              <div
                style={{
                  fontFamily: "'DM Serif Display', serif",
                  fontSize: "20px",
                  color: "#ffffff",
                  letterSpacing: "-0.3px",
                  lineHeight: 1.2,
                }}
              >
                Surat Municipal Corp.
              </div>
              <div
                style={{
                  fontSize: "10px",
                  color: "var(--sidebar-text-dim)",
                  textTransform: "uppercase",
                  letterSpacing: "2px",
                  marginTop: "6px",
                  fontWeight: 500,
                }}
              >
                TDR Blockchain Platform
              </div>
            </div>
          ) : (
            <div
              style={{
                width: "36px",
                height: "36px",
                background: "rgba(59,130,246,0.15)",
                border: "1px solid rgba(59,130,246,0.3)",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                fontWeight: 700,
                color: "#93c5fd",
                fontFamily: "'DM Serif Display', serif",
              }}
            >
              SM
            </div>
          )}
        </div>

        {/* Nav */}
        <div style={{ padding: sidebarOpen ? "16px 12px" : "16px 8px", flex: 1, overflowY: "auto" }}>
          {navItems.map((item) => (
            <React.Fragment key={item.id}>
              {item.section && sidebarOpen && (
                <div
                  style={{
                    fontSize: "10px",
                    textTransform: "uppercase",
                    letterSpacing: "1.8px",
                    color: "var(--sidebar-text-dim)",
                    padding: "0 12px",
                    margin: "20px 0 8px",
                    fontWeight: 600,
                  }}
                >
                  {item.section}
                </div>
              )}
              {item.section && !sidebarOpen && (
                <div
                  style={{
                    height: "1px",
                    background: "var(--sidebar-border)",
                    margin: "12px 8px",
                  }}
                />
              )}
              <button
                onClick={() => handleNav(item.id)}
                title={!sidebarOpen ? item.label : undefined}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: sidebarOpen ? "10px 12px" : "10px 0",
                  borderRadius: "8px",
                  cursor: "pointer",
                  color: panel === item.id ? "var(--sidebar-active-text)" : "var(--sidebar-text)",
                  fontSize: "13px",
                  fontWeight: panel === item.id ? 500 : 400,
                  fontFamily: "'Inter', sans-serif",
                  border: panel === item.id ? "1px solid var(--sidebar-active-border)" : "1px solid transparent",
                  background: panel === item.id ? "var(--sidebar-active-bg)" : "transparent",
                  width: "100%",
                  textAlign: "left",
                  transition: "all 0.15s ease",
                  justifyContent: sidebarOpen ? "flex-start" : "center",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                }}
              >
                <span
                  style={{
                    fontSize: "15px",
                    width: "20px",
                    flexShrink: 0,
                    textAlign: "center",
                  }}
                >
                  {item.icon}
                </span>
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: sidebarOpen ? "18px 24px" : "18px 0", borderTop: "1px solid var(--sidebar-border)" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              justifyContent: sidebarOpen ? "flex-start" : "center",
            }}
          >
            <div
              style={{
                width: "34px",
                height: "34px",
                background: "rgba(59,130,246,0.15)",
                border: "1px solid rgba(59,130,246,0.3)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                color: "#93c5fd",
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              AD
            </div>
            {sidebarOpen && (
              <div>
                <div style={{ fontSize: "13px", fontWeight: 500, color: "#ffffff" }}>Admin</div>
                <div
                  style={{
                    fontSize: "10px",
                    color: "var(--sidebar-text-dim)",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    fontWeight: 500,
                  }}
                >
                  ADMIN Role
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}

export { EXPANDED_WIDTH, COLLAPSED_WIDTH, MOBILE_BREAKPOINT };
