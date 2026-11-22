import React, { useState } from "react";
import { Play, ChevronRight, SlidersHorizontal, Loader2 } from "lucide-react";
import { useApp } from "../App";
import { useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";

interface HeroSectionProps {
  onPlay?: () => void;
  onConfigure?: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onPlay, onConfigure }) => {
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);
  const [isLaunching, setIsLaunching] = useState(false);
  const app = useApp();
  const navigate = useNavigate();

  const handlePlayClick = async () => {
    if (onPlay) {
      onPlay();
      return;
    }
    setIsLaunching(true);
    // Show console so user can see launch logs
    if (app?.openConsole) {
      app.openConsole();
    }
    try {
      // Attempt launching instance "1" or active instance via Tauri Rust command
      await invoke("launch_instance", { instanceId: "1" });
    } catch (err) {
      console.log("Launcher note (Tauri command):", err);
    } finally {
      setTimeout(() => setIsLaunching(false), 2000);
    }
  };

  const handleConfigureClick = () => {
    if (onConfigure) {
      onConfigure();
    } else {
      navigate("/instances");
    }
  };

  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    paddingLeft: 48,
    height: "100%",
    maxWidth: "55%",
    position: "relative",
    zIndex: 10,
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: 4,
    color: "#9B9BA7",
    marginBottom: 12,
  };

  const versionStyle: React.CSSProperties = {
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    fontSize: 72,
    fontWeight: 800,
    color: "#FFFFFF",
    lineHeight: 0.9,
    margin: 0,
    letterSpacing: -1,
  };

  const nameStyle: React.CSSProperties = {
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    fontSize: 96,
    fontWeight: 900,
    color: "#FFFFFF",
    lineHeight: 0.95,
    margin: 0,
    letterSpacing: -3,
    marginTop: 4,
  };

  const descriptionStyle: React.CSSProperties = {
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    fontSize: 15,
    fontWeight: 400,
    color: "#9B9BA7",
    lineHeight: 1.6,
    maxWidth: 420,
    marginTop: 20,
    marginBottom: 32,
  };

  const buttonRowStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  };

  const playButtonStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    paddingLeft: 32,
    paddingRight: 24,
    paddingTop: 14,
    paddingBottom: 14,
    borderRadius: 14,
    border: "none",
    background:
      hoveredBtn === "play"
        ? "linear-gradient(135deg, #8B82FF, #6B62EE)"
        : "#7C72FF",
    color: "#FFFFFF",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: 1.5,
    cursor: "pointer",
    transition: "all 0.2s ease",
    transform: hoveredBtn === "play" ? "translateY(-1px)" : "none",
    boxShadow:
      hoveredBtn === "play"
        ? "0 8px 24px rgba(124, 114, 255, 0.4)"
        : "0 4px 16px rgba(124, 114, 255, 0.25)",
    outline: "none",
  };

  const configureButtonStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    paddingLeft: 24,
    paddingRight: 24,
    paddingTop: 14,
    paddingBottom: 14,
    borderRadius: 14,
    border: "1px solid rgba(255, 255, 255, 0.08)",
    background:
      hoveredBtn === "configure"
        ? "rgba(255, 255, 255, 0.08)"
        : "#1E1F26",
    color: "#FFFFFF",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: 0.5,
    cursor: "pointer",
    transition: "all 0.2s ease",
    transform: hoveredBtn === "configure" ? "translateY(-1px)" : "none",
    outline: "none",
  };

  return (
    <div style={containerStyle}>
      <span style={labelStyle}>OPTIMIZED PROFILE</span>
      <h1 style={versionStyle}>1.21.11</h1>
      <h2 style={nameStyle}>VANILLA+</h2>
      <p style={descriptionStyle}>
        Everything you love. Nothing in your way. A lighter, smoother world,
        ready when you are.
      </p>
      <div style={buttonRowStyle}>
        <button
          style={playButtonStyle}
          onClick={handlePlayClick}
          onMouseEnter={() => setHoveredBtn("play")}
          onMouseLeave={() => setHoveredBtn(null)}
          disabled={isLaunching}
        >
          {isLaunching ? (
            <Loader2 size={18} className="spin" color="#FFFFFF" />
          ) : (
            <Play size={18} fill="#FFFFFF" strokeWidth={0} />
          )}
          <span>{isLaunching ? "LAUNCHING..." : "PLAY"}</span>
          <ChevronRight size={16} strokeWidth={2.5} />
        </button>
        <button
          style={configureButtonStyle}
          onClick={handleConfigureClick}
          onMouseEnter={() => setHoveredBtn("configure")}
          onMouseLeave={() => setHoveredBtn(null)}
        >
          <SlidersHorizontal size={16} strokeWidth={2} />
          <span>CONFIGURE</span>
        </button>
      </div>
    </div>
  );
};

export default HeroSection;
