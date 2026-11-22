use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ModInfo {
    pub filename: String,
    pub name: String,
    pub enabled: bool,
    pub version: Option<String>,
    pub mod_id: Option<String>,
    pub source: Option<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ModrinthSearchResult {
    pub hits: Vec<ModrinthProject>,
    pub offset: u32,
    pub limit: u32,
    pub total_hits: u32,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ModrinthProject {
    pub project_id: Option<String>,
    pub slug: Option<String>,
    pub title: String,
    pub description: String,
    pub author: Option<String>,
    pub icon_url: Option<String>,
    pub downloads: Option<u64>,
    pub versions: Option<Vec<String>>,
    pub categories: Option<Vec<String>>,
    pub project_type: Option<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ModrinthVersion {
    pub id: String,
    pub name: String,
    pub version_number: String,
    pub game_versions: Vec<String>,
    pub loaders: Vec<String>,
    pub files: Vec<ModrinthFile>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ModrinthFile {
    pub url: String,
    pub filename: String,
    pub primary: Option<bool>,
    pub size: u64,
    pub hashes: Option<ModrinthHashes>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ModrinthHashes {
    pub sha1: Option<String>,
    pub sha512: Option<String>,
}

fn get_mods_dir(_app: &tauri::AppHandle, instance_id: &str) -> PathBuf {
    let data_dir = dirs::data_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("vapour-launcher");
    data_dir
        .join("instances")
        .join(instance_id)
        .join(".minecraft")
        .join("mods")
}

fn extract_mod_info_from_filename(filename: &str) -> ModInfo {
    let enabled = !filename.ends_with(".disabled");
    let display_name = filename
        .trim_end_matches(".disabled")
        .trim_end_matches(".jar")
        .replace('-', " ")
        .replace('_', " ");

    ModInfo {
        filename: filename.to_string(),
        name: display_name,
        enabled,
        version: None,
        mod_id: None,
        source: None,
    }
}

fn try_read_fabric_mod_json(jar_path: &PathBuf) -> Option<(String, Option<String>, Option<String>)> {
    let file = fs::File::open(jar_path).ok()?;
    let mut archive = zip::ZipArchive::new(file).ok()?;

    // Try fabric.mod.json
    if let Ok(mut entry) = archive.by_name("fabric.mod.json") {
        let mut contents = String::new();
        std::io::Read::read_to_string(&mut entry, &mut contents).ok()?;
        let json: serde_json::Value = serde_json::from_str(&contents).ok()?;
        let name = json["name"].as_str().unwrap_or("").to_string();
        let version = json["version"].as_str().map(|s| s.to_string());
        let mod_id = json["id"].as_str().map(|s| s.to_string());
        if !name.is_empty() {
            return Some((name, version, mod_id));
        }
    }

    // Try quilt.mod.json
    if let Ok(mut entry) = archive.by_name("quilt.mod.json") {
        let mut contents = String::new();
        std::io::Read::read_to_string(&mut entry, &mut contents).ok()?;
        let json: serde_json::Value = serde_json::from_str(&contents).ok()?;
        let name = json["quilt_loader"]["metadata"]["name"]
            .as_str()
            .unwrap_or("")
            .to_string();
        let version = json["quilt_loader"]["version"].as_str().map(|s| s.to_string());
        let mod_id = json["quilt_loader"]["id"].as_str().map(|s| s.to_string());
        if !name.is_empty() {
            return Some((name, version, mod_id));
        }
    }

    // Try META-INF/mods.toml (Forge/NeoForge)
    if let Ok(mut entry) = archive.by_name("META-INF/mods.toml") {
        let mut contents = String::new();
        std::io::Read::read_to_string(&mut entry, &mut contents).ok()?;
        // Simple extraction: look for displayName and version
        let mut name = String::new();
        let mut version = None;
        let mut mod_id = None;
        for line in contents.lines() {
            let trimmed = line.trim();
            if trimmed.starts_with("displayName") {
                if let Some(val) = trimmed.split('=').nth(1) {
                    name = val.trim().trim_matches('"').to_string();
                }
            }
            if trimmed.starts_with("version") && version.is_none() {
                if let Some(val) = trimmed.split('=').nth(1) {
                    version = Some(val.trim().trim_matches('"').to_string());
                }
            }
            if trimmed.starts_with("modId") && mod_id.is_none() {
                if let Some(val) = trimmed.split('=').nth(1) {
                    mod_id = Some(val.trim().trim_matches('"').to_string());
                }
            }
        }
        if !name.is_empty() {
            return Some((name, version, mod_id));
        }
    }

    None
}

#[tauri::command]
pub async fn list_mods(instance_id: String, app: tauri::AppHandle) -> Result<Vec<ModInfo>, String> {
    let mods_dir = get_mods_dir(&app, &instance_id);
    if !mods_dir.exists() {
        return Ok(Vec::new());
    }

    let mut mods = Vec::new();
    let entries = fs::read_dir(&mods_dir).map_err(|e| e.to_string())?;

    for entry in entries.flatten() {
        let filename = entry.file_name().to_string_lossy().to_string();
        if !filename.ends_with(".jar") && !filename.ends_with(".jar.disabled") {
            continue;
        }

        let mut mod_info = extract_mod_info_from_filename(&filename);

        // Try to read mod metadata from JAR
        let jar_path = entry.path();
        if let Some((name, version, mod_id)) = try_read_fabric_mod_json(&jar_path) {
            mod_info.name = name;
            mod_info.version = version;
            mod_info.mod_id = mod_id;
        }

        mods.push(mod_info);
    }

    mods.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    Ok(mods)
}

#[tauri::command]
pub async fn toggle_mod(
    instance_id: String,
    filename: String,
    app: tauri::AppHandle,
) -> Result<ModInfo, String> {
    let mods_dir = get_mods_dir(&app, &instance_id);
    let current_path = mods_dir.join(&filename);

    if !current_path.exists() {
        return Err(format!("Mod file '{}' not found", filename));
    }

    let new_filename = if filename.ends_with(".disabled") {
        // Enable: remove .disabled
        filename.trim_end_matches(".disabled").to_string()
    } else {
        // Disable: add .disabled
        format!("{}.disabled", filename)
    };

    let new_path = mods_dir.join(&new_filename);
    fs::rename(&current_path, &new_path).map_err(|e| e.to_string())?;

    let mut mod_info = extract_mod_info_from_filename(&new_filename);
    if let Some((name, version, mod_id)) = try_read_fabric_mod_json(&new_path) {
        mod_info.name = name;
        mod_info.version = version;
        mod_info.mod_id = mod_id;
    }

    Ok(mod_info)
}

#[tauri::command]
pub async fn delete_mod(
    instance_id: String,
    filename: String,
    app: tauri::AppHandle,
) -> Result<(), String> {
    let mods_dir = get_mods_dir(&app, &instance_id);
    let mod_path = mods_dir.join(&filename);

    if !mod_path.exists() {
        return Err(format!("Mod file '{}' not found", filename));
    }

    fs::remove_file(&mod_path).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn import_mod(
    instance_id: String,
    file_path: String,
    app: tauri::AppHandle,
) -> Result<ModInfo, String> {
    let source_path = PathBuf::from(&file_path);
    if !source_path.exists() {
        return Err(format!("Source file '{}' not found", file_path));
    }

    let filename = source_path
        .file_name()
        .ok_or("Invalid file path")?
        .to_string_lossy()
        .to_string();

    let mods_dir = get_mods_dir(&app, &instance_id);
    fs::create_dir_all(&mods_dir).map_err(|e| e.to_string())?;

    let dest_path = mods_dir.join(&filename);
    fs::copy(&source_path, &dest_path).map_err(|e| e.to_string())?;

    let mut mod_info = extract_mod_info_from_filename(&filename);
    if let Some((name, version, mod_id)) = try_read_fabric_mod_json(&dest_path) {
        mod_info.name = name;
        mod_info.version = version;
        mod_info.mod_id = mod_id;
    }

    Ok(mod_info)
}

const MODRINTH_API_BASE: &str = "https://api.modrinth.com/v2";

#[tauri::command]
pub async fn search_modrinth(
    query: String,
    game_version: Option<String>,
    loader: Option<String>,
    offset: Option<u32>,
    limit: Option<u32>,
) -> Result<ModrinthSearchResult, String> {
    let client = reqwest::Client::new();
    let limit = limit.unwrap_or(20);
    let offset = offset.unwrap_or(0);

    let mut url = format!(
        "{}/search?query={}&limit={}&offset={}",
        MODRINTH_API_BASE,
        urlencoding_encode(&query),
        limit,
        offset
    );

    // Build facets
    let mut facets: Vec<String> = Vec::new();
    facets.push("[\"project_type:mod\"]".to_string());
    if let Some(ref gv) = game_version {
        facets.push(format!("[\"versions:{}\"]", gv));
    }
    if let Some(ref l) = loader {
        facets.push(format!("[\"categories:{}\"]", l));
    }

    if !facets.is_empty() {
        url.push_str(&format!("&facets=[{}]", facets.join(",")));
    }

    let resp = client
        .get(&url)
        .header("User-Agent", "vapour-launcher/0.1.0")
        .send()
        .await
        .map_err(|e| format!("Modrinth search failed: {}", e))?;

    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        return Err(format!("Modrinth API error ({}): {}", status, body));
    }

    let result: ModrinthSearchResult = resp
        .json()
        .await
        .map_err(|e| format!("Failed to parse Modrinth response: {}", e))?;

    Ok(result)
}

fn urlencoding_encode(s: &str) -> String {
    let mut result = String::new();
    for c in s.chars() {
        match c {
            'A'..='Z' | 'a'..='z' | '0'..='9' | '-' | '_' | '.' | '~' => {
                result.push(c);
            }
            ' ' => result.push_str("%20"),
            _ => {
                for byte in c.to_string().as_bytes() {
                    result.push_str(&format!("%{:02X}", byte));
                }
            }
        }
    }
    result
}

#[tauri::command]
pub async fn install_from_modrinth(
    instance_id: String,
    project_id: String,
    game_version: String,
    loader: Option<String>,
    app: tauri::AppHandle,
) -> Result<ModInfo, String> {
    let client = reqwest::Client::new();

    // Get project versions
    let mut url = format!(
        "{}/project/{}/version?game_versions=[\"{}\"]",
        MODRINTH_API_BASE, project_id, game_version
    );

    if let Some(ref l) = loader {
        url.push_str(&format!("&loaders=[\"{}\"]", l));
    }

    let resp = client
        .get(&url)
        .header("User-Agent", "vapour-launcher/0.1.0")
        .send()
        .await
        .map_err(|e| format!("Failed to fetch Modrinth versions: {}", e))?;

    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        return Err(format!("Modrinth API error ({}): {}", status, body));
    }

    let versions: Vec<ModrinthVersion> = resp
        .json()
        .await
        .map_err(|e| format!("Failed to parse Modrinth versions: {}", e))?;

    let version = versions
        .first()
        .ok_or("No compatible version found on Modrinth")?;

    let file = version
        .files
        .iter()
        .find(|f| f.primary.unwrap_or(false))
        .or_else(|| version.files.first())
        .ok_or("No files found for this version")?;

    // Download the file
    let file_data = client
        .get(&file.url)
        .header("User-Agent", "vapour-launcher/0.1.0")
        .send()
        .await
        .map_err(|e| format!("Failed to download mod: {}", e))?
        .bytes()
        .await
        .map_err(|e| e.to_string())?;

    let mods_dir = get_mods_dir(&app, &instance_id);
    fs::create_dir_all(&mods_dir).map_err(|e| e.to_string())?;

    let dest_path = mods_dir.join(&file.filename);
    fs::write(&dest_path, &file_data).map_err(|e| e.to_string())?;

    let mut mod_info = ModInfo {
        filename: file.filename.clone(),
        name: version.name.clone(),
        enabled: true,
        version: Some(version.version_number.clone()),
        mod_id: Some(project_id),
        source: Some("modrinth".to_string()),
    };

    // Try reading metadata from the downloaded jar
    if let Some((name, ver, mid)) = try_read_fabric_mod_json(&dest_path) {
        mod_info.name = name;
        if mod_info.version.is_none() {
            mod_info.version = ver;
        }
        if mod_info.mod_id.is_none() {
            mod_info.mod_id = mid;
        }
    }

    Ok(mod_info)
}
