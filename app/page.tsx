"use client";

import React from "react";
import { AppProvider, useApp } from "@/app/context/AppContext";
import Sidebar, { EXPANDED_WIDTH, COLLAPSED_WIDTH, MOBILE_BREAKPOINT } from "@/app/components/Sidebar";
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
  const { panel, sidebarOpen } = useApp();
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

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

  const marginLeft = isMobile ? 0 : sidebarOpen ? EXPANDED_WIDTH : COLLAPSED_WIDTH;

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <div
        style={{
          marginLeft: `${marginLeft}px`,
          flex: 1,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          background: "var(--bg)",
          transition: "margin-left 0.25s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <Topbar />
        <div
          style={{
            padding: isMobile ? "20px 16px" : "32px",
            flex: 1,
          }}
        >
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
