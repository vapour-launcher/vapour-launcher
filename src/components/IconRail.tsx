import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Play, LayoutGrid, Shirt, Settings, FileText } from "lucide-react";

interface NavItem {
  icon: React.FC<{ size?: number; strokeWidth?: number; style?: React.CSSProperties }>;
  path: string;
  label: string;
}

const topNavItems: NavItem[] = [
  { icon: Play, path: "/", label: "Home" },
  { icon: LayoutGrid, path: "/instances", label: "Instances" },
  { icon: Shirt, path: "/skins", label: "Skins" },
  { icon: Settings, path: "/settings", label: "Settings" },
];

const bottomNavItems: NavItem[] = [
  { icon: FileText, path: "/changelog", label: "Changelog" },
];

const IconRail: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);

  const railStyle: React.CSSProperties = {
    position: "fixed",
    left: 0,
    top: 0,
    width: 64,
    height: "100vh",
    background: "#0D0E13",
    zIndex: 50,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 20,
  };

  const logoStyle: React.CSSProperties = {
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    fontWeight: 900,
    fontSize: 28,
    color: "#7C72FF",
    marginBottom: 32,
    cursor: "pointer",
    userSelect: "none",
    lineHeight: 1,
  };

  const navGroupStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    flex: 1,
  };

  const bottomGroupStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    marginTop: "auto",
  };

  const getButtonStyle = (path: string): React.CSSProperties => {
    const isActive = location.pathname === path;
    const isHovered = hoveredPath === path;

    return {
      width: 48,
      height: 48,
      borderRadius: 12,
      border: "none",
      background: isActive
        ? "rgba(124, 114, 255, 0.2)"
        : isHovered
        ? "rgba(255, 255, 255, 0.08)"
        : "transparent",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      transition: "all 0.2s ease",
      padding: 0,
      outline: "none",
      position: "relative",
    };
  };

  const getIconStyle = (path: string): React.CSSProperties => {
    const isActive = location.pathname === path;
    const isHovered = hoveredPath === path;

    return {
      color: isActive ? "#FFFFFF" : isHovered ? "#FFFFFF" : "#6C6C7A",
      transition: "color 0.2s ease",
    };
  };

  const renderNavButton = (item: NavItem) => (
    <button
      key={item.path}
      style={getButtonStyle(item.path)}
      onClick={() => navigate(item.path)}
      onMouseEnter={() => setHoveredPath(item.path)}
      onMouseLeave={() => setHoveredPath(null)}
      aria-label={item.label}
      title={item.label}
    >
      <item.icon size={22} strokeWidth={1.8} style={getIconStyle(item.path)} />
    </button>
  );

  return (
    <nav style={railStyle}>
      <div style={logoStyle} onClick={() => navigate("/")}>
        V
      </div>
      <div style={navGroupStyle}>
        {topNavItems.map(renderNavButton)}
      </div>
      <div style={bottomGroupStyle}>
        {bottomNavItems.map(renderNavButton)}
      </div>
    </nav>
  );
};

export default IconRail;
