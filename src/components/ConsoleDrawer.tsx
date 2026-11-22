import React, { useState, useRef, useEffect, useCallback } from "react";
import { X, Terminal, ChevronDown, Trash2 } from "lucide-react";

interface LogEntry {
  id: number;
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR" | "DEBUG";
  message: string;
}

interface ConsoleDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const SAMPLE_LOGS: LogEntry[] = [
  { id: 1, timestamp: "15:04:21", level: "INFO", message: "[Fabric Loader] Loading Minecraft 1.21.11 with Fabric Loader 0.16.14" },
  { id: 2, timestamp: "15:04:22", level: "INFO", message: "[Fabric Loader] Loading 32 mods" },
  { id: 3, timestamp: "15:04:23", level: "DEBUG", message: "[Mixin] Compatibility level set to JAVA_21" },
  { id: 4, timestamp: "15:04:24", level: "INFO", message: "[Sodium] Initializing render pipeline..." },
  { id: 5, timestamp: "15:04:24", level: "INFO", message: "[Lithium] Loaded successfully" },
  { id: 6, timestamp: "15:04:25", level: "WARN", message: "[ModMenu] Mod 'xyz' is outdated, consider updating" },
  { id: 7, timestamp: "15:04:26", level: "INFO", message: "[Iris] Loading shaderpack: Complementary Reimagined" },
  { id: 8, timestamp: "15:04:27", level: "INFO", message: "[Minecraft] Setting user: astral" },
  { id: 9, timestamp: "15:04:28", level: "ERROR", message: "[OptiFine] Conflict detected with Sodium — skipping" },
  { id: 10, timestamp: "15:04:29", level: "INFO", message: "[Minecraft] Backend library: LWJGL 3.3.3" },
  { id: 11, timestamp: "15:04:30", level: "DEBUG", message: "[Minecraft] JVM Flags: -Xmx4G -Xms2G -XX:+UseG1GC" },
  { id: 12, timestamp: "15:04:31", level: "INFO", message: "[Minecraft] Narrator library not available" },
  { id: 13, timestamp: "15:04:32", level: "INFO", message: "[Minecraft] Reloading ResourceManager: Default, Fabric, vanilla" },
  { id: 14, timestamp: "15:04:34", level: "INFO", message: "[Minecraft] OpenAL initialized on device: OpenAL Soft" },
  { id: 15, timestamp: "15:04:36", level: "INFO", message: "[Minecraft] Created: 2048x1024x0 atlas textures/atlas/blocks.png" },
];

const levelColors: Record<string, string> = {
  INFO: "#4ADE80",
  WARN: "#FBBF24",
  ERROR: "#EF4444",
  DEBUG: "#6C6C7A",
};

const ConsoleDrawer: React.FC<ConsoleDrawerProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<LogEntry[]>(SAMPLE_LOGS);
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const handleClear = useCallback(() => {
    setLogs([]);
  }, []);

  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    left: 64,
    zIndex: 45,
    display: isOpen ? "flex" : "none",
    flexDirection: "column",
    justifyContent: "flex-end",
    background: "rgba(0, 0, 0, 0.4)",
  };

  const drawerStyle: React.CSSProperties = {
    maxHeight: "50vh",
    background: "rgba(17, 18, 23, 0.95)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    borderTop: "1px solid rgba(255, 255, 255, 0.08)",
    display: "flex",
    flexDirection: "column",
    animation: isOpen ? "slideUp 0.25s ease-out" : "none",
  };

  const headerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 20px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
    flexShrink: 0,
  };

  const headerLeftStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    color: "#FFFFFF",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    fontSize: 14,
    fontWeight: 600,
  };

  const headerRightStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 4,
  };

  const headerBtnStyle: React.CSSProperties = {
    width: 30,
    height: 30,
    borderRadius: 6,
    border: "none",
    background: "transparent",
    color: "#6C6C7A",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.15s ease",
    padding: 0,
    outline: "none",
  };

  const scrollAreaStyle: React.CSSProperties = {
    flex: 1,
    overflowY: "auto",
    padding: "8px 0",
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
    fontSize: 12,
    lineHeight: 1.7,
  };

  const logLineStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 1,
    paddingBottom: 1,
    transition: "background 0.1s ease",
  };

  const timestampStyle: React.CSSProperties = {
    color: "#6C6C7A",
    fontWeight: 400,
    flexShrink: 0,
    minWidth: 60,
  };

  const getLevelStyle = (level: string): React.CSSProperties => ({
    color: levelColors[level] || "#9B9BA7",
    fontWeight: 600,
    flexShrink: 0,
    minWidth: 44,
  });

  const messageStyle: React.CSSProperties = {
    color: "#D1D1DB",
    wordBreak: "break-word",
  };

  const autoScrollBtnStyle: React.CSSProperties = {
    ...headerBtnStyle,
    color: autoScroll ? "#7C72FF" : "#6C6C7A",
    transform: autoScroll ? "rotate(0deg)" : "rotate(180deg)",
    transition: "all 0.2s ease",
  };

  const countBadgeStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 500,
    color: "#6C6C7A",
    background: "rgba(255, 255, 255, 0.06)",
    paddingLeft: 8,
    paddingRight: 8,
    paddingTop: 2,
    paddingBottom: 2,
    borderRadius: 9999,
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={drawerStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <div style={headerLeftStyle}>
            <Terminal size={16} strokeWidth={2} style={{ color: "#7C72FF" }} />
            <span>Console Output</span>
            <span style={countBadgeStyle}>{logs.length} lines</span>
          </div>
          <div style={headerRightStyle}>
            <button
              style={autoScrollBtnStyle}
              onClick={() => setAutoScroll(!autoScroll)}
              title="Auto-scroll"
            >
              <ChevronDown size={14} strokeWidth={2} />
            </button>
            <button
              style={headerBtnStyle}
              onClick={handleClear}
              title="Clear logs"
            >
              <Trash2 size={14} strokeWidth={2} />
            </button>
            <button
              style={headerBtnStyle}
              onClick={onClose}
              title="Close"
            >
              <X size={14} strokeWidth={2} />
            </button>
          </div>
        </div>

        <div style={scrollAreaStyle} ref={scrollRef}>
          {logs.length === 0 && (
            <div
              style={{
                padding: 40,
                textAlign: "center",
                color: "#6C6C7A",
                fontSize: 13,
              }}
            >
              No log output yet.
            </div>
          )}
          {logs.map((entry) => (
            <div
              key={entry.id}
              style={{
                ...logLineStyle,
                background:
                  entry.level === "ERROR"
                    ? "rgba(239, 68, 68, 0.06)"
                    : entry.level === "WARN"
                    ? "rgba(251, 191, 36, 0.04)"
                    : "transparent",
              }}
            >
              <span style={timestampStyle}>{entry.timestamp}</span>
              <span style={getLevelStyle(entry.level)}>{entry.level}</span>
              <span style={messageStyle}>{entry.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ConsoleDrawer;
