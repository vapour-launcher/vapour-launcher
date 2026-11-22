import React, { useState } from "react";
import { Camera, Globe, MessageCircle } from "lucide-react";
import { useApp } from "../App";
import { useNavigate } from "react-router-dom";

interface BottomBarProps {
  onOpenMods?: () => void;
  onOpenUpdates?: () => void;
}

const BottomBar: React.FC<BottomBarProps> = ({ onOpenMods, onOpenUpdates }) => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const app = useApp();
  const navigate = useNavigate();

  const handleModsClick = () => {
    if (onOpenMods) {
      onOpenMods();
    } else if (app?.openModManager) {
      app.openModManager();
    }
  };

  const handleUpdatesClick = () => {
    if (onOpenUpdates) {
      onOpenUpdates();
    } else {
      navigate("/changelog");
    }
  };

  const handleConsoleClick = () => {
    if (app?.openConsole) {
      app.openConsole();
    }
  };

  const containerStyle: React.CSSProperties = {
    position: "fixed",
    bottom: 0,
    left: 64,
    right: 0,
    zIndex: 40,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 12,
    paddingBottom: 12,
    background:
      "linear-gradient(to top, rgba(13, 14, 19, 0.8) 0%, transparent 100%)",
    pointerEvents: "none",
  };

  const leftGroupStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    pointerEvents: "auto",
  };

  const getPillStyle = (id: string): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: 6,
    paddingLeft: 14,
    paddingRight: 14,
    paddingTop: 7,
    paddingBottom: 7,
    borderRadius: 9999,
    background:
      hoveredItem === id
        ? "rgba(255, 255, 255, 0.1)"
        : "rgba(255, 255, 255, 0.05)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    color: "#FFFFFF",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s ease",
    userSelect: "none" as const,
  });

  const centerStyle: React.CSSProperties = {
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    fontSize: 11,
    fontWeight: 500,
    color: "#6C6C7A",
    letterSpacing: 2,
    textTransform: "uppercase" as const,
    userSelect: "none" as const,
    pointerEvents: "auto",
    cursor: "pointer",
  };

  const rightGroupStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    pointerEvents: "auto",
  };

  const getIconButtonStyle = (id: string): React.CSSProperties => ({
    width: 34,
    height: 34,
    borderRadius: 8,
    border: "none",
    background:
      hoveredItem === id
        ? "rgba(255, 255, 255, 0.1)"
        : "transparent",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.2s ease",
    color:
      hoveredItem === id ? "#FFFFFF" : "#6C6C7A",
    padding: 0,
    outline: "none",
  });

  const pillCountStyle: React.CSSProperties = {
    color: "#7C72FF",
    fontWeight: 600,
  };

  return (
    <div style={containerStyle}>
      {/* Left — Mod and Update pills */}
      <div style={leftGroupStyle}>
        <div
          style={getPillStyle("mods")}
          onClick={handleModsClick}
          onMouseEnter={() => setHoveredItem("mods")}
          onMouseLeave={() => setHoveredItem(null)}
          title="Open Mod Manager"
        >
          <span>Mods</span>
          <span style={pillCountStyle}>(32)</span>
        </div>
        <div
          style={getPillStyle("updates")}
          onClick={handleUpdatesClick}
          onMouseEnter={() => setHoveredItem("updates")}
          onMouseLeave={() => setHoveredItem(null)}
          title="View Changelog & Updates"
        >
          <span>Updates</span>
        </div>
      </div>

      {/* Center — Version & Console Toggle */}
      <span
        style={centerStyle}
        onClick={handleConsoleClick}
        title="Click to toggle debug console"
      >
        VAPOUR &nbsp;|&nbsp; 0.8.4
      </span>

      {/* Right — Action icons */}
      <div style={rightGroupStyle}>
        <button
          style={getIconButtonStyle("camera")}
          onClick={handleConsoleClick}
          onMouseEnter={() => setHoveredItem("camera")}
          onMouseLeave={() => setHoveredItem(null)}
          aria-label="Toggle Console"
          title="Game Logs Console"
        >
          <Camera size={16} strokeWidth={1.8} />
        </button>
        <button
          style={getIconButtonStyle("globe")}
          onClick={() => window.open("https://github.com", "_blank")}
          onMouseEnter={() => setHoveredItem("globe")}
          onMouseLeave={() => setHoveredItem(null)}
          aria-label="Website"
          title="Vapour Launcher Website"
        >
          <Globe size={16} strokeWidth={1.8} />
        </button>
        <button
          style={getIconButtonStyle("chat")}
          onClick={() => window.open("https://discord.gg", "_blank")}
          onMouseEnter={() => setHoveredItem("chat")}
          onMouseLeave={() => setHoveredItem(null)}
          aria-label="Chat"
          title="Community Discord"
        >
          <MessageCircle size={16} strokeWidth={1.8} />
        </button>
      </div>
    </div>
  );
};

export default BottomBar;
