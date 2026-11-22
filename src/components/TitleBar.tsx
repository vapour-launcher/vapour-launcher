import React, { useState, useCallback } from "react";
import { Minus, Square, X } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";

const TitleBar: React.FC = () => {
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

  const handleMinimize = useCallback(() => {
    getCurrentWindow().minimize();
  }, []);

  const handleMaximize = useCallback(() => {
    getCurrentWindow().toggleMaximize();
  }, []);

  const handleClose = useCallback(() => {
    getCurrentWindow().close();
  }, []);

  const containerStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    right: 0,
    zIndex: 50,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
  };

  const baseButtonStyle: React.CSSProperties = {
    width: 28,
    height: 28,
    borderRadius: "50%",
    border: "none",
    background: "transparent",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "background 0.2s ease, transform 0.15s ease",
    color: "#6C6C7A",
    padding: 0,
    outline: "none",
  };

  const getButtonStyle = (id: string): React.CSSProperties => {
    const isHovered = hoveredBtn === id;
    if (id === "close" && isHovered) {
      return {
        ...baseButtonStyle,
        background: "rgba(239, 68, 68, 0.3)",
        color: "#EF4444",
        transform: "scale(1.1)",
      };
    }
    if (isHovered) {
      return {
        ...baseButtonStyle,
        background: "rgba(255, 255, 255, 0.08)",
        color: "#FFFFFF",
        transform: "scale(1.1)",
      };
    }
    return baseButtonStyle;
  };

  return (
    <div style={containerStyle} data-tauri-drag-region>
      <button
        style={getButtonStyle("minimize")}
        onClick={handleMinimize}
        onMouseEnter={() => setHoveredBtn("minimize")}
        onMouseLeave={() => setHoveredBtn(null)}
        aria-label="Minimize"
      >
        <Minus size={14} strokeWidth={2} />
      </button>
      <button
        style={getButtonStyle("maximize")}
        onClick={handleMaximize}
        onMouseEnter={() => setHoveredBtn("maximize")}
        onMouseLeave={() => setHoveredBtn(null)}
        aria-label="Maximize"
      >
        <Square size={12} strokeWidth={2} />
      </button>
      <button
        style={getButtonStyle("close")}
        onClick={handleClose}
        onMouseEnter={() => setHoveredBtn("close")}
        onMouseLeave={() => setHoveredBtn(null)}
        aria-label="Close"
      >
        <X size={14} strokeWidth={2} />
      </button>
    </div>
  );
};

export default TitleBar;
