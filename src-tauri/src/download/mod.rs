use serde::{Deserialize, Serialize};
use sha1::{Digest, Sha1};
use std::fs;
use std::io::Write;
use std::path::PathBuf;
use tauri::Emitter;
use tokio::sync::Semaphore;
use std::sync::Arc;
use std::sync::atomic::{AtomicU64, Ordering};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct DownloadProgress {
    pub total_files: u64,
    pub completed_files: u64,
    pub current_file: String,
    pub bytes_downloaded: u64,
    pub total_bytes: u64,
    pub speed_bps: u64,
}

// --- Mojang version manifest structs ---

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct VersionManifest {
    pub latest: LatestVersions,
    pub versions: Vec<VersionEntry>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct LatestVersions {
    pub release: String,
    pub snapshot: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct VersionEntry {
    pub id: String,
    #[serde(rename = "type")]
    pub version_type: String,
    pub url: String,
    pub time: String,
    #[serde(rename = "releaseTime")]
    pub release_time: String,
    pub sha1: Option<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct VersionDetail {
    pub id: String,
    #[serde(rename = "type")]
    pub version_type: Option<String>,
    #[serde(rename = "mainClass")]
    pub main_class: Option<String>,
    #[serde(rename = "minecraftArguments")]
    pub minecraft_arguments: Option<String>,
    pub arguments: Option<ArgumentsSpec>,
    pub libraries: Option<Vec<Library>>,
    pub downloads: Option<VersionDownloads>,
    #[serde(rename = "assetIndex")]
    pub asset_index: Option<AssetIndex>,
    pub assets: Option<String>,
    #[serde(rename = "javaVersion")]
    pub java_version: Option<JavaVersionSpec>,
    #[serde(rename = "inheritsFrom")]
    pub inherits_from: Option<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct JavaVersionSpec {
    pub component: Option<String>,
    #[serde(rename = "majorVersion")]
    pub major_version: Option<u32>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ArgumentsSpec {
    pub game: Option<Vec<serde_json::Value>>,
    pub jvm: Option<Vec<serde_json::Value>>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Library {
    pub name: String,
    pub downloads: Option<LibraryDownloads>,
    pub url: Option<String>,
    pub rules: Option<Vec<Rule>>,
    pub natives: Option<serde_json::Value>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Rule {
    pub action: String,
    pub os: Option<OsRule>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct OsRule {
    pub name: Option<String>,
    pub arch: Option<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct LibraryDownloads {
    pub artifact: Option<LibraryArtifact>,
    pub classifiers: Option<serde_json::Value>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct LibraryArtifact {
    pub path: Option<String>,
    pub sha1: Option<String>,
    pub size: Option<u64>,
    pub url: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct VersionDownloads {
    pub client: Option<DownloadInfo>,
    pub server: Option<DownloadInfo>,
    pub client_mappings: Option<DownloadInfo>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct DownloadInfo {
    pub sha1: Option<String>,
    pub size: Option<u64>,
    pub url: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct AssetIndex {
    pub id: String,
    pub sha1: Option<String>,
    pub size: Option<u64>,
    #[serde(rename = "totalSize")]
    pub total_size: Option<u64>,
    pub url: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct AssetObjects {
    pub objects: std::collections::HashMap<String, AssetObject>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct AssetObject {
    pub hash: String,
    pub size: u64,
}

const VERSION_MANIFEST_URL: &str = "https://piston-meta.mojang.com/mc/game/version_manifest_v2.json";
const ASSET_BASE_URL: &str = "https://resources.download.minecraft.net";

fn get_game_dir(app: &tauri::AppHandle) -> PathBuf {
    app.path_resolver()
        .app_data_dir()
        .unwrap_or_else(|| {
            dirs::data_dir()
                .unwrap_or_else(|| PathBuf::from("."))
                .join("vapour-launcher")
        })
}

fn get_versions_dir(app: &tauri::AppHandle) -> PathBuf {
    get_game_dir(app).join("versions")
}

fn get_libraries_dir(app: &tauri::AppHandle) -> PathBuf {
    get_game_dir(app).join("libraries")
}

fn get_assets_dir(app: &tauri::AppHandle) -> PathBuf {
    get_game_dir(app).join("assets")
}

fn verify_sha1(path: &PathBuf, expected: &str) -> bool {
    if let Ok(data) = fs::read(path) {
        let mut hasher = Sha1::new();
        hasher.update(&data);
        let result = hex::encode(hasher.finalize());
        result == expected
    } else {
        false
    }
}

fn get_current_os() -> &'static str {
    if cfg!(target_os = "windows") {
        "windows"
    } else if cfg!(target_os = "macos") {
        "osx"
    } else {
        "linux"
    }
}

fn should_use_library(lib: &Library) -> bool {
    let current_os = get_current_os();
    match &lib.rules {
        None => true,
        Some(rules) => {
            let mut allowed = false;
            for rule in rules {
                let os_matches = match &rule.os {
                    None => true,
                    Some(os_rule) => match &os_rule.name {
                        None => true,
                        Some(name) => name == current_os,
                    },
                };
                if os_matches {
                    allowed = rule.action == "allow";
                }
            }
            allowed
        }
    }
}

fn library_path_from_name(name: &str) -> String {
    // Maven coordinate: group:artifact:version
    let parts: Vec<&str> = name.split(':').collect();
    if parts.len() >= 3 {
        let group = parts[0].replace('.', "/");
        let artifact = parts[1];
        let version = parts[2];
        format!(
            "{}/{}/{}/{}-{}.jar",
            group, artifact, version, artifact, version
        )
    } else {
        name.replace(':', "/") + ".jar"
    }
}

#[tauri::command]
pub async fn fetch_version_manifest() -> Result<VersionManifest, String> {
    let client = reqwest::Client::new();
    let resp = client
        .get(VERSION_MANIFEST_URL)
        .send()
        .await
        .map_err(|e| format!("Failed to fetch version manifest: {}", e))?;

    let manifest: VersionManifest = resp
        .json()
        .await
        .map_err(|e| format!("Failed to parse version manifest: {}", e))?;

    Ok(manifest)
}

#[tauri::command]
pub async fn download_version(version_id: String, app: tauri::AppHandle) -> Result<(), String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(300))
        .build()
        .map_err(|e| e.to_string())?;

    // Fetch version manifest to get the version URL
    let manifest: VersionManifest = client
        .get(VERSION_MANIFEST_URL)
        .send()
        .await
        .map_err(|e| format!("Failed to fetch manifest: {}", e))?
        .json()
        .await
        .map_err(|e| e.to_string())?;

    let version_entry = manifest
        .versions
        .iter()
        .find(|v| v.id == version_id)
        .ok_or_else(|| format!("Version '{}' not found", version_id))?;

    // Fetch version detail JSON
    let version_detail: VersionDetail = client
        .get(&version_entry.url)
        .send()
        .await
        .map_err(|e| format!("Failed to fetch version detail: {}", e))?
        .json()
        .await
        .map_err(|e| e.to_string())?;

    // Save version JSON
    let version_dir = get_versions_dir(&app).join(&version_id);
    fs::create_dir_all(&version_dir).map_err(|e| e.to_string())?;
    let version_json_path = version_dir.join(format!("{}.json", version_id));
    let version_json = serde_json::to_string_pretty(&version_detail).map_err(|e| e.to_string())?;
    fs::write(&version_json_path, &version_json).map_err(|e| e.to_string())?;

    // Collect all download tasks
    let mut download_tasks: Vec<(String, PathBuf, Option<String>, u64)> = Vec::new();

    // 1. Client JAR
    if let Some(ref downloads) = version_detail.downloads {
        if let Some(ref client_dl) = downloads.client {
            let jar_path = version_dir.join(format!("{}.jar", version_id));
            let should_download = if let Some(ref sha) = client_dl.sha1 {
                !jar_path.exists() || !verify_sha1(&jar_path, sha)
            } else {
                !jar_path.exists()
            };
            if should_download {
                download_tasks.push((
                    client_dl.url.clone(),
                    jar_path,
                    client_dl.sha1.clone(),
                    client_dl.size.unwrap_or(0),
                ));
            }
        }
    }

    // 2. Libraries
    let libraries_dir = get_libraries_dir(&app);
    if let Some(ref libs) = version_detail.libraries {
        for lib in libs {
            if !should_use_library(lib) {
                continue;
            }

            if let Some(ref dl) = lib.downloads {
                if let Some(ref artifact) = dl.artifact {
                    let lib_path = match &artifact.path {
                        Some(p) => libraries_dir.join(p),
                        None => libraries_dir.join(library_path_from_name(&lib.name)),
                    };
                    let should_download = if let Some(ref sha) = artifact.sha1 {
                        !lib_path.exists() || !verify_sha1(&lib_path, sha)
                    } else {
                        !lib_path.exists()
                    };
                    if should_download {
                        download_tasks.push((
                            artifact.url.clone(),
                            lib_path,
                            artifact.sha1.clone(),
                            artifact.size.unwrap_or(0),
                        ));
                    }
                }
            } else if let Some(ref base_url) = lib.url {
                // Fabric/Quilt style: construct URL from maven name
                let rel_path = library_path_from_name(&lib.name);
                let lib_path = libraries_dir.join(&rel_path);
                if !lib_path.exists() {
                    let url = format!("{}{}", base_url.trim_end_matches('/'), &format!("/{}", rel_path));
                    download_tasks.push((url, lib_path, None, 0));
                }
            } else {
                // Fallback to Maven Central
                let rel_path = library_path_from_name(&lib.name);
                let lib_path = libraries_dir.join(&rel_path);
                if !lib_path.exists() {
                    let url = format!("https://repo1.maven.org/maven2/{}", rel_path);
                    download_tasks.push((url, lib_path, None, 0));
                }
            }
        }
    }

    // 3. Assets
    if let Some(ref asset_index) = version_detail.asset_index {
        let assets_dir = get_assets_dir(&app);
        let indexes_dir = assets_dir.join("indexes");
        fs::create_dir_all(&indexes_dir).map_err(|e| e.to_string())?;

        let index_path = indexes_dir.join(format!("{}.json", asset_index.id));
        let index_should_download = if let Some(ref sha) = asset_index.sha1 {
            !index_path.exists() || !verify_sha1(&index_path, sha)
        } else {
            !index_path.exists()
        };

        if index_should_download {
            let index_data = client
                .get(&asset_index.url)
                .send()
                .await
                .map_err(|e| format!("Failed to fetch asset index: {}", e))?
                .bytes()
                .await
                .map_err(|e| e.to_string())?;
            fs::write(&index_path, &index_data).map_err(|e| e.to_string())?;
        }

        // Parse asset index
        let index_text = fs::read_to_string(&index_path).map_err(|e| e.to_string())?;
        let asset_objects: AssetObjects =
            serde_json::from_str(&index_text).map_err(|e| e.to_string())?;

        let objects_dir = assets_dir.join("objects");
        for (_name, obj) in &asset_objects.objects {
            let hash_prefix = &obj.hash[..2];
            let obj_path = objects_dir.join(hash_prefix).join(&obj.hash);
            if !obj_path.exists() || !verify_sha1(&obj_path, &obj.hash) {
                let url = format!("{}/{}/{}", ASSET_BASE_URL, hash_prefix, obj.hash);
                download_tasks.push((url, obj_path, Some(obj.hash.clone()), obj.size));
            }
        }
    }

    // Calculate total
    let total_files = download_tasks.len() as u64;
    let total_bytes: u64 = download_tasks.iter().map(|(_, _, _, s)| *s).sum();

    if total_files == 0 {
        let _ = app.emit(
            "download:progress",
            DownloadProgress {
                total_files: 0,
                completed_files: 0,
                current_file: "Already up to date".to_string(),
                bytes_downloaded: 0,
                total_bytes: 0,
                speed_bps: 0,
            },
        );
        return Ok(());
    }

    // Parallel download with semaphore
    let semaphore = Arc::new(Semaphore::new(8));
    let completed = Arc::new(AtomicU64::new(0));
    let bytes_done = Arc::new(AtomicU64::new(0));
    let start_time = std::time::Instant::now();

    let mut handles = Vec::new();

    for (url, path, sha1, _size) in download_tasks {
        let sem = semaphore.clone();
        let client = client.clone();
        let completed = completed.clone();
        let bytes_done = bytes_done.clone();
        let app = app.clone();
        let total_files = total_files;
        let total_bytes = total_bytes;
        let start_time = start_time;

        let handle = tokio::spawn(async move {
            let _permit = sem.acquire().await.map_err(|e| e.to_string())?;

            // Create parent directory
            if let Some(parent) = path.parent() {
                fs::create_dir_all(parent).map_err(|e| e.to_string())?;
            }

            let filename = path
                .file_name()
                .map(|f| f.to_string_lossy().to_string())
                .unwrap_or_else(|| "unknown".to_string());

            // Download with retries
            let mut attempts = 0;
            let max_attempts = 3;
            loop {
                attempts += 1;
                match client.get(&url).send().await {
                    Ok(resp) => {
                        if !resp.status().is_success() {
                            if attempts >= max_attempts {
                                return Err(format!(
                                    "Failed to download {} (HTTP {})",
                                    url,
                                    resp.status()
                                ));
                            }
                            tokio::time::sleep(std::time::Duration::from_secs(1)).await;
                            continue;
                        }
                        let data = resp.bytes().await.map_err(|e| e.to_string())?;

                        // Write to file
                        let mut file = fs::File::create(&path).map_err(|e| e.to_string())?;
                        file.write_all(&data).map_err(|e| e.to_string())?;

                        // Verify SHA1 if provided
                        if let Some(ref expected_sha) = sha1 {
                            if !verify_sha1(&path, expected_sha) {
                                if attempts >= max_attempts {
                                    return Err(format!(
                                        "SHA1 verification failed for {}",
                                        filename
                                    ));
                                }
                                tokio::time::sleep(std::time::Duration::from_secs(1)).await;
                                continue;
                            }
                        }

                        let file_size = data.len() as u64;
                        let done = completed.fetch_add(1, Ordering::SeqCst) + 1;
                        let bd = bytes_done.fetch_add(file_size, Ordering::SeqCst) + file_size;
                        let elapsed = start_time.elapsed().as_secs_f64();
                        let speed = if elapsed > 0.0 {
                            (bd as f64 / elapsed) as u64
                        } else {
                            0
                        };

                        let _ = app.emit(
                            "download:progress",
                            DownloadProgress {
                                total_files,
                                completed_files: done,
                                current_file: filename,
                                bytes_downloaded: bd,
                                total_bytes,
                                speed_bps: speed,
                            },
                        );

                        return Ok(());
                    }
                    Err(e) => {
                        if attempts >= max_attempts {
                            return Err(format!("Failed to download {}: {}", url, e));
                        }
                        tokio::time::sleep(std::time::Duration::from_secs(1)).await;
                    }
                }
            }
        });

        handles.push(handle);
    }

    // Wait for all downloads
    for handle in handles {
        handle
            .await
            .map_err(|e| format!("Download task panicked: {}", e))?
            .map_err(|e| format!("Download failed: {}", e))?;
    }

    Ok(())
}
