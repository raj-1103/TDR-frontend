"use client";

import React, { createContext, useContext, useState } from "react";
import type { Panel } from "@/lib/types";

interface AppContextType {
  panel: Panel;
  setPanel: (p: Panel) => void;
  apiBase: string;
  setApiBase: (v: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  toggleSidebar: () => void;
}

const AppContext = createContext<AppContextType>({
  panel: "dashboard",
  setPanel: () => {},
  apiBase: "http://localhost:8080",
  setApiBase: () => {},
  sidebarOpen: true,
  setSidebarOpen: () => {},
  toggleSidebar: () => {},
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [panel, setPanel] = useState<Panel>("dashboard");
  const [apiBase, setApiBase] = useState("http://localhost:8080");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const toggleSidebar = () => setSidebarOpen((v) => !v);

  return (
    <AppContext.Provider value={{ panel, setPanel, apiBase, setApiBase, sidebarOpen, setSidebarOpen, toggleSidebar }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
