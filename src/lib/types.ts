export type AccountType = 'microsoft' | 'offline' | 'mojang';

export interface Account {
  id: string;
  username: string;
  uuid: string;
  account_type: AccountType;
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  skin_url?: string;
  cape_url?: string;
  is_active: boolean;
}

export type LoaderType = 'vanilla' | 'fabric' | 'forge' | 'neoforge' | 'quilt';

export interface Instance {
  id: string;
  name: string;
  minecraft_version: string;
  loader_type: LoaderType;
  loader_version?: string;
  icon?: string;
  banner?: string;
  java_path?: string;
  jvm_args?: string[];
  memory_min?: number; // in MB
  memory_max?: number; // in MB
  window_width?: number;
  window_height?: number;
  created_at: string | number;
  last_played?: string | number;
  play_time_seconds?: number;
  path?: string;
  mod_count?: number;
  is_active?: boolean;
}

export type DownloadStatus = 'downloading' | 'extracting' | 'verifying' | 'completed' | 'failed';

export interface DownloadProgress {
  task_id: string;
  file_name: string;
  current_bytes: number;
  total_bytes: number;
  percentage: number; // 0 to 100
  status: DownloadStatus;
  error?: string;
}

export interface ModInfo {
  id: string;
  name: string;
  version: string;
  file_name: string;
  enabled: boolean;
  description?: string;
  authors?: string[];
  icon_url?: string;
  modrinth_id?: string;
  curseforge_id?: string;
  dependencies?: string[];
  file_size?: number;
  update_available?: boolean;
  latest_version?: string;
}

export interface ModrinthSearchResult {
  project_id: string;
  project_type: 'mod' | 'modpack' | 'resourcepack' | 'shader';
  slug: string;
  author: string;
  title: string;
  description: string;
  categories: string[];
  client_side: 'required' | 'optional' | 'unsupported';
  server_side: 'required' | 'optional' | 'unsupported';
  downloads: number;
  follows: number;
  icon_url?: string;
  latest_version?: string;
  versions?: string[];
  gallery?: string[];
}

export interface JavaRuntime {
  path: string;
  version: string;
  major_version: number;
  arch: string;
  is_valid: boolean;
  vendor?: string;
}

export interface LoaderVersion {
  loader: LoaderType;
  version: string;
  stable: boolean;
  build?: number;
  minecraft_version: string;
}

export interface DeviceCodeInfo {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
  message: string;
}

export type GameState = 'idle' | 'checking' | 'downloading' | 'launching' | 'running' | 'crashed' | 'finished';

export interface GameStatus {
  instance_id: string;
  state: GameState;
  exit_code?: number;
  error?: string;
}

export interface GameLog {
  instance_id: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: number;
}

export interface LauncherSettings {
  theme?: string;
  close_on_launch?: boolean;
  default_java_path?: string;
  default_memory_max?: number;
  default_memory_min?: number;
  default_jvm_args?: string;
  check_updates?: boolean;
  discord_rpc?: boolean;
  hardware_acceleration?: boolean;
}

export interface CreateInstancePayload {
  name: string;
  minecraft_version: string;
  loader_type: LoaderType;
  loader_version?: string;
  icon?: string;
  memory_min?: number;
  memory_max?: number;
}

export interface UpdateInstancePayload {
  id: string;
  name?: string;
  minecraft_version?: string;
  loader_type?: LoaderType;
  loader_version?: string;
  icon?: string;
  java_path?: string;
  jvm_args?: string[];
  memory_min?: number;
  memory_max?: number;
}
