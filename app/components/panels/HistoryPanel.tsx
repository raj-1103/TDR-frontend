"use client";

import React, { useState } from "react";
import { Card, Input, Button, Alert, Empty, SectionHeader } from "@/app/components/ui";
import { useApp } from "@/app/context/AppContext";
import type { AlertState, HistoryEntry } from "@/lib/types";
import { apiGet } from "@/lib/api";

const actionColor: Record<string, string> = {
  UPLOADED: "var(--blue)",
  TDR_ISSUED: "var(--gold)",
  TRANSFERRED: "var(--teal)",
  ANCHORED: "#6dc06d",
};

export default function HistoryPanel() {
  const { apiBase } = useApp();
  const [docID, setDocID] = useState("");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [history, setHistory] = useState<HistoryEntry[] | null>(null);

  const handleLoad = async () => {
    if (!docID) return setAlert({ type: "error", message: "Document ID is required" });
    setLoading(true);
    setAlert(null);
    try {
      const data = await apiGet(apiBase, "/history", { docID });
      setHistory(data.history || []);
    } catch (e: unknown) {
      setAlert({ type: "error", message: e instanceof Error ? e.message : "Failed to load history" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ animation: "fadeIn 0.2s ease" }}>
      <Card>
        <SectionHeader title="Document History" sub="Complete audit trail from Fabric ledger">
          <Input
            placeholder="Document ID"
            value={docID}
            onChange={(e) => setDocID(e.target.value)}
            style={{ width: "220px" }}
            onKeyDown={(e) => e.key === "Enter" && handleLoad()}
          />
          <Button size="sm" loading={loading} onClick={handleLoad}>
            Load
          </Button>
        </SectionHeader>

        <Alert alert={alert} />

        {history === null ? (
          <Empty icon="⊟" text="Enter a Document ID and click Load" />
        ) : history.length === 0 ? (
          <Empty icon="⊟" text="No history found for this document" />
        ) : (
          <div style={{ position: "relative", paddingLeft: "24px" }}>
            {/* Vertical line */}
            <div
              style={{
                position: "absolute",
                left: "7px",
                top: "8px",
                bottom: "8px",
                width: "1px",
                background: "var(--border2)",
              }}
            />

            {history.map((entry, i) => {
              const color = actionColor[entry.action] || "var(--text3)";
              return (
                <div key={i} style={{ position: "relative", paddingBottom: i < history.length - 1 ? "28px" : 0 }}>
                  {/* Dot */}
                  <div
                    style={{
                      position: "absolute",
                      left: "-21px",
                      top: "3px",
                      width: "14px",
                      height: "14px",
                      borderRadius: "50%",
                      background: "var(--card)",
                      border: `2px solid ${color}`,
                    }}
                  />

                  {/* Content */}
                  <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)" }}>
                    {entry.action.replace(/_/g, " ")}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text3)", marginTop: "3px" }}>
                    {entry.timestamp}
                  </div>
                  {(entry.fromOwner || entry.toOwner) && (
                    <div style={{ fontSize: "12px", color: "var(--text2)", marginTop: "4px" }}>
                      {entry.fromOwner && (
                        <span>
                          From: <strong style={{ color: "var(--text)" }}>{entry.fromOwner}</strong>
                          {entry.toOwner ? " → " : ""}
                        </span>
                      )}
                      {entry.toOwner && (
                        <span>
                          To: <strong style={{ color: "var(--text)" }}>{entry.toOwner}</strong>
                        </span>
                      )}
                    </div>
                  )}
                  {entry.actor && (
                    <div style={{ fontSize: "11px", color: "var(--text3)", marginTop: "2px" }}>
                      Actor:{" "}
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px" }}>
                        {entry.actor.substring(0, 24)}…
                      </span>
                    </div>
                  )}
                  {entry.txID && (
                    <div
                      style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: "10px",
                        color: "var(--text3)",
                        marginTop: "3px",
                      }}
                    >
                      {entry.txID}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
