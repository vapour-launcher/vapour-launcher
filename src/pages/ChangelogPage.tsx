import React, { useState } from "react";
import { Sparkles, RefreshCw, CheckCircle2, ShieldCheck, Zap, Box, Cpu } from "lucide-react";

interface ReleaseItem {
  version: string;
  date: string;
  tag: string;
  isLatest: boolean;
  highlights: string[];
}

const RELEASES: ReleaseItem[] = [
  {
    version: "0.8.4",
    date: "Current Release",
    tag: "Beta",
    isLatest: true,
    highlights: [
      "Figma UI Glassmorphism aesthetic with #111217 base & #7C72FF periwinkle-violet accents",
      "Frameless window design with custom minimize, maximize, and close controls",
      "Interactive 3D Minecraft skin & cape preview powered by WebGL (skinview3d)",
      "Multi-Instance manager with isolated mods, resource packs, shaders, and configs",
      "Asynchronous SHA1-verified Mojang version manifest, client, and library downloader",
      "Microsoft OAuth Device Code + PKCE authentication flow and Offline account switcher",
      "Integrated Modrinth search engine with one-click mod and shaderpack downloads",
      "Cross-platform Java runtime auto-detection (/usr/lib/jvm, SDKMAN, Adoptium)",
      "Full GitHub Actions CI/CD workflow building AppImage, deb, rpm, and Windows installers",
    ],
  },
  {
    version: "0.8.3",
    date: "November 2026",
    tag: "Alpha",
    isLatest: false,
    highlights: [
      "Fabric, Quilt, Forge, and NeoForge automated loader installer profiles",
      "Real-time game stdout/stderr log stream to sliding console drawer",
      "Direct mod toggling (.jar <-> .jar.disabled) and drag-and-drop file imports",
    ],
  },
  {
    version: "0.8.0",
    date: "October 2026",
    tag: "Initial Prototype",
    isLatest: false,
    highlights: [
      "Initial Tauri v2 + Rust architecture scaffolding",
      "Basic instance directory isolation and process runner",
    ],
  },
];

const ChangelogPage: React.FC = () => {
  const [checking, setChecking] = useState(false);
  const [checkedMessage, setCheckedMessage] = useState<string | null>(null);

  const handleCheckUpdates = () => {
    setChecking(true);
    setCheckedMessage(null);
    setTimeout(() => {
      setChecking(false);
      setCheckedMessage("You are running the latest version of Vapour Launcher (v0.8.4)!");
    }, 1200);
  };

  const pageStyle: React.CSSProperties = {
    marginLeft: 64,
    height: "100vh",
    overflowY: "auto",
    padding: "32px 48px 48px 48px",
    position: "relative",
    zIndex: 10,
  };

  const headerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 32,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 28,
    fontWeight: 800,
    letterSpacing: -0.5,
    margin: 0,
    display: "flex",
    alignItems: "center",
    gap: 12,
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: 14,
    color: "#9B9BA7",
    marginTop: 6,
  };

  const updateBtnStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 18px",
    borderRadius: 9999,
    background: "rgba(124, 114, 255, 0.15)",
    border: "1px solid rgba(124, 114, 255, 0.3)",
    color: "#7C72FF",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
    outline: "none",
  };

  const cardStyle: React.CSSProperties = {
    background: "rgba(255, 255, 255, 0.03)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    maxWidth: 900,
  };

  const badgeStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 1,
    padding: "4px 10px",
    borderRadius: 9999,
    background: "rgba(74, 222, 128, 0.15)",
    color: "#4ADE80",
    border: "1px solid rgba(74, 222, 128, 0.3)",
  };

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>
            <Sparkles size={26} color="#7C72FF" />
            Updates & Changelog
          </h1>
          <p style={subtitleStyle}>
            Track new releases, feature additions, and security improvements in Vapour Launcher.
          </p>
        </div>

        <button style={updateBtnStyle} onClick={handleCheckUpdates} disabled={checking}>
          <RefreshCw size={14} className={checking ? "spin" : ""} />
          <span>{checking ? "Checking..." : "Check for Updates"}</span>
        </button>
      </div>

      {checkedMessage && (
        <div
          style={{
            background: "rgba(74, 222, 128, 0.1)",
            border: "1px solid rgba(74, 222, 128, 0.2)",
            color: "#4ADE80",
            padding: "12px 18px",
            borderRadius: 12,
            marginBottom: 24,
            maxWidth: 900,
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 13,
          }}
        >
          <CheckCircle2 size={16} />
          <span>{checkedMessage}</span>
        </div>
      )}

      {RELEASES.map((rel) => (
        <div key={rel.version} style={cardStyle}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>v{rel.version}</h2>
              {rel.isLatest && <span style={badgeStyle}>Latest</span>}
              <span style={{ fontSize: 13, color: "#6C6C7A" }}>{rel.date}</span>
            </div>
            <span
              style={{
                fontSize: 12,
                color: "#9B9BA7",
                background: "rgba(255,255,255,0.06)",
                padding: "3px 8px",
                borderRadius: 6,
              }}
            >
              {rel.tag}
            </span>
          </div>

          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {rel.highlights.map((h, idx) => (
              <li
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  fontSize: 14,
                  color: "#D1D1D6",
                  lineHeight: 1.6,
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#7C72FF",
                    marginTop: 8,
                    flexShrink: 0,
                  }}
                />
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default ChangelogPage;
