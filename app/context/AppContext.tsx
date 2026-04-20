"use client";

import React, { createContext, useContext, useState } from "react";
import type { Panel } from "@/lib/types";

interface AppContextType {
  panel: Panel;
  setPanel: (p: Panel) => void;
  apiBase: string;
  setApiBase: (v: string) => void;
}

const AppContext = createContext<AppContextType>({
  panel: "dashboard",
  setPanel: () => {},
  apiBase: "http://localhost:8080",
  setApiBase: () => {},
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [panel, setPanel] = useState<Panel>("dashboard");
  const [apiBase, setApiBase] = useState("http://localhost:8080");
  return (
    <AppContext.Provider value={{ panel, setPanel, apiBase, setApiBase }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
