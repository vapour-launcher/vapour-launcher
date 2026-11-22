import React, { useState } from "react";
import { Check, ChevronDown } from "lucide-react";

const TopBar: React.FC = () => {
  const [hoveredPill, setHoveredPill] = useState<string | null>(null);

  const containerStyle: React.CSSProperties = {
    position: "absolute",
    top: 16,
    left: 80,
    right: 80,
    zIndex: 40,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    pointerEvents: "none",
  };

  const pillBase: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 8,
    paddingBottom: 8,
    borderRadius: 9999,
    background: "rgba(255, 255, 255, 0.05)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s ease",
    pointerEvents: "auto",
    userSelect: "none",
  };

  const getPillStyle = (id: string): React.CSSProperties => ({
    ...pillBase,
    background:
      hoveredPill === id
        ? "rgba(255, 255, 255, 0.08)"
        : "rgba(255, 255, 255, 0.05)",
  });

  const greenDotStyle: React.CSSProperties = {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#4ADE80",
    flexShrink: 0,
    boxShadow: "0 0 6px rgba(74, 222, 128, 0.4)",
  };

  const mutedTextStyle: React.CSSProperties = {
    color: "#9B9BA7",
    fontSize: 12,
    fontWeight: 400,
  };

  const separatorDotStyle: React.CSSProperties = {
    width: 3,
    height: 3,
    borderRadius: "50%",
    background: "#6C6C7A",
    flexShrink: 0,
  };

  const avatarStackStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 4,
  };

  const miniAvatarStyle = (index: number): React.CSSProperties => ({
    width: 20,
    height: 20,
    borderRadius: "50%",
    border: "2px solid #0D0E13",
    marginLeft: index > 0 ? -8 : 0,
    background:
      index === 0
        ? "linear-gradient(135deg, #7C72FF, #A78BFA)"
        : index === 1
        ? "linear-gradient(135deg, #F472B6, #EC4899)"
        : "linear-gradient(135deg, #34D399, #10B981)",
    flexShrink: 0,
  });

  const checkIconContainerStyle: React.CSSProperties = {
    width: 18,
    height: 18,
    borderRadius: "50%",
    background: "rgba(74, 222, 128, 0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  };

  const skinAvatarStyle: React.CSSProperties = {
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #7C72FF, #5B52CC)",
    border: "2px solid rgba(124, 114, 255, 0.3)",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    fontWeight: 700,
    color: "#FFFFFF",
  };

  const badgeStyle: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 600,
    color: "#9B9BA7",
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    background: "rgba(255, 255, 255, 0.06)",
    paddingLeft: 6,
    paddingRight: 6,
    paddingTop: 2,
    paddingBottom: 2,
    borderRadius: 4,
  };

  return (
    <div style={containerStyle}>
      {/* Left pill — Online players */}
      <div
        style={getPillStyle("online")}
        onMouseEnter={() => setHoveredPill("online")}
        onMouseLeave={() => setHoveredPill(null)}
      >
        <div style={greenDotStyle} />
        <span>2,975 Online</span>
        <div style={avatarStackStyle}>
          <div style={miniAvatarStyle(0)} />
          <div style={miniAvatarStyle(1)} />
          <div style={miniAvatarStyle(2)} />
        </div>
      </div>

      {/* Center pill — Status + version */}
      <div
        style={getPillStyle("status")}
        onMouseEnter={() => setHoveredPill("status")}
        onMouseLeave={() => setHoveredPill(null)}
      >
        <div style={checkIconContainerStyle}>
          <Check size={11} strokeWidth={3} style={{ color: "#4ADE80" }} />
        </div>
        <span>Ready</span>
        <div style={separatorDotStyle} />
        <span style={mutedTextStyle}>Fabric 1.21.11</span>
        <ChevronDown size={14} style={{ color: "#6C6C7A" }} />
      </div>

      {/* Right pill — User account */}
      <div
        style={getPillStyle("account")}
        onMouseEnter={() => setHoveredPill("account")}
        onMouseLeave={() => setHoveredPill(null)}
      >
        <span style={{ fontWeight: 600 }}>astral</span>
        <div style={separatorDotStyle} />
        <span style={badgeStyle}>Microsoft</span>
        <div style={skinAvatarStyle}>A</div>
      </div>
    </div>
  );
};

export default TopBar;
