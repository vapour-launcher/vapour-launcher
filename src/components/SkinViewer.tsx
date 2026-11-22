import React, { useRef, useEffect } from "react";
import { SkinViewer as SkinViewerCanvas, IdleAnimation } from "skinview3d";

const SkinViewer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewerRef = useRef<SkinViewerCanvas | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const viewer = new SkinViewerCanvas({
      canvas: canvasRef.current,
      width: 380,
      height: 480,
      skin: "https://crafatar.com/skins/c06f89064c8a49119c29ea1dbd1aab82",
      cape: undefined,
    });

    viewer.fov = 50;
    viewer.zoom = 0.92;
    viewer.autoRotate = true;
    viewer.autoRotateSpeed = 0.5;
    viewer.animation = new IdleAnimation();
    viewer.animation.speed = 0.6;

    viewer.playerObject.rotation.x = 0.05;
    viewer.playerObject.rotation.y = 0.3;

    viewer.background = null as unknown as string;

    viewerRef.current = viewer;

    return () => {
      viewer.dispose();
      viewerRef.current = null;
    };
  }, []);

  const wrapperStyle: React.CSSProperties = {
    position: "absolute",
    right: 60,
    top: "50%",
    transform: "translateY(-50%)",
    width: 380,
    height: 480,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    pointerEvents: "none",
  };

  const canvasStyle: React.CSSProperties = {
    width: 380,
    height: 480,
    pointerEvents: "auto",
    filter: "drop-shadow(0 20px 60px rgba(0, 0, 0, 0.5))",
  };

  const glowStyle: React.CSSProperties = {
    position: "absolute",
    bottom: -20,
    left: "50%",
    transform: "translateX(-50%)",
    width: 200,
    height: 40,
    background:
      "radial-gradient(ellipse, rgba(124, 114, 255, 0.15) 0%, transparent 70%)",
    borderRadius: "50%",
    pointerEvents: "none",
  };

  return (
    <div style={wrapperStyle}>
      <canvas ref={canvasRef} style={canvasStyle} />
      <div style={glowStyle} />
    </div>
  );
};

export default SkinViewer;
