import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import type {
  Account,
  Instance,
  DownloadProgress,
  ModInfo,
  ModrinthSearchResult,
  JavaRuntime,
  LoaderVersion,
  DeviceCodeInfo,
  GameStatus,
  GameLog,
  LauncherSettings,
  CreateInstancePayload,
  UpdateInstancePayload,
} from "./types";

// ==========================================
// Account Commands
// ==========================================

export async function getAccounts(): Promise<Account[]> {
  return invoke<Account[]>("get_accounts");
}

export async function getActiveAccount(): Promise<Account | null> {
  return invoke<Account | null>("get_active_account");
}

export async function setActiveAccount(accountId: string): Promise<void> {
  return invoke<void>("set_active_account", { accountId });
}

export async function loginMicrosoft(): Promise<DeviceCodeInfo> {
  return invoke<DeviceCodeInfo>("login_microsoft");
}

export async function pollMicrosoftAuth(deviceCode: string): Promise<Account> {
  return invoke<Account>("poll_microsoft_auth", { deviceCode });
}

export async function loginOffline(username: string): Promise<Account> {
  return invoke<Account>("login_offline", { username });
}

export async function removeAccount(accountId: string): Promise<void> {
  return invoke<void>("remove_account", { accountId });
}

export async function refreshAccount(accountId: string): Promise<Account> {
  return invoke<Account>("refresh_account", { accountId });
}

// ==========================================
// Instance Commands
// ==========================================

export async function getInstances(): Promise<Instance[]> {
  return invoke<Instance[]>("get_instances");
}

export async function getInstance(id: string): Promise<Instance | null> {
  return invoke<Instance | null>("get_instance", { id });
}

export async function getActiveInstance(): Promise<Instance | null> {
  return invoke<Instance | null>("get_active_instance");
}

export async function setActiveInstance(id: string): Promise<void> {
  return invoke<void>("set_active_instance", { id });
}

export async function createInstance(payload: CreateInstancePayload): Promise<Instance> {
  return invoke<Instance>("create_instance", { payload });
}

export async function updateInstance(payload: UpdateInstancePayload): Promise<Instance> {
  return invoke<Instance>("update_instance", { payload });
}

export async function deleteInstance(id: string): Promise<void> {
  return invoke<void>("delete_instance", { id });
}

export async function openInstanceFolder(id: string): Promise<void> {
  return invoke<void>("open_instance_folder", { id });
}

// ==========================================
// Game Launch & Status
// ==========================================

export async function launchInstance(id: string): Promise<void> {
  return invoke<void>("launch_instance", { id });
}

export async function killInstance(id: string): Promise<void> {
  return invoke<void>("kill_instance", { id });
}

export async function getGameStatus(instanceId?: string): Promise<GameStatus> {
  return invoke<GameStatus>("get_game_status", { instanceId });
}

// ==========================================
// Version & Loader Management
// ==========================================

export async function getMinecraftVersions(): Promise<string[]> {
  return invoke<string[]>("get_minecraft_versions");
}

export async function getLoaderVersions(loader: string, gameVersion: string): Promise<LoaderVersion[]> {
  return invoke<LoaderVersion[]>("get_loader_versions", { loader, gameVersion });
}

// ==========================================
// Java Runtimes
// ==========================================

export async function detectJavaRuntimes(): Promise<JavaRuntime[]> {
  return invoke<JavaRuntime[]>("detect_java_runtimes");
}

export async function validateJavaPath(path: string): Promise<JavaRuntime> {
  return invoke<JavaRuntime>("validate_java_path", { path });
}

// ==========================================
// Mod Management
// ==========================================

export async function getInstalledMods(instanceId: string): Promise<ModInfo[]> {
  return invoke<ModInfo[]>("get_installed_mods", { instanceId });
}

export async function toggleMod(instanceId: string, modFileName: string, enabled: boolean): Promise<void> {
  return invoke<void>("toggle_mod", { instanceId, modFileName, enabled });
}

export async function deleteMod(instanceId: string, modFileName: string): Promise<void> {
  return invoke<void>("delete_mod", { instanceId, modFileName });
}

export async function searchModrinth(
  query: string,
  options?: { facets?: string; index?: string; limit?: number }
): Promise<ModrinthSearchResult[]> {
  return invoke<ModrinthSearchResult[]>("search_modrinth", { query, options });
}

export async function installMod(instanceId: string, versionId: string): Promise<void> {
  return invoke<void>("install_mod", { instanceId, versionId });
}

// ==========================================
// Settings & System
// ==========================================

export async function getSettings(): Promise<LauncherSettings> {
  return invoke<LauncherSettings>("get_settings");
}

export async function saveSettings(settings: LauncherSettings): Promise<void> {
  return invoke<void>("save_settings", { settings });
}

export async function getOnlinePlayers(): Promise<number> {
  return invoke<number>("get_online_players");
}

// ==========================================
// Window Controls
// ==========================================

export async function windowMinimize(): Promise<void> {
  return invoke<void>("window_minimize");
}

export async function windowMaximize(): Promise<void> {
  return invoke<void>("window_maximize");
}

export async function windowClose(): Promise<void> {
  return invoke<void>("window_close");
}

// ==========================================
// Event Listeners
// ==========================================

export function onDownloadProgress(callback: (progress: DownloadProgress) => void): Promise<UnlistenFn> {
  return listen<DownloadProgress>("download:progress", (event) => callback(event.payload));
}

export function onGameLog(callback: (log: GameLog) => void): Promise<UnlistenFn> {
  return listen<GameLog>("game:log", (event) => callback(event.payload));
}

export function onGameStatus(callback: (status: GameStatus) => void): Promise<UnlistenFn> {
  return listen<GameStatus>("game:status", (event) => callback(event.payload));
}

export function onDeviceCode(callback: (info: DeviceCodeInfo) => void): Promise<UnlistenFn> {
  return listen<DeviceCodeInfo>("auth:device_code", (event) => callback(event.payload));
}
