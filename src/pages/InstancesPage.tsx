import React, { useState, useCallback } from "react";
import {
  Plus,
  Play,
  Settings,
  Trash2,
  X,
  Folder,
  Copy,
  MoreVertical,
} from "lucide-react";

interface Instance {
  id: string;
  name: string;
  version: string;
  loader: string;
  loaderVersion: string;
  lastPlayed: string;
  modCount: number;
  icon: string;
}

const INSTANCES: Instance[] = [
  {
    id: "1",
    name: "Vanilla+",
    version: "1.21.11",
    loader: "Fabric",
    loaderVersion: "0.16.14",
    lastPlayed: "2 hours ago",
    modCount: 32,
    icon: "🟣",
  },
  {
    id: "2",
    name: "SMP Server",
    version: "1.21.4",
    loader: "Fabric",
    loaderVersion: "0.16.10",
    lastPlayed: "Yesterday",
    modCount: 18,
    icon: "🔵",
  },
  {
    id: "3",
    name: "Creative Build",
    version: "1.21.11",
    loader: "Vanilla",
    loaderVersion: "",
    lastPlayed: "3 days ago",
    modCount: 0,
    icon: "🟢",
  },
  {
    id: "4",
    name: "Modded Survival",
    version: "1.20.1",
    loader: "Forge",
    loaderVersion: "47.3.1",
    lastPlayed: "1 week ago",
    modCount: 87,
    icon: "🟠",
  },
  {
    id: "5",
    name: "Skyblock",
    version: "1.20.4",
    loader: "Fabric",
    loaderVersion: "0.15.11",
    lastPlayed: "2 weeks ago",
    modCount: 24,
    icon: "🔴",
  },
  {
    id: "6",
    name: "Snapshot Testing",
    version: "25w02a",
    loader: "Fabric",
    loaderVersion: "0.16.14",
    lastPlayed: "1 month ago",
    modCount: 3,
    icon: "⚪",
  },
];

const InstancesPage: React.FC = () => {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    version: "1.21.11",
    loader: "Fabric",
  });

  const pageStyle: React.CSSProperties = {
    marginLeft: 64,
    padding: "80px 40px 40px 40px",
    minHeight: "100vh",
    background: "#111217",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
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
    color: "#FFFFFF",
    letterSpacing: -0.5,
  };

  const createBtnStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 20px",
    borderRadius: 10,
    border: "none",
    background:
      hoveredBtn === "create"
        ? "linear-gradient(135deg, #8B82FF, #6B62EE)"
        : "#7C72FF",
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
    outline: "none",
    boxShadow:
      hoveredBtn === "create"
        ? "0 6px 20px rgba(124, 114, 255, 0.35)"
        : "none",
  };

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: 16,
  };

  const getCardStyle = (id: string): React.CSSProperties => ({
    background:
      hoveredCard === id
        ? "rgba(255, 255, 255, 0.06)"
        : "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: 16,
    padding: 20,
    cursor: "pointer",
    transition: "all 0.2s ease",
    transform: hoveredCard === id ? "translateY(-2px)" : "none",
    boxShadow:
      hoveredCard === id
        ? "0 8px 32px rgba(0, 0, 0, 0.3)"
        : "none",
  });

  const cardHeaderStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 14,
    marginBottom: 14,
  };

  const cardIconStyle: React.CSSProperties = {
    width: 44,
    height: 44,
    borderRadius: 12,
    background: "rgba(124, 114, 255, 0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
    flexShrink: 0,
  };

  const cardNameStyle: React.CSSProperties = {
    fontSize: 16,
    fontWeight: 700,
    color: "#FFFFFF",
    marginBottom: 2,
  };

  const cardVersionStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 500,
    color: "#9B9BA7",
  };

  const cardBodyStyle: React.CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  };

  const badgeStyle = (color: string): React.CSSProperties => ({
    fontSize: 11,
    fontWeight: 600,
    color: color,
    background: `${color}15`,
    paddingLeft: 8,
    paddingRight: 8,
    paddingTop: 3,
    paddingBottom: 3,
    borderRadius: 6,
  });

  const cardFooterStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderTop: "1px solid rgba(255, 255, 255, 0.06)",
    paddingTop: 14,
  };

  const lastPlayedStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 500,
    color: "#6C6C7A",
  };

  const actionGroupStyle: React.CSSProperties = {
    display: "flex",
    gap: 4,
  };

  const actionBtnStyle = (id: string): React.CSSProperties => ({
    width: 32,
    height: 32,
    borderRadius: 8,
    border: "none",
    background:
      hoveredBtn === id
        ? "rgba(255, 255, 255, 0.1)"
        : "transparent",
    color: hoveredBtn === id ? "#FFFFFF" : "#6C6C7A",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.15s ease",
    padding: 0,
    outline: "none",
  });

  const playActionBtnStyle = (id: string): React.CSSProperties => ({
    ...actionBtnStyle(id),
    background:
      hoveredBtn === id
        ? "rgba(124, 114, 255, 0.3)"
        : "rgba(124, 114, 255, 0.15)",
    color: "#7C72FF",
  });

  /* Create Modal styles */
  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    zIndex: 60,
    display: showCreateModal ? "flex" : "none",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(0, 0, 0, 0.6)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
  };

  const modalStyle: React.CSSProperties = {
    width: 480,
    background: "rgba(17, 18, 23, 0.98)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: 16,
    padding: 28,
    boxShadow: "0 24px 80px rgba(0, 0, 0, 0.6)",
  };

  const modalTitleStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  };

  const formGroupStyle: React.CSSProperties = {
    marginBottom: 18,
  };

  const formLabelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    color: "#9B9BA7",
    marginBottom: 6,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  };

  const formInputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid rgba(255, 255, 255, 0.08)",
    background: "rgba(255, 255, 255, 0.04)",
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "'Inter', system-ui, sans-serif",
    fontWeight: 500,
    outline: "none",
    transition: "border-color 0.15s ease",
    boxSizing: "border-box" as const,
  };

  const formSelectStyle: React.CSSProperties = {
    ...formInputStyle,
    appearance: "none" as const,
    cursor: "pointer",
  };

  const modalBtnRowStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 24,
  };

  const cancelBtnStyle: React.CSSProperties = {
    padding: "10px 20px",
    borderRadius: 10,
    border: "1px solid rgba(255, 255, 255, 0.08)",
    background: "rgba(255, 255, 255, 0.04)",
    color: "#9B9BA7",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    outline: "none",
    fontFamily: "'Inter', system-ui, sans-serif",
  };

  const submitBtnStyle: React.CSSProperties = {
    padding: "10px 24px",
    borderRadius: 10,
    border: "none",
    background: "#7C72FF",
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    outline: "none",
    fontFamily: "'Inter', system-ui, sans-serif",
    transition: "all 0.15s ease",
  };

  const getLoaderColor = (loader: string): string => {
    switch (loader) {
      case "Fabric":
        return "#DBBFEF";
      case "Forge":
        return "#F97316";
      case "Quilt":
        return "#A78BFA";
      default:
        return "#9B9BA7";
    }
  };

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h1 style={titleStyle}>Instances</h1>
        <button
          style={createBtnStyle}
          onClick={() => setShowCreateModal(true)}
          onMouseEnter={() => setHoveredBtn("create")}
          onMouseLeave={() => setHoveredBtn(null)}
        >
          <Plus size={18} strokeWidth={2.5} />
          Create New
        </button>
      </div>

      {/* Grid */}
      <div style={gridStyle}>
        {INSTANCES.map((inst) => (
          <div
            key={inst.id}
            style={getCardStyle(inst.id)}
            onMouseEnter={() => setHoveredCard(inst.id)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div style={cardHeaderStyle}>
              <div style={cardIconStyle}>{inst.icon}</div>
              <div>
                <div style={cardNameStyle}>{inst.name}</div>
                <div style={cardVersionStyle}>Minecraft {inst.version}</div>
              </div>
            </div>
            <div style={cardBodyStyle}>
              <span style={badgeStyle(getLoaderColor(inst.loader))}>
                {inst.loader}
                {inst.loaderVersion ? ` ${inst.loaderVersion}` : ""}
              </span>
              {inst.modCount > 0 && (
                <span style={badgeStyle("#7C72FF")}>
                  {inst.modCount} mods
                </span>
              )}
            </div>
            <div style={cardFooterStyle}>
              <span style={lastPlayedStyle}>Played {inst.lastPlayed}</span>
              <div style={actionGroupStyle}>
                <button
                  style={playActionBtnStyle(`play-${inst.id}`)}
                  onMouseEnter={() => setHoveredBtn(`play-${inst.id}`)}
                  onMouseLeave={() => setHoveredBtn(null)}
                  title="Launch"
                >
                  <Play size={14} fill="#7C72FF" strokeWidth={0} />
                </button>
                <button
                  style={actionBtnStyle(`settings-${inst.id}`)}
                  onMouseEnter={() => setHoveredBtn(`settings-${inst.id}`)}
                  onMouseLeave={() => setHoveredBtn(null)}
                  title="Settings"
                >
                  <Settings size={14} strokeWidth={2} />
                </button>
                <button
                  style={actionBtnStyle(`folder-${inst.id}`)}
                  onMouseEnter={() => setHoveredBtn(`folder-${inst.id}`)}
                  onMouseLeave={() => setHoveredBtn(null)}
                  title="Open folder"
                >
                  <Folder size={14} strokeWidth={2} />
                </button>
                <button
                  style={actionBtnStyle(`duplicate-${inst.id}`)}
                  onMouseEnter={() => setHoveredBtn(`duplicate-${inst.id}`)}
                  onMouseLeave={() => setHoveredBtn(null)}
                  title="Duplicate"
                >
                  <Copy size={14} strokeWidth={2} />
                </button>
                <button
                  style={{
                    ...actionBtnStyle(`delete-${inst.id}`),
                    color:
                      hoveredBtn === `delete-${inst.id}`
                        ? "#EF4444"
                        : "#6C6C7A",
                  }}
                  onMouseEnter={() => setHoveredBtn(`delete-${inst.id}`)}
                  onMouseLeave={() => setHoveredBtn(null)}
                  title="Delete"
                >
                  <Trash2 size={14} strokeWidth={2} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      <div style={overlayStyle} onClick={() => setShowCreateModal(false)}>
        <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
          <div style={modalTitleStyle}>
            <span
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "#FFFFFF",
              }}
            >
              Create New Instance
            </span>
            <button
              style={{
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
                outline: "none",
                padding: 0,
              }}
              onClick={() => setShowCreateModal(false)}
            >
              <X size={16} strokeWidth={2} />
            </button>
          </div>

          <div style={formGroupStyle}>
            <label style={formLabelStyle}>Instance Name</label>
            <input
              style={formInputStyle}
              placeholder="My Instance"
              value={createForm.name}
              onChange={(e) =>
                setCreateForm({ ...createForm, name: e.target.value })
              }
            />
          </div>

          <div style={formGroupStyle}>
            <label style={formLabelStyle}>Minecraft Version</label>
            <select
              style={formSelectStyle}
              value={createForm.version}
              onChange={(e) =>
                setCreateForm({ ...createForm, version: e.target.value })
              }
            >
              <option value="1.21.11">1.21.11</option>
              <option value="1.21.4">1.21.4</option>
              <option value="1.21.3">1.21.3</option>
              <option value="1.20.4">1.20.4</option>
              <option value="1.20.1">1.20.1</option>
              <option value="1.19.4">1.19.4</option>
            </select>
          </div>

          <div style={formGroupStyle}>
            <label style={formLabelStyle}>Mod Loader</label>
            <select
              style={formSelectStyle}
              value={createForm.loader}
              onChange={(e) =>
                setCreateForm({ ...createForm, loader: e.target.value })
              }
            >
              <option value="Vanilla">Vanilla</option>
              <option value="Fabric">Fabric</option>
              <option value="Forge">Forge</option>
              <option value="Quilt">Quilt</option>
            </select>
          </div>

          <div style={modalBtnRowStyle}>
            <button
              style={cancelBtnStyle}
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </button>
            <button
              style={submitBtnStyle}
              onClick={() => setShowCreateModal(false)}
            >
              Create Instance
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstancesPage;
