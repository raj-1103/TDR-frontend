"use client";

import React from "react";
import type { AlertState } from "@/lib/types";

/* ── Card ── */
export function Card({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={className}
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: "24px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ── CardTitle ── */
export function CardTitle({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: "11px",
        fontWeight: 500,
        color: "var(--text2)",
        textTransform: "uppercase",
        letterSpacing: "1px",
        marginBottom: "20px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}
    >
      <span style={{ fontSize: "16px" }}>{icon}</span>
      {children}
    </div>
  );
}

/* ── FormGroup ── */
export function FormGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "18px" }}>
      <label
        style={{
          display: "block",
          fontSize: "11px",
          fontWeight: 500,
          color: "var(--text2)",
          textTransform: "uppercase",
          letterSpacing: "0.8px",
          marginBottom: "8px",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

/* ── Input ── */
export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{
        width: "100%",
        background: "var(--bg)",
        border: "1px solid var(--border2)",
        borderRadius: "8px",
        padding: "10px 14px",
        color: "var(--text)",
        fontFamily: "'Sora', sans-serif",
        fontSize: "13px",
        outline: "none",
        transition: "border-color 0.15s",
        ...props.style,
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = "var(--gold)";
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = "var(--border2)";
        props.onBlur?.(e);
      }}
    />
  );
}

/* ── Select ── */
export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      style={{
        width: "100%",
        background: "var(--bg)",
        border: "1px solid var(--border2)",
        borderRadius: "8px",
        padding: "10px 14px",
        color: "var(--text)",
        fontFamily: "'Sora', sans-serif",
        fontSize: "13px",
        outline: "none",
        cursor: "pointer",
        appearance: "none",
      }}
    />
  );
}

/* ── Button ── */
type BtnVariant = "primary" | "secondary" | "danger";
interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  loading?: boolean;
  size?: "sm" | "md";
}

const btnStyles: Record<BtnVariant, React.CSSProperties> = {
  primary: { background: "var(--gold)", color: "#0d0f14", border: "none" },
  secondary: { background: "transparent", color: "var(--text2)", border: "1px solid var(--border2)" },
  danger: { background: "var(--red-dim)", color: "var(--red)", border: "1px solid rgba(240,106,106,0.2)" },
};

export function Button({ variant = "primary", loading = false, size = "md", children, style, disabled, ...rest }: BtnProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        padding: size === "sm" ? "7px 14px" : "10px 20px",
        borderRadius: "8px",
        fontFamily: "'Sora', sans-serif",
        fontSize: size === "sm" ? "12px" : "13px",
        fontWeight: 500,
        cursor: disabled || loading ? "not-allowed" : "pointer",
        opacity: disabled || loading ? 0.6 : 1,
        transition: "all 0.15s",
        ...btnStyles[variant],
        ...style,
      }}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

/* ── Spinner ── */
export function Spinner({ size = 14 }: { size?: number }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: size,
        height: size,
        border: "2px solid rgba(255,255,255,0.2)",
        borderTopColor: "currentColor",
        borderRadius: "50%",
        animation: "spin 0.6s linear infinite",
      }}
    />
  );
}

/* ── Alert ── */
const alertStyles = {
  success: { bg: "var(--teal-dim)", border: "rgba(77,217,172,0.2)", color: "var(--teal)", icon: "✓" },
  error: { bg: "var(--red-dim)", border: "rgba(240,106,106,0.2)", color: "var(--red)", icon: "✗" },
  info: { bg: "var(--blue-dim)", border: "rgba(106,180,240,0.2)", color: "var(--blue)", icon: "ℹ" },
};

export function Alert({ alert }: { alert: AlertState | null }) {
  if (!alert) return null;
  const s = alertStyles[alert.type];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "10px",
        padding: "12px 16px",
        borderRadius: "8px",
        fontSize: "13px",
        marginBottom: "16px",
        background: s.bg,
        border: `1px solid ${s.border}`,
        color: s.color,
        animation: "fadeIn 0.2s ease",
      }}
    >
      <span style={{ flexShrink: 0, fontSize: "16px" }}>{s.icon}</span>
      <span>{alert.message}</span>
    </div>
  );
}

/* ── JSONView ── */
export function JSONView({ data }: { data: Record<string, unknown> }) {
  return (
    <div
      style={{
        background: "var(--bg)",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        padding: "16px",
        marginTop: "16px",
        fontFamily: "'DM Mono', monospace",
        fontSize: "12px",
        lineHeight: 1.8,
        color: "var(--text2)",
      }}
    >
      {Object.entries(data).map(([k, v]) => (
        <div key={k}>
          <span style={{ color: "var(--gold)" }}>&quot;{k}&quot;</span>
          <span style={{ color: "var(--text3)" }}>: </span>
          <span style={{ color: "var(--text)" }}>{JSON.stringify(v)}</span>
        </div>
      ))}
    </div>
  );
}

/* ── SectionHeader ── */
export function SectionHeader({
  title,
  sub,
  children,
}: {
  title: string;
  sub?: string;
  children?: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
      <div>
        <div style={{ fontSize: "15px", fontWeight: 500 }}>{title}</div>
        {sub && <div style={{ fontSize: "12px", color: "var(--text3)", marginTop: "2px" }}>{sub}</div>}
      </div>
      {children && <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>{children}</div>}
    </div>
  );
}

/* ── Badge ── */
const badgeMap: Record<string, { bg: string; color: string; border: string }> = {
  UPLOADED: { bg: "var(--blue-dim)", color: "var(--blue)", border: "rgba(106,180,240,0.2)" },
  TDR_ISSUED: { bg: "var(--gold-dim)", color: "var(--gold2)", border: "rgba(201,168,76,0.2)" },
  TRANSFERRED: { bg: "var(--teal-dim)", color: "var(--teal)", border: "rgba(77,217,172,0.2)" },
  ANCHORED: { bg: "rgba(100,180,100,0.1)", color: "#6dc06d", border: "rgba(109,192,109,0.2)" },
};

export function Badge({ status }: { status: string }) {
  const s = badgeMap[status] || badgeMap.UPLOADED;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 10px",
        borderRadius: "12px",
        fontSize: "11px",
        fontWeight: 500,
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
      }}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

/* ── TwoCol ── */
export function TwoCol({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "24px",
      }}
    >
      {children}
    </div>
  );
}

/* ── Empty state ── */
export function Empty({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text3)" }}>
      <div style={{ fontSize: "40px", marginBottom: "16px", opacity: 0.4 }}>{icon}</div>
      <div style={{ fontSize: "14px" }}>{text}</div>
    </div>
  );
}
