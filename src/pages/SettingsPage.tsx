import React, { useState } from "react";
import {
  Monitor,
  Coffee,
  FolderDown,
  Info,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

interface SettingsSection {
  id: string;
  title: string;
  icon: React.FC<{ size?: number; strokeWidth?: number; style?: React.CSSProperties }>;
}

const SECTIONS: SettingsSection[] = [
  { id: "general", title: "General", icon: Monitor },
  { id: "java", title: "Java", icon: Coffee },
  { id: "downloads", title: "Downloads", icon: FolderDown },
  { id: "about", title: "About", icon: Info },
];

const SettingsPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState("general");
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  /* Form states */
  const [settings, setSettings] = useState({
    closeLauncher: true,
    showConsole: false,
    checkUpdates: true,
    theme: "dark",
    language: "en",
    javaPath: "/usr/lib/jvm/java-21-openjdk/bin/java",
    minRam: "2",
    maxRam: "4",
    jvmArgs: "-XX:+UseG1GC -XX:+ParallelRefProcEnabled",
    downloadThreads: "4",
    instanceDir: "~/.vapour/instances",
    maxConcurrent: "3",
    verifyChecksums: true,
  });

  const updateSetting = (key: string, value: string | boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const pageStyle: React.CSSProperties = {
    marginLeft: 64,
    padding: "80px 40px 40px 40px",
    minHeight: "100vh",
    background: "#111217",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    display: "flex",
    gap: 32,
  };

  /* Left nav */
  const navStyle: React.CSSProperties = {
    flex: "0 0 220px",
    display: "flex",
    flexDirection: "column",
    gap: 4,
    paddingTop: 8,
  };

  const getNavItemStyle = (id: string): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 16px",
    borderRadius: 10,
    background:
      activeSection === id
        ? "rgba(124, 114, 255, 0.12)"
        : hoveredItem === `nav-${id}`
        ? "rgba(255, 255, 255, 0.05)"
        : "transparent",
    color: activeSection === id ? "#FFFFFF" : "#9B9BA7",
    fontSize: 14,
    fontWeight: activeSection === id ? 600 : 500,
    cursor: "pointer",
    transition: "all 0.15s ease",
    border: "none",
    outline: "none",
    width: "100%",
    textAlign: "left" as const,
    fontFamily: "'Inter', system-ui, sans-serif",
  });

  /* Right content */
  const contentStyle: React.CSSProperties = {
    flex: 1,
    overflowY: "auto",
    maxHeight: "calc(100vh - 120px)",
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: 24,
    fontWeight: 800,
    color: "#FFFFFF",
    marginBottom: 24,
    letterSpacing: -0.3,
  };

  const cardStyle: React.CSSProperties = {
    background: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
  };

  const cardLabelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    color: "#6C6C7A",
    textTransform: "uppercase" as const,
    letterSpacing: 1,
    marginBottom: 16,
  };

  const fieldRowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 14,
    paddingBottom: 14,
    borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
  };

  const fieldLabelStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 500,
    color: "#FFFFFF",
  };

  const fieldDescStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 400,
    color: "#6C6C7A",
    marginTop: 2,
  };

  const inputStyle: React.CSSProperties = {
    width: 240,
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid rgba(255, 255, 255, 0.08)",
    background: "rgba(255, 255, 255, 0.04)",
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: "'Inter', system-ui, sans-serif",
    fontWeight: 500,
    outline: "none",
    transition: "border-color 0.15s ease",
    boxSizing: "border-box" as const,
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    width: 160,
    appearance: "none" as const,
    cursor: "pointer",
  };

  const monoInputStyle: React.CSSProperties = {
    ...inputStyle,
    width: "100%",
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: 12,
    marginTop: 8,
  };

  const toggleWrapperStyle: React.CSSProperties = {
    position: "relative",
    width: 44,
    height: 24,
    cursor: "pointer",
    flexShrink: 0,
  };

  const getToggleTrackStyle = (on: boolean): React.CSSProperties => ({
    position: "absolute",
    inset: 0,
    borderRadius: 12,
    background: on ? "#7C72FF" : "rgba(255, 255, 255, 0.1)",
    transition: "background 0.2s ease",
  });

  const getToggleThumbStyle = (on: boolean): React.CSSProperties => ({
    position: "absolute",
    top: 3,
    left: on ? 23 : 3,
    width: 18,
    height: 18,
    borderRadius: "50%",
    background: "#FFFFFF",
    transition: "left 0.2s ease",
    boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
  });

  const renderToggle = (key: string, value: boolean) => (
    <div
      style={toggleWrapperStyle}
      onClick={() => updateSetting(key, !value)}
    >
      <div style={getToggleTrackStyle(value)} />
      <div style={getToggleThumbStyle(value)} />
    </div>
  );

  const smallInputStyle: React.CSSProperties = {
    ...inputStyle,
    width: 80,
    textAlign: "center" as const,
  };

  const linkStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 6,
    color: "#7C72FF",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    textDecoration: "none",
    transition: "opacity 0.15s ease",
  };

  const renderContent = () => {
    switch (activeSection) {
      case "general":
        return (
          <div>
            <h2 style={sectionTitleStyle}>General</h2>
            <div style={cardStyle}>
              <div style={cardLabelStyle}>Launcher Behavior</div>

              <div style={fieldRowStyle}>
                <div>
                  <div style={fieldLabelStyle}>Close launcher on game start</div>
                  <div style={fieldDescStyle}>
                    Minimize launcher when Minecraft launches
                  </div>
                </div>
                {renderToggle("closeLauncher", settings.closeLauncher)}
              </div>

              <div style={fieldRowStyle}>
                <div>
                  <div style={fieldLabelStyle}>Show console window</div>
                  <div style={fieldDescStyle}>
                    Show game log output in a separate window
                  </div>
                </div>
                {renderToggle("showConsole", settings.showConsole)}
              </div>

              <div style={fieldRowStyle}>
                <div>
                  <div style={fieldLabelStyle}>Auto-check for updates</div>
                  <div style={fieldDescStyle}>
                    Check for Vapour updates on startup
                  </div>
                </div>
                {renderToggle("checkUpdates", settings.checkUpdates)}
              </div>

              <div style={{ ...fieldRowStyle, borderBottom: "none" }}>
                <div>
                  <div style={fieldLabelStyle}>Theme</div>
                  <div style={fieldDescStyle}>Visual appearance</div>
                </div>
                <select
                  style={selectStyle}
                  value={settings.theme}
                  onChange={(e) => updateSetting("theme", e.target.value)}
                >
                  <option value="dark">Dark (Default)</option>
                  <option value="oled">OLED Black</option>
                  <option value="midnight">Midnight Blue</option>
                </select>
              </div>
            </div>

            <div style={cardStyle}>
              <div style={cardLabelStyle}>Localization</div>
              <div style={{ ...fieldRowStyle, borderBottom: "none" }}>
                <div>
                  <div style={fieldLabelStyle}>Language</div>
                  <div style={fieldDescStyle}>Interface language</div>
                </div>
                <select
                  style={selectStyle}
                  value={settings.language}
                  onChange={(e) => updateSetting("language", e.target.value)}
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                  <option value="pt">Português</option>
                  <option value="ja">日本語</option>
                  <option value="zh">中文</option>
                </select>
              </div>
            </div>
          </div>
        );

      case "java":
        return (
          <div>
            <h2 style={sectionTitleStyle}>Java</h2>
            <div style={cardStyle}>
              <div style={cardLabelStyle}>Runtime</div>

              <div style={fieldRowStyle}>
                <div style={{ flex: 1 }}>
                  <div style={fieldLabelStyle}>Java Executable Path</div>
                  <div style={fieldDescStyle}>
                    Path to the Java binary used to run Minecraft
                  </div>
                  <input
                    style={monoInputStyle}
                    value={settings.javaPath}
                    onChange={(e) => updateSetting("javaPath", e.target.value)}
                  />
                </div>
              </div>

              <div style={{ ...fieldRowStyle, borderBottom: "none" }}>
                <div style={{ flex: 1 }}>
                  <div style={fieldLabelStyle}>JVM Arguments</div>
                  <div style={fieldDescStyle}>
                    Custom JVM flags passed to Minecraft
                  </div>
                  <input
                    style={monoInputStyle}
                    value={settings.jvmArgs}
                    onChange={(e) => updateSetting("jvmArgs", e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div style={cardStyle}>
              <div style={cardLabelStyle}>Memory Allocation</div>

              <div style={fieldRowStyle}>
                <div>
                  <div style={fieldLabelStyle}>Minimum RAM (GB)</div>
                  <div style={fieldDescStyle}>Initial heap size</div>
                </div>
                <input
                  style={smallInputStyle}
                  type="number"
                  min="1"
                  max="32"
                  value={settings.minRam}
                  onChange={(e) => updateSetting("minRam", e.target.value)}
                />
              </div>

              <div style={{ ...fieldRowStyle, borderBottom: "none" }}>
                <div>
                  <div style={fieldLabelStyle}>Maximum RAM (GB)</div>
                  <div style={fieldDescStyle}>Maximum heap size</div>
                </div>
                <input
                  style={smallInputStyle}
                  type="number"
                  min="1"
                  max="32"
                  value={settings.maxRam}
                  onChange={(e) => updateSetting("maxRam", e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      case "downloads":
        return (
          <div>
            <h2 style={sectionTitleStyle}>Downloads</h2>
            <div style={cardStyle}>
              <div style={cardLabelStyle}>Download Settings</div>

              <div style={fieldRowStyle}>
                <div>
                  <div style={fieldLabelStyle}>Download Threads</div>
                  <div style={fieldDescStyle}>
                    Number of parallel download connections
                  </div>
                </div>
                <input
                  style={smallInputStyle}
                  type="number"
                  min="1"
                  max="16"
                  value={settings.downloadThreads}
                  onChange={(e) =>
                    updateSetting("downloadThreads", e.target.value)
                  }
                />
              </div>

              <div style={fieldRowStyle}>
                <div>
                  <div style={fieldLabelStyle}>Max Concurrent Downloads</div>
                  <div style={fieldDescStyle}>
                    Maximum number of simultaneous mod/asset downloads
                  </div>
                </div>
                <input
                  style={smallInputStyle}
                  type="number"
                  min="1"
                  max="10"
                  value={settings.maxConcurrent}
                  onChange={(e) =>
                    updateSetting("maxConcurrent", e.target.value)
                  }
                />
              </div>

              <div style={{ ...fieldRowStyle, borderBottom: "none" }}>
                <div>
                  <div style={fieldLabelStyle}>Verify file checksums</div>
                  <div style={fieldDescStyle}>
                    Validate downloaded file integrity
                  </div>
                </div>
                {renderToggle("verifyChecksums", settings.verifyChecksums)}
              </div>
            </div>

            <div style={cardStyle}>
              <div style={cardLabelStyle}>Storage</div>

              <div style={{ ...fieldRowStyle, borderBottom: "none" }}>
                <div style={{ flex: 1 }}>
                  <div style={fieldLabelStyle}>Instance Directory</div>
                  <div style={fieldDescStyle}>
                    Where Minecraft instances are stored
                  </div>
                  <input
                    style={monoInputStyle}
                    value={settings.instanceDir}
                    onChange={(e) =>
                      updateSetting("instanceDir", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case "about":
        return (
          <div>
            <h2 style={sectionTitleStyle}>About</h2>
            <div style={cardStyle}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  padding: "20px 0",
                }}
              >
                <div
                  style={{
                    fontSize: 48,
                    fontWeight: 900,
                    color: "#7C72FF",
                    marginBottom: 8,
                    lineHeight: 1,
                  }}
                >
                  V
                </div>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: "#FFFFFF",
                    marginBottom: 4,
                  }}
                >
                  Vapour Launcher
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#6C6C7A",
                    marginBottom: 20,
                  }}
                >
                  Version 0.8.4 • Build 2024.11.22
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 400,
                    color: "#9B9BA7",
                    maxWidth: 400,
                    lineHeight: 1.6,
                    marginBottom: 24,
                  }}
                >
                  A modern, lightweight Minecraft launcher built with Tauri v2.
                  Designed for speed, simplicity, and a beautiful experience.
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 24,
                    marginBottom: 24,
                  }}
                >
                  <span style={linkStyle}>
                    <ExternalLink size={13} />
                    GitHub
                  </span>
                  <span style={linkStyle}>
                    <ExternalLink size={13} />
                    Discord
                  </span>
                  <span style={linkStyle}>
                    <ExternalLink size={13} />
                    Website
                  </span>
                </div>
              </div>
            </div>

            <div style={cardStyle}>
              <div style={cardLabelStyle}>Acknowledgements</div>
              <div style={{ ...fieldRowStyle, borderBottom: "none" }}>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 400,
                      color: "#9B9BA7",
                      lineHeight: 1.8,
                    }}
                  >
                    Built with Tauri, React, TypeScript, and skinview3d.
                    <br />
                    Minecraft is a trademark of Mojang Studios.
                    <br />
                    Not affiliated with or endorsed by Mojang or Microsoft.
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={pageStyle}>
      {/* Left nav */}
      <nav style={navStyle}>
        <div
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: "#FFFFFF",
            marginBottom: 20,
            letterSpacing: -0.5,
          }}
        >
          Settings
        </div>
        {SECTIONS.map((section) => (
          <button
            key={section.id}
            style={getNavItemStyle(section.id)}
            onClick={() => setActiveSection(section.id)}
            onMouseEnter={() => setHoveredItem(`nav-${section.id}`)}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <section.icon
              size={18}
              strokeWidth={1.8}
              style={{
                color:
                  activeSection === section.id ? "#7C72FF" : "#6C6C7A",
                transition: "color 0.15s ease",
              }}
            />
            {section.title}
            {activeSection === section.id && (
              <ChevronRight
                size={14}
                strokeWidth={2}
                style={{ marginLeft: "auto", color: "#6C6C7A" }}
              />
            )}
          </button>
        ))}
      </nav>

      {/* Right content */}
      <div style={contentStyle}>{renderContent()}</div>
    </div>
  );
};

export default SettingsPage;
