"use client";

import React, { useState } from "react";
import { Card, CardTitle, FormGroup, Input, Select, Button, Alert, JSONView, TwoCol } from "@/app/components/ui";
import { useApp } from "@/app/context/AppContext";
import type { AlertState } from "@/lib/types";
import { apiPost } from "@/lib/api";

export default function RegisterPanel() {
  const { apiBase } = useApp();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("USER");
  const [org, setOrg] = useState("org1");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  const handleSubmit = async () => {
    if (!email) return setAlert({ type: "error", message: "Email is required" });
    setLoading(true);
    setAlert(null);
    try {
      const res = await apiPost(apiBase, "/register", { email, role, org });
      const data = await res.json();
      setAlert({ type: "success", message: `User registered! FabricID: ${data.fabricID}` });
      setResult(data);
    } catch (e: unknown) {
      setAlert({ type: "error", message: e instanceof Error ? e.message : "Registration failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ animation: "fadeIn 0.2s ease" }}>
      <TwoCol>
        <Card>
          <CardTitle icon="⊕">Register New User</CardTitle>
          <Alert alert={alert} />
          <FormGroup label="Email Address">
            <Input type="email" placeholder="user@smcgov.in" value={email} onChange={(e) => setEmail(e.target.value)} />
          </FormGroup>
          <FormGroup label="Role">
            <Select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="USER">USER — Standard access</option>
              <option value="ADMIN">ADMIN — Full access</option>
            </Select>
          </FormGroup>
          <FormGroup label="Organisation">
            <Select value={org} onChange={(e) => setOrg(e.target.value)}>
              <option value="org1">Org1 (Primary)</option>
              <option value="org2">Org2 (Secondary)</option>
            </Select>
          </FormGroup>
          <Button loading={loading} onClick={handleSubmit}>
            Register User
          </Button>
        </Card>

        <Card>
          <CardTitle icon="◈">Registration Result</CardTitle>
          {!result ? (
            <p style={{ color: "var(--text3)", fontSize: "13px", lineHeight: 1.8 }}>
              After registration, the Fabric CA will issue an X.509 certificate for this user, and the identity will be
              registered on-chain via{" "}
              <span style={{ fontFamily: "'DM Mono', monospace", color: "var(--gold)", fontSize: "11px" }}>
                RegisterIdentity
              </span>
              .
            </p>
          ) : (
            <JSONView data={result} />
          )}
        </Card>
      </TwoCol>
    </div>
  );
}
