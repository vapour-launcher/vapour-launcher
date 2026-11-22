import React from "react";
import TopBar from "../components/TopBar";
import HeroSection from "../components/HeroSection";
import SkinViewer from "../components/SkinViewer";
import BottomBar from "../components/BottomBar";

const HomePage: React.FC = () => {
  const containerStyle: React.CSSProperties = {
    position: "relative",
    width: "100%",
    height: "100vh",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
  };

  const backgroundStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    backgroundImage:
      "url('https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=1920&q=80')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    zIndex: 0,
  };

  const gradientOverlayStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    background: `
      linear-gradient(to right, 
        rgba(17, 18, 23, 0.95) 0%, 
        rgba(17, 18, 23, 0.85) 25%, 
        rgba(17, 18, 23, 0.6) 50%, 
        rgba(17, 18, 23, 0.3) 75%, 
        rgba(17, 18, 23, 0.15) 100%
      ),
      linear-gradient(to top, 
        rgba(17, 18, 23, 0.9) 0%, 
        rgba(17, 18, 23, 0.1) 30%, 
        transparent 50%
      ),
      linear-gradient(to bottom, 
        rgba(17, 18, 23, 0.6) 0%, 
        transparent 20%
      )
    `,
    zIndex: 1,
  };

  const contentStyle: React.CSSProperties = {
    position: "relative",
    zIndex: 2,
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    marginLeft: 64,
  };

  return (
    <div style={containerStyle}>
      {/* Background with Dark Forest Landscape */}
      <div style={backgroundStyle} />
      <div style={gradientOverlayStyle} />

      {/* Top Floating Glass Pills Bar */}
      <TopBar />

      {/* Center Hero & 3D Minecraft Character */}
      <div style={contentStyle}>
        <HeroSection />
        <SkinViewer />
      </div>

      {/* Bottom Floating Bar */}
      <BottomBar />
    </div>
  );
};

export default HomePage;
