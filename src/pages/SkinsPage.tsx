import React, { useState, useRef, useEffect } from "react";
import { Upload, Trash2, Star, StarOff, Check } from "lucide-react";
import { SkinViewer as SkinViewerCanvas, IdleAnimation } from "skinview3d";

interface SkinEntry {
  id: string;
  name: string;
  url: string;
  model: "classic" | "slim";
  favorite: boolean;
  active: boolean;
}

const SKINS: SkinEntry[] = [
  {
    id: "1",
    name: "Default Steve",
    url: "https://crafatar.com/skins/c06f89064c8a49119c29ea1dbd1aab82",
    model: "classic",
    favorite: false,
    active: true,
  },
  {
    id: "2",
    name: "Astral Dark",
    url: "https://crafatar.com/skins/069a79f444e94726a5befca90e38aaf5",
    model: "classic",
    favorite: true,
    active: false,
  },
  {
    id: "3",
    name: "Alex",
    url: "https://crafatar.com/skins/6ab4317889fd490597f60f67d9d76fd9",
    model: "slim",
    favorite: false,
    active: false,
  },
  {
    id: "4",
    name: "Neon Runner",
    url: "https://crafatar.com/skins/853c80ef3c3749fdaa49938b674adae6",
    model: "classic",
    favorite: false,
    active: false,
  },
];

const SkinsPage: React.FC = () => {
  const [skins, setSkins] = useState<SkinEntry[]>(SKINS);
  const [selectedSkin, setSelectedSkin] = useState<SkinEntry>(SKINS[0]);
  const [hoveredSkin, setHoveredSkin] = useState<string | null>(null);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewerRef = useRef<SkinViewerCanvas | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (viewerRef.current) {
      viewerRef.current.dispose();
    }

    const viewer = new SkinViewerCanvas({
      canvas: canvasRef.current,
      width: 340,
      height: 500,
      skin: selectedSkin.url,
    });

    viewer.fov = 50;
    viewer.zoom = 0.9;
    viewer.autoRotate = true;
    viewer.autoRotateSpeed = 0.6;
    viewer.animation = new IdleAnimation();
    viewer.animation.speed = 0.5;
    viewer.background = null as unknown as string;

    viewerRef.current = viewer;

    return () => {
      viewer.dispose();
      viewerRef.current = null;
    };
  }, [selectedSkin]);

  const toggleFavorite = (id: string) => {
    setSkins((prev) =>
      prev.map((s) => (s.id === id ? { ...s, favorite: !s.favorite } : s))
    );
  };

  const setActiveSkin = (id: string) => {
    setSkins((prev) =>
      prev.map((s) => ({ ...s, active: s.id === id }))
    );
  };

  const pageStyle: React.CSSProperties = {
    marginLeft: 64,
    padding: "80px 40px 40px 40px",
    minHeight: "100vh",
    background: "#111217",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    display: "flex",
    gap: 40,
  };

  /* Left: Skin Viewer */
  const viewerPanelStyle: React.CSSProperties = {
    flex: "0 0 400px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 20,
  };

  const viewerContainerStyle: React.CSSProperties = {
    width: 340,
    height: 500,
    borderRadius: 20,
    background: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  };

  const canvasStyle: React.CSSProperties = {
    width: 340,
    height: 500,
  };

  const skinNameStyle: React.CSSProperties = {
    fontSize: 20,
    fontWeight: 700,
    color: "#FFFFFF",
    textAlign: "center",
  };

  const skinModelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 500,
    color: "#6C6C7A",
    textTransform: "uppercase" as const,
    letterSpacing: 1,
    textAlign: "center",
  };

  const viewerBtnRow: React.CSSProperties = {
    display: "flex",
    gap: 10,
    justifyContent: "center",
  };

  const getAccentBtnStyle = (id: string): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 20px",
    borderRadius: 10,
    border: "none",
    background:
      hoveredBtn === id
        ? "linear-gradient(135deg, #8B82FF, #6B62EE)"
        : "#7C72FF",
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
    outline: "none",
    fontFamily: "'Inter', system-ui, sans-serif",
  });

  const getSecondaryBtnStyle = (id: string): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 20px",
    borderRadius: 10,
    border: "1px solid rgba(255, 255, 255, 0.08)",
    background:
      hoveredBtn === id
        ? "rgba(255, 255, 255, 0.08)"
        : "rgba(255, 255, 255, 0.04)",
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
    outline: "none",
    fontFamily: "'Inter', system-ui, sans-serif",
  });

  /* Right: Skin List */
  const listPanelStyle: React.CSSProperties = {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  };

  const headerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 28,
    fontWeight: 800,
    color: "#FFFFFF",
    letterSpacing: -0.5,
  };

  const skinGridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: 12,
  };

  const getSkinCardStyle = (skin: SkinEntry): React.CSSProperties => ({
    background:
      skin.active
        ? "rgba(124, 114, 255, 0.08)"
        : hoveredSkin === skin.id
        ? "rgba(255, 255, 255, 0.06)"
        : "rgba(255, 255, 255, 0.03)",
    border: skin.active
      ? "1px solid rgba(124, 114, 255, 0.3)"
      : "1px solid rgba(255, 255, 255, 0.06)",
    borderRadius: 14,
    padding: 16,
    cursor: "pointer",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    gap: 14,
  });

  const skinThumbStyle: React.CSSProperties = {
    width: 48,
    height: 48,
    borderRadius: 10,
    background: "rgba(124, 114, 255, 0.1)",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  };

  const skinThumbImgStyle: React.CSSProperties = {
    width: 32,
    height: 32,
    imageRendering: "pixelated" as const,
  };

  const skinCardInfoStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
  };

  const skinCardNameStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
    color: "#FFFFFF",
    marginBottom: 2,
    display: "flex",
    alignItems: "center",
    gap: 6,
  };

  const skinCardModelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 500,
    color: "#6C6C7A",
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  };

  const skinActionStyle = (id: string): React.CSSProperties => ({
    width: 30,
    height: 30,
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
    flexShrink: 0,
  });

  const activeBadgeStyle: React.CSSProperties = {
    fontSize: 9,
    fontWeight: 700,
    color: "#7C72FF",
    background: "rgba(124, 114, 255, 0.15)",
    paddingLeft: 5,
    paddingRight: 5,
    paddingTop: 1,
    paddingBottom: 1,
    borderRadius: 4,
    textTransform: "uppercase" as const,
  };

  return (
    <div style={pageStyle}>
      {/* Left — Skin Viewer */}
      <div style={viewerPanelStyle}>
        <div style={viewerContainerStyle}>
          <canvas ref={canvasRef} style={canvasStyle} />
        </div>
        <div style={skinNameStyle}>{selectedSkin.name}</div>
        <div style={skinModelStyle}>{selectedSkin.model} model</div>
        <div style={viewerBtnRow}>
          <button
            style={getAccentBtnStyle("apply")}
            onMouseEnter={() => setHoveredBtn("apply")}
            onMouseLeave={() => setHoveredBtn(null)}
            onClick={() => setActiveSkin(selectedSkin.id)}
          >
            <Check size={15} strokeWidth={2.5} />
            Apply Skin
          </button>
          <button
            style={getSecondaryBtnStyle("upload")}
            onMouseEnter={() => setHoveredBtn("upload")}
            onMouseLeave={() => setHoveredBtn(null)}
          >
            <Upload size={15} strokeWidth={2} />
            Upload
          </button>
        </div>
      </div>

      {/* Right — Skin List */}
      <div style={listPanelStyle}>
        <div style={headerStyle}>
          <h1 style={titleStyle}>Wardrobe</h1>
          <button
            style={getSecondaryBtnStyle("upload-top")}
            onMouseEnter={() => setHoveredBtn("upload-top")}
            onMouseLeave={() => setHoveredBtn(null)}
          >
            <Upload size={15} strokeWidth={2} />
            Upload Skin
          </button>
        </div>

        <div style={skinGridStyle}>
          {skins.map((skin) => (
            <div
              key={skin.id}
              style={getSkinCardStyle(skin)}
              onClick={() => setSelectedSkin(skin)}
              onMouseEnter={() => setHoveredSkin(skin.id)}
              onMouseLeave={() => setHoveredSkin(null)}
            >
              <div style={skinThumbStyle}>
                <img
                  src={skin.url.replace("/skins/", "/avatars/")}
                  alt={skin.name}
                  style={skinThumbImgStyle}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
              <div style={skinCardInfoStyle}>
                <div style={skinCardNameStyle}>
                  {skin.name}
                  {skin.active && <span style={activeBadgeStyle}>Active</span>}
                </div>
                <div style={skinCardModelStyle}>{skin.model}</div>
              </div>
              <button
                style={skinActionStyle(`fav-${skin.id}`)}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(skin.id);
                }}
                onMouseEnter={() => setHoveredBtn(`fav-${skin.id}`)}
                onMouseLeave={() => setHoveredBtn(null)}
                title={skin.favorite ? "Unfavorite" : "Favorite"}
              >
                {skin.favorite ? (
                  <Star size={14} fill="#FBBF24" strokeWidth={0} />
                ) : (
                  <StarOff size={14} strokeWidth={1.5} />
                )}
              </button>
              <button
                style={{
                  ...skinActionStyle(`del-${skin.id}`),
                  color:
                    hoveredBtn === `del-${skin.id}` ? "#EF4444" : "#6C6C7A",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSkins((prev) => prev.filter((s) => s.id !== skin.id));
                }}
                onMouseEnter={() => setHoveredBtn(`del-${skin.id}`)}
                onMouseLeave={() => setHoveredBtn(null)}
                title="Delete"
              >
                <Trash2 size={14} strokeWidth={1.5} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SkinsPage;
