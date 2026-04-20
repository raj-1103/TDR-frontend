"use client";

import React, { useState } from "react";
import { Card, Input, Button, Alert, Empty, SectionHeader } from "@/app/components/ui";
import { useApp } from "@/app/context/AppContext";
import type { AlertState, GraphData } from "@/lib/types";
import { apiGet } from "@/lib/api";

export default function GraphPanel() {
  const { apiBase } = useApp();
  const [docID, setDocID] = useState("");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [graph, setGraph] = useState<GraphData | null>(null);

  const handleLoad = async () => {
    if (!docID) return setAlert({ type: "error", message: "Document ID is required" });
    setLoading(true);
    setAlert(null);
    try {
      const data: GraphData = await apiGet(apiBase, "/mutation-graph", { docID });
      setGraph(data);
    } catch (e: unknown) {
      setAlert({ type: "error", message: e instanceof Error ? e.message : "Failed to load graph" });
    } finally {
      setLoading(false);
    }
  };

  const chainNodes = graph?.chain ? graph.chain.split(" → ") : [];

  // Build edge timestamp map
  const edgeMap: Record<string, string> = {};
  graph?.edges?.forEach((e) => {
    edgeMap[`${e.source}→${e.target}`] = e.label;
  });

  return (
    <div style={{ animation: "fadeIn 0.2s ease" }}>
      <Card>
        <SectionHeader title="Ownership Mutation Graph" sub="Visual chain of custody for TDR certificates">
          <Input
            placeholder="Document ID"
            value={docID}
            onChange={(e) => setDocID(e.target.value)}
            style={{ width: "220px" }}
            onKeyDown={(e) => e.key === "Enter" && handleLoad()}
          />
          <Button size="sm" loading={loading} onClick={handleLoad}>
            Load Graph
          </Button>
        </SectionHeader>

        <Alert alert={alert} />

        {/* Graph display */}
        <div
          style={{
            background: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            padding: "32px 24px",
            minHeight: "180px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflowX: "auto",
          }}
        >
          {graph === null ? (
            <Empty icon="⟳" text="Enter a Document ID to visualize the ownership chain" />
          ) : chainNodes.length === 0 ? (
            <Empty icon="⟳" text="No ownership data found for this document" />
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 0, flexWrap: "nowrap" }}>
              {chainNodes.map((label, i) => {
                const isFirst = i === 0;
                const isLast = i === chainNodes.length - 1;
                const ts = i > 0 ? edgeMap[`${chainNodes[i - 1]}→${label}`] || "" : "";

                let borderColor = "var(--border2)";
                let textColor = "var(--text)";
                let roleLabel = "Previous Owner";
                let bgColor = "var(--bg3)";
                if (isFirst) { borderColor = "var(--primary-light)"; textColor = "var(--primary)"; roleLabel = "Original Owner"; bgColor = "var(--primary-dim)"; }
                if (isLast && chainNodes.length > 1) { borderColor = "var(--teal)"; textColor = "var(--teal)"; roleLabel = "Current Owner"; bgColor = "var(--teal-dim)"; }
                if (chainNodes.length === 1) { borderColor = "var(--primary-light)"; textColor = "var(--primary)"; roleLabel = "Current Owner"; bgColor = "var(--primary-dim)"; }

                const shortLabel = label.length > 22 ? label.substring(0, 20) + "…" : label;

                return (
                  <React.Fragment key={i}>
                    {i > 0 && (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          padding: "0 12px",
                        }}
                      >
                        <div style={{ fontSize: "22px", color: "var(--text3)", lineHeight: 1 }}>→</div>
                        {ts && (
                          <div
                            style={{
                              fontSize: "9px",
                              color: "var(--text3)",
                              textAlign: "center",
                              marginTop: "4px",
                              maxWidth: "80px",
                              lineHeight: 1.3,
                            }}
                          >
                            {ts}
                          </div>
                        )}
                      </div>
                    )}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div
                        style={{
                          background: bgColor,
                          border: `1px solid ${borderColor}`,
                          borderRadius: "8px",
                          padding: "10px 18px",
                          fontSize: "12px",
                          fontWeight: 600,
                          color: textColor,
                          whiteSpace: "nowrap",
                        }}
                        title={label}
                      >
                        {shortLabel}
                      </div>
                      <div style={{ fontSize: "10px", color: "var(--text3)", marginTop: "6px", fontWeight: 500 }}>{roleLabel}</div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>

        {/* Chain label */}
        {graph && graph.chain && (
          <div
            style={{
              textAlign: "center",
              fontSize: "12px",
              color: "var(--text3)",
              marginTop: "16px",
              fontFamily: "'DM Mono', monospace",
            }}
          >
            {graph.chain}
          </div>
        )}

        {/* Edge table */}
        {graph && graph.edges && graph.edges.length > 0 && (
          <div style={{ marginTop: "24px" }}>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--text2)",
                textTransform: "uppercase",
                letterSpacing: "1px",
                marginBottom: "12px",
              }}
            >
              Transfer Events
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["From", "To", "Action", "Timestamp", "TxID"].map((h) => (
                      <th
                        key={h}
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "1px",
                          color: "var(--text3)",
                          textAlign: "left",
                          padding: "10px 12px",
                          borderBottom: "2px solid var(--border)",
                          background: "var(--bg3)",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {graph.edges.map((edge, i) => (
                    <tr key={i}>
                      {[
                        edge.source,
                        edge.target,
                        edge.action,
                        edge.label,
                        edge.txID,
                      ].map((val, j) => (
                        <td
                          key={j}
                          style={{
                            padding: "12px",
                            borderBottom: "1px solid var(--border)",
                            fontSize: "12px",
                            color: "var(--text2)",
                            fontFamily: j === 4 ? "'DM Mono', monospace" : "inherit",
                            maxWidth: j === 4 ? "160px" : undefined,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={val}
                        >
                          {val}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
