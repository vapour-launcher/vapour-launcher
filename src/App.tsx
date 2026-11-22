import React, { useState, createContext, useContext } from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import IconRail from "./components/IconRail";
import TitleBar from "./components/TitleBar";
import TopBar from "./components/TopBar";
import BottomBar from "./components/BottomBar";
import ModManager from "./components/ModManager";
import ConsoleDrawer from "./components/ConsoleDrawer";
import HomePage from "./pages/HomePage";
import InstancesPage from "./pages/InstancesPage";
import SkinsPage from "./pages/SkinsPage";
import SettingsPage from "./pages/SettingsPage";
import ChangelogPage from "./pages/ChangelogPage";

interface AppContextType {
  openModManager: () => void;
  openConsole: () => void;
}

const AppContext = createContext<AppContextType>({
  openModManager: () => {},
  openConsole: () => {},
});

export const useApp = () => useContext(AppContext);

const App: React.FC = () => {
  const [isModManagerOpen, setIsModManagerOpen] = useState(false);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);

  const openModManager = () => setIsModManagerOpen(true);
  const openConsole = () => setIsConsoleOpen(true);

  const appContainerStyle: React.CSSProperties = {
    position: "relative",
    width: "100vw",
    height: "100vh",
    overflow: "hidden",
    backgroundColor: "#111217",
    color: "#FFFFFF",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  };

  const mainAreaStyle: React.CSSProperties = {
    position: "relative",
    width: "100%",
    height: "100%",
    overflow: "hidden",
  };

  return (
    <AppContext.Provider value={{ openModManager, openConsole }}>
      <Router>
        <div style={appContainerStyle}>
          {/* Frameless window controls */}
          <TitleBar />

          {/* Left slim icon rail */}
          <IconRail />

          {/* Main content route view */}
          <main style={mainAreaStyle}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/instances" element={<InstancesPage />} />
              <Route path="/skins" element={<SkinsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/changelog" element={<ChangelogPage />} />
            </Routes>
          </main>

          {/* Mod Manager Modal */}
          <ModManager
            isOpen={isModManagerOpen}
            onClose={() => setIsModManagerOpen(false)}
          />

          {/* Console Output Drawer */}
          <ConsoleDrawer
            isOpen={isConsoleOpen}
            onClose={() => setIsConsoleOpen(false)}
          />
        </div>
      </Router>
    </AppContext.Provider>
  );
};

export default App;
