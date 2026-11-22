# Vapour Launcher 🎮✨

A high-performance, glassmorphic desktop Minecraft launcher built with **Rust** and **Tauri v2**, featuring an ultra-clean dark theme UI (#111217 base with #7C72FF periwinkle-violet accents), multi-instance isolation, 3D WebGL skin viewing, and automated CI/CD builds.

---

## ✨ Features & Architecture

### 1. ⚡ Rust Backend Engine (`src-tauri`)
* **Multi-Instance Manager**: Creates, isolates, duplicates, updates, and deletes instances inside the OS application directory (`~/.local/share/vapour-launcher/instances/`), separating `.minecraft` saves, mods, resourcepacks, and shaderpacks.
* **Async Download & Verification**: High-throughput parallelized asset and library fetcher using `reqwest` + `tokio`, verifying integrity via `sha1` checksums.
* **Authentication Engine**:
  * **Microsoft OAuth**: Device code & PKCE authentication flow with token exchange (Xbox Live, XSTS, Minecraft Services).
  * **Offline Mode**: Quick custom username generation with deterministic offline UUIDs.
* **Mod & Shader Manager**:
  * Direct `.jar` toggling (`.jar` <-> `.jar.disabled`).
  * Direct Modrinth API v2 integration for search and one-click modpack / mod installations.
* **Java Runtime Auto-Detection**: Scans system paths (`/usr/lib/jvm`, SDKMAN, Adoptium, `JAVA_HOME`) and automatically matches Java requirements based on Minecraft version (Java 8, 17, or 21+).
* **Launch & Process Streamer**: Spawns game instances with custom memory allocation (`-Xms`, `-Xmx`), JVM flags, and streams `stdout`/`stderr` live to the built-in Console Drawer.

---

## 🚀 Building on GitHub Actions (No Local Setup Required)

This repository includes a pre-configured GitHub Actions workflow (`.github/workflows/build.yml`) that automatically builds release binaries for Linux and Windows.

### To build the release installers:
1. Initialize git and commit:
   ```bash
   git init
   git add .
   git commit -m "feat: complete vapour launcher codebase"
   ```
2. Push to your GitHub repository:
   ```bash
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git branch -M main
   git push -u origin main
   ```
3. Create and push a version tag to trigger the automatic build and release:
   ```bash
   git tag v0.8.4
   git push origin v0.8.4
   ```
4. GitHub Actions will build:
   * **Linux**: `.AppImage`, `.deb`, `.rpm`
   * **Windows**: `.exe` (NSIS installer), `.msi` (WiX installer)
   * The artifacts will automatically appear under **Releases** on your GitHub repository!

---

## 🛠️ Local Development (Optional)

If you have Node.js and Rust installed on your machine and wish to run locally:

```bash
# 1. Install frontend dependencies
npm install

# 2. Run in development mode (starts Vite dev server and Tauri window)
npm run tauri dev

# 3. Build release binaries locally
npm run tauri build
```

---

## 📂 Project Structure

```text
vapour-launcher/
├── .github/
│   └── workflows/
│       └── build.yml               # GitHub Actions CI/CD matrix build
├── src/                            # Frontend (React + TypeScript + Vite)
│   ├── assets/                     # UI graphics & icons
│   ├── components/                 # TitleBar, IconRail, TopBar, HeroSection,
│   │                               # SkinViewer, BottomBar, ModManager, ConsoleDrawer
│   ├── pages/                      # HomePage, InstancesPage, SkinsPage, SettingsPage, ChangelogPage
│   ├── lib/                        # Tauri IPC commands, types, and custom React hooks
│   ├── styles/                     # global.css design tokens & glassmorphism utilities
│   ├── App.tsx                     # Main layout router and modal controllers
│   └── main.tsx                    # React DOM entry point
├── src-tauri/                       # Rust Backend (Tauri v2)
│   ├── Cargo.toml                  # Rust dependencies (tokio, reqwest, sha1, serde...)
│   ├── tauri.conf.json             # Tauri configuration (frameless, transparent, CSP)
│   ├── capabilities/               # Tauri v2 permission capabilities
│   └── src/
│       ├── main.rs                 # Native binary entry
│       ├── lib.rs                  # Command handler registry
│       ├── auth/                   # Microsoft OAuth & offline account store
│       ├── download/               # Async version manifest & asset downloader
│       ├── instances/              # Multi-instance CRUD & isolation
│       ├── java/                   # Cross-platform Java runtime scanner
│       ├── launch/                 # Minecraft process spawner & log streamer
│       ├── loaders/                # Fabric, Quilt, Forge, NeoForge installers
│       └── mods_manager/           # Mod toggler & Modrinth search/install engine
├── package.json                    # Frontend dependencies
├── vite.config.ts                  # Vite build configuration
├── tsconfig.json                   # TypeScript configuration
└── README.md                       # Documentation
```
