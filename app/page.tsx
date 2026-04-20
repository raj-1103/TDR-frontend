"use client";

import React from "react";
import { AppProvider, useApp } from "@/app/context/AppContext";
import Sidebar from "@/app/components/Sidebar";
import Topbar from "@/app/components/Topbar";
import DashboardPanel from "@/app/components/panels/DashboardPanel";
import RegisterPanel from "@/app/components/panels/RegisterPanel";
import UploadPanel from "@/app/components/panels/UploadPanel";
import IssuePanel from "@/app/components/panels/IssuePanel";
import TransferPanel from "@/app/components/panels/TransferPanel";
import QueryPanel from "@/app/components/panels/QueryPanel";
import VerifyPanel from "@/app/components/panels/VerifyPanel";
import HistoryPanel from "@/app/components/panels/HistoryPanel";
import GraphPanel from "@/app/components/panels/GraphPanel";

function AppShell() {
  const { panel } = useApp();

  const panels = {
    dashboard: <DashboardPanel />,
    register: <RegisterPanel />,
    upload: <UploadPanel />,
    issue: <IssuePanel />,
    transfer: <TransferPanel />,
    query: <QueryPanel />,
    verify: <VerifyPanel />,
    history: <HistoryPanel />,
    graph: <GraphPanel />,
  };

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <div style={{ marginLeft: "240px", flex: 1, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Topbar />
        <div style={{ padding: "32px", flex: 1 }}>
          {panels[panel]}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
