import React, { useState, useCallback } from "react";
import { X, Search, Download, ToggleLeft, ToggleRight, Package, ExternalLink } from "lucide-react";

interface InstalledMod {
  id: string;
  name: string;
  version: string;
  author: string;
  enabled: boolean;
  description: string;
}

interface BrowseMod {
  id: string;
  name: string;
  author: string;
  downloads: string;
  description: string;
  installed: boolean;
}

interface ModManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const INSTALLED_MODS: InstalledMod[] = [
  { id: "sodium", name: "Sodium", version: "0.6.5", author: "CaffeineMC", enabled: true, description: "Modern rendering engine and client-side optimizations" },
  { id: "lithium", name: "Lithium", version: "0.14.3", author: "CaffeineMC", enabled: true, description: "General-purpose server and game logic optimizations" },
  { id: "iris", name: "Iris Shaders", version: "1.8.0", author: "IrisShaders", enabled: true, description: "Shader mod compatible with Sodium" },
  { id: "modmenu", name: "Mod Menu", version: "12.0.1", author: "Prospector", enabled: true, description: "Adds a mod listing screen to the title screen" },
  { id: "fabric-api", name: "Fabric API", version: "0.102.0", author: "FabricMC", enabled: true, description: "Core API module for Fabric-based mods" },
  { id: "starlight", name: "Starlight", version: "1.2.0", author: "Spottedleaf", enabled: false, description: "Rewrites the light engine to fix lighting performance" },
  { id: "entityculling", name: "Entity Culling", version: "1.7.1", author: "tr7zw", enabled: true, description: "Skips rendering hidden entities and block entities" },
  { id: "ferrite-core", name: "FerriteCore", version: "7.0.2", author: "malte0811", enabled: true, description: "Memory usage optimizations" },
  { id: "lazydfu", name: "LazyDFU", version: "0.1.3", author: "astei", enabled: true, description: "Makes DataFixerUpper initialization lazy" },
  { id: "reeses-sodium", name: "Reese's Sodium Options", version: "1.8.0", author: "FlashyReese", enabled: true, description: "Replaces Sodium's options screen with a better one" },
];

const BROWSE_MODS: BrowseMod[] = [
  { id: "continuity", name: "Continuity", author: "PepperCode1", downloads: "12.4M", description: "Connected textures mod for Fabric", installed: false },
  { id: "indium", name: "Indium", author: "comp500", downloads: "8.9M", description: "Fabric Rendering API support for Sodium", installed: false },
  { id: "lambdynamiclights", name: "LambDynamicLights", author: "LambdAurora", downloads: "10.2M", description: "Dynamic lighting for held items and entities", installed: false },
  { id: "cloth-config", name: "Cloth Config", author: "shedaniel", downloads: "45.1M", description: "Configuration library for Fabric mods", installed: false },
  { id: "appleskin", name: "AppleSkin", author: "squeek502", downloads: "22.8M", description: "Food and hunger HUD improvements", installed: false },
  { id: "journeymap", name: "JourneyMap", author: "techbrew", downloads: "30.5M", description: "Real-time map with waypoints and minimap", installed: false },
];

const ModManager: React.FC<ModManagerProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<"installed" | "browse">("installed");
  const [searchQuery, setSearchQuery] = useState("");
  const [mods, setMods] = useState<InstalledMod[]>(INSTALLED_MODS);
  const [installingMod, setInstallingMod] = useState<string | null>(null);

  const toggleMod = useCallback((id: string) => {
    setMods((prev) =>
      prev.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m))
    );
  }, []);

  const handleInstall = useCallback((id: string) => {
    setInstallingMod(id);
    setTimeout(() => setInstallingMod(null), 1500);
  }, []);

  if (!isOpen) return null;

  const filteredInstalled = mods.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBrowse = BROWSE_MODS.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    zIndex: 60,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(0, 0, 0, 0.6)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
  };

  const modalStyle: React.CSSProperties = {
    width: 720,
    maxHeight: "80vh",
    background: "rgba(17, 18, 23, 0.98)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: 16,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxShadow: "0 24px 80px rgba(0, 0, 0, 0.6)",
  };

  const headerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px 24px 16px 24px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
  };

  const titleStyle: React.CSSProperties = {
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    fontSize: 18,
    fontWeight: 700,
    color: "#FFFFFF",
    display: "flex",
    alignItems: "center",
    gap: 10,
  };

  const closeBtnStyle: React.CSSProperties = {
    width: 32,
    height: 32,
    borderRadius: 8,
    border: "none",
    background: "rgba(255, 255, 255, 0.06)",
    color: "#6C6C7A",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.15s ease",
    padding: 0,
    outline: "none",
  };

  const tabBarStyle: React.CSSProperties = {
    display: "flex",
    gap: 0,
    padding: "0 24px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
  };

  const getTabStyle = (tab: string): React.CSSProperties => ({
    padding: "12px 20px",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    fontSize: 13,
    fontWeight: activeTab === tab ? 600 : 500,
    color: activeTab === tab ? "#FFFFFF" : "#6C6C7A",
    background: "transparent",
    border: "none",
    borderBottom: activeTab === tab ? "2px solid #7C72FF" : "2px solid transparent",
    cursor: "pointer",
    transition: "all 0.15s ease",
    outline: "none",
  });

  const searchBarStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    margin: "16px 24px 8px 24px",
    padding: "10px 14px",
    borderRadius: 10,
    background: "rgba(255, 255, 255, 0.04)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
  };

  const searchInputStyle: React.CSSProperties = {
    flex: 1,
    background: "transparent",
    border: "none",
    outline: "none",
    color: "#FFFFFF",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    fontSize: 13,
    fontWeight: 400,
  };

  const listStyle: React.CSSProperties = {
    flex: 1,
    overflowY: "auto",
    padding: "8px 24px 24px 24px",
  };

  const modCardStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "14px 16px",
    borderRadius: 12,
    background: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.05)",
    marginBottom: 8,
    transition: "all 0.15s ease",
  };

  const modInfoStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
  };

  const modNameStyle: React.CSSProperties = {
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    fontSize: 14,
    fontWeight: 600,
    color: "#FFFFFF",
    marginBottom: 2,
  };

  const modMetaStyle: React.CSSProperties = {
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    fontSize: 11,
    fontWeight: 500,
    color: "#6C6C7A",
    display: "flex",
    alignItems: "center",
    gap: 8,
  };

  const modDescStyle: React.CSSProperties = {
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    fontSize: 12,
    fontWeight: 400,
    color: "#9B9BA7",
    marginTop: 4,
    lineHeight: 1.4,
  };

  const toggleBtnStyle = (enabled: boolean): React.CSSProperties => ({
    background: "transparent",
    border: "none",
    cursor: "pointer",
    color: enabled ? "#7C72FF" : "#6C6C7A",
    padding: 0,
    outline: "none",
    transition: "color 0.15s ease",
    flexShrink: 0,
  });

  const installBtnStyle = (installing: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 14px",
    borderRadius: 8,
    border: "none",
    background: installing ? "rgba(124, 114, 255, 0.15)" : "#7C72FF",
    color: "#FFFFFF",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    fontSize: 12,
    fontWeight: 600,
    cursor: installing ? "default" : "pointer",
    transition: "all 0.15s ease",
    outline: "none",
    flexShrink: 0,
    opacity: installing ? 0.7 : 1,
  });

  const modIconStyle: React.CSSProperties = {
    width: 40,
    height: 40,
    borderRadius: 10,
    background: "rgba(124, 114, 255, 0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  };

  const versionBadge: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 500,
    color: "#9B9BA7",
    background: "rgba(255, 255, 255, 0.06)",
    paddingLeft: 6,
    paddingRight: 6,
    paddingTop: 1,
    paddingBottom: 1,
    borderRadius: 4,
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={headerStyle}>
          <div style={titleStyle}>
            <Package size={20} strokeWidth={2} style={{ color: "#7C72FF" }} />
            Mod Manager
          </div>
          <button style={closeBtnStyle} onClick={onClose}>
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Tab bar */}
        <div style={tabBarStyle}>
          <button style={getTabStyle("installed")} onClick={() => setActiveTab("installed")}>
            Installed ({mods.length})
          </button>
          <button style={getTabStyle("browse")} onClick={() => setActiveTab("browse")}>
            Browse Modrinth
          </button>
        </div>

        {/* Search */}
        <div style={searchBarStyle}>
          <Search size={16} strokeWidth={2} style={{ color: "#6C6C7A" }} />
          <input
            style={searchInputStyle}
            placeholder={
              activeTab === "installed"
                ? "Search installed mods..."
                : "Search Modrinth..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* List */}
        <div style={listStyle}>
          {activeTab === "installed" &&
            filteredInstalled.map((mod) => (
              <div key={mod.id} style={modCardStyle}>
                <div style={modIconStyle}>
                  <Package size={18} strokeWidth={1.5} style={{ color: "#7C72FF" }} />
                </div>
                <div style={modInfoStyle}>
                  <div style={modNameStyle}>
                    {mod.name}
                    <span style={{ ...versionBadge, marginLeft: 8 }}>
                      v{mod.version}
                    </span>
                  </div>
                  <div style={modMetaStyle}>
                    <span>by {mod.author}</span>
                  </div>
                  <div style={modDescStyle}>{mod.description}</div>
                </div>
                <button
                  style={toggleBtnStyle(mod.enabled)}
                  onClick={() => toggleMod(mod.id)}
                  title={mod.enabled ? "Disable" : "Enable"}
                >
                  {mod.enabled ? (
                    <ToggleRight size={28} strokeWidth={1.5} />
                  ) : (
                    <ToggleLeft size={28} strokeWidth={1.5} />
                  )}
                </button>
              </div>
            ))}

          {activeTab === "browse" &&
            filteredBrowse.map((mod) => (
              <div key={mod.id} style={modCardStyle}>
                <div style={modIconStyle}>
                  <Package size={18} strokeWidth={1.5} style={{ color: "#7C72FF" }} />
                </div>
                <div style={modInfoStyle}>
                  <div style={modNameStyle}>{mod.name}</div>
                  <div style={modMetaStyle}>
                    <span>by {mod.author}</span>
                    <span>•</span>
                    <Download size={11} strokeWidth={2} style={{ color: "#6C6C7A" }} />
                    <span>{mod.downloads}</span>
                  </div>
                  <div style={modDescStyle}>{mod.description}</div>
                </div>
                <button
                  style={installBtnStyle(installingMod === mod.id)}
                  onClick={() => handleInstall(mod.id)}
                >
                  {installingMod === mod.id ? (
                    <span>Installing...</span>
                  ) : (
                    <>
                      <Download size={13} strokeWidth={2} />
                      <span>Install</span>
                    </>
                  )}
                </button>
              </div>
            ))}

          {activeTab === "installed" && filteredInstalled.length === 0 && (
            <div
              style={{
                padding: 40,
                textAlign: "center",
                color: "#6C6C7A",
                fontSize: 13,
                fontFamily: "'Inter', system-ui, sans-serif",
              }}
            >
              No mods match your search.
            </div>
          )}
          {activeTab === "browse" && filteredBrowse.length === 0 && (
            <div
              style={{
                padding: 40,
                textAlign: "center",
                color: "#6C6C7A",
                fontSize: 13,
                fontFamily: "'Inter', system-ui, sans-serif",
              }}
            >
              No results found on Modrinth.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModManager;
