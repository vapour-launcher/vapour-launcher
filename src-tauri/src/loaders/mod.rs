use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct LoaderVersion {
    pub version: String,
    pub stable: bool,
    pub loader_type: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
struct FabricLoaderEntry {
    loader: FabricLoaderInfo,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
struct FabricLoaderInfo {
    version: String,
    stable: Option<bool>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
struct FabricProfileResponse {
    id: String,
    #[serde(rename = "inheritsFrom")]
    inherits_from: String,
    #[serde(rename = "type")]
    profile_type: Option<String>,
    #[serde(rename = "mainClass")]
    main_class: String,
    arguments: Option<FabricArguments>,
    libraries: Vec<FabricLibrary>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
struct FabricArguments {
    game: Option<Vec<serde_json::Value>>,
    jvm: Option<Vec<serde_json::Value>>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
struct FabricLibrary {
    name: String,
    url: Option<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
struct QuiltLoaderEntry {
    loader: QuiltLoaderInfo,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
struct QuiltLoaderInfo {
    version: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
struct ForgeVersionList {
    versions: Option<Vec<String>>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
struct NeoForgeVersionList {
    versions: Option<Vec<String>>,
}

fn get_data_dir(_app: &tauri::AppHandle) -> PathBuf {
    dirs::data_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("vapour-launcher")
}

fn save_loader_profile(
    app: &tauri::AppHandle,
    version_id: &str,
    profile_json: &str,
) -> Result<(), String> {
    let version_dir = get_data_dir(app).join("versions").join(version_id);
    fs::create_dir_all(&version_dir).map_err(|e| e.to_string())?;
    let json_path = version_dir.join(format!("{}.json", version_id));
    fs::write(&json_path, profile_json).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn install_fabric(
    mc_version: String,
    loader_version: String,
    app: tauri::AppHandle,
) -> Result<String, String> {
    let client = reqwest::Client::new();

    // Fetch Fabric profile JSON from Fabric Meta API
    let url = format!(
        "https://meta.fabricmc.net/v2/versions/loader/{}/{}/profile/json",
        mc_version, loader_version
    );

    let resp = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Failed to fetch Fabric profile: {}", e))?;

    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        return Err(format!(
            "Fabric API error ({}): {}",
            status, body
        ));
    }

    let profile_text = resp.text().await.map_err(|e| e.to_string())?;

    // Parse to validate and get the version ID
    let profile: FabricProfileResponse =
        serde_json::from_str(&profile_text).map_err(|e| format!("Failed to parse Fabric profile: {}", e))?;

    let version_id = profile.id.clone();

    // Save the profile JSON
    save_loader_profile(&app, &version_id, &profile_text)?;

    // Download Fabric libraries
    let libraries_dir = get_data_dir(&app).join("libraries");
    for lib in &profile.libraries {
        let rel_path = crate::download::library_path_from_name(&lib.name);
        let lib_path = libraries_dir.join(&rel_path);

        if lib_path.exists() {
            continue;
        }

        let base_url = lib
            .url
            .as_deref()
            .unwrap_or("https://maven.fabricmc.net/");

        let download_url = format!(
            "{}{}",
            base_url.trim_end_matches('/'),
            format!("/{}", rel_path)
        );

        if let Some(parent) = lib_path.parent() {
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }

        let lib_resp = client
            .get(&download_url)
            .send()
            .await
            .map_err(|e| format!("Failed to download Fabric library {}: {}", lib.name, e))?;

        if lib_resp.status().is_success() {
            let data = lib_resp.bytes().await.map_err(|e| e.to_string())?;
            fs::write(&lib_path, &data).map_err(|e| e.to_string())?;
        } else {
            // Try Maven Central as fallback
            let maven_url = format!("https://repo1.maven.org/maven2/{}", rel_path);
            let maven_resp = client
                .get(&maven_url)
                .send()
                .await
                .map_err(|e| format!("Failed to download library {}: {}", lib.name, e))?;

            if maven_resp.status().is_success() {
                let data = maven_resp.bytes().await.map_err(|e| e.to_string())?;
                fs::write(&lib_path, &data).map_err(|e| e.to_string())?;
            } else {
                return Err(format!("Failed to download Fabric library: {}", lib.name));
            }
        }
    }

    Ok(version_id)
}

#[tauri::command]
pub async fn install_quilt(
    mc_version: String,
    loader_version: String,
    app: tauri::AppHandle,
) -> Result<String, String> {
    let client = reqwest::Client::new();

    // Fetch Quilt profile JSON from Quilt Meta API
    let url = format!(
        "https://meta.quiltmc.org/v3/versions/loader/{}/{}/profile/json",
        mc_version, loader_version
    );

    let resp = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Failed to fetch Quilt profile: {}", e))?;

    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        return Err(format!("Quilt API error ({}): {}", status, body));
    }

    let profile_text = resp.text().await.map_err(|e| e.to_string())?;

    let profile: FabricProfileResponse =
        serde_json::from_str(&profile_text).map_err(|e| format!("Failed to parse Quilt profile: {}", e))?;

    let version_id = profile.id.clone();

    save_loader_profile(&app, &version_id, &profile_text)?;

    // Download Quilt libraries
    let libraries_dir = get_data_dir(&app).join("libraries");
    for lib in &profile.libraries {
        let rel_path = crate::download::library_path_from_name(&lib.name);
        let lib_path = libraries_dir.join(&rel_path);

        if lib_path.exists() {
            continue;
        }

        let base_url = lib
            .url
            .as_deref()
            .unwrap_or("https://maven.quiltmc.org/repository/release/");

        let download_url = format!(
            "{}{}",
            base_url.trim_end_matches('/'),
            format!("/{}", rel_path)
        );

        if let Some(parent) = lib_path.parent() {
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }

        let lib_resp = client.get(&download_url).send().await;

        match lib_resp {
            Ok(r) if r.status().is_success() => {
                let data = r.bytes().await.map_err(|e| e.to_string())?;
                fs::write(&lib_path, &data).map_err(|e| e.to_string())?;
            }
            _ => {
                // Fallback: Maven Central, then Fabric Maven
                let fallback_urls = [
                    format!("https://repo1.maven.org/maven2/{}", rel_path),
                    format!("https://maven.fabricmc.net/{}", rel_path),
                ];
                let mut downloaded = false;
                for furl in &fallback_urls {
                    if let Ok(r) = client.get(furl).send().await {
                        if r.status().is_success() {
                            let data = r.bytes().await.map_err(|e| e.to_string())?;
                            fs::write(&lib_path, &data).map_err(|e| e.to_string())?;
                            downloaded = true;
                            break;
                        }
                    }
                }
                if !downloaded {
                    return Err(format!("Failed to download Quilt library: {}", lib.name));
                }
            }
        }
    }

    Ok(version_id)
}

#[tauri::command]
pub async fn install_forge(
    mc_version: String,
    loader_version: String,
    app: tauri::AppHandle,
) -> Result<String, String> {
    let client = reqwest::Client::new();

    // Download Forge installer JAR
    let forge_version = format!("{}-{}", mc_version, loader_version);
    let installer_url = format!(
        "https://maven.minecraftforge.net/net/minecraftforge/forge/{}/forge-{}-installer.jar",
        forge_version, forge_version
    );

    let data_dir = get_data_dir(&app);
    let temp_dir = data_dir.join("temp");
    fs::create_dir_all(&temp_dir).map_err(|e| e.to_string())?;
    let installer_path = temp_dir.join(format!("forge-{}-installer.jar", forge_version));

    // Download installer
    let resp = client
        .get(&installer_url)
        .send()
        .await
        .map_err(|e| format!("Failed to download Forge installer: {}", e))?;

    if !resp.status().is_success() {
        return Err(format!(
            "Forge installer download failed (HTTP {}). Check if version {}-{} exists.",
            resp.status(),
            mc_version,
            loader_version
        ));
    }

    let installer_data = resp.bytes().await.map_err(|e| e.to_string())?;
    fs::write(&installer_path, &installer_data).map_err(|e| e.to_string())?;

    // Extract install_profile.json and version.json from the installer JAR
    let file = fs::File::open(&installer_path).map_err(|e| e.to_string())?;
    let mut archive = zip::ZipArchive::new(file).map_err(|e| format!("Failed to open Forge installer JAR: {}", e))?;

    // Try to extract version.json
    let version_id = format!("{}-forge-{}", mc_version, loader_version);
    let version_json = extract_zip_entry(&mut archive, "version.json")
        .or_else(|| {
            // Older Forge versions use install_profile.json with versionInfo
            extract_zip_entry(&mut archive, "install_profile.json")
                .and_then(|profile_text| {
                    let profile: serde_json::Value = serde_json::from_str(&profile_text).ok()?;
                    if let Some(version_info) = profile.get("versionInfo") {
                        Some(serde_json::to_string_pretty(version_info).ok()?)
                    } else {
                        // Modern forge: install_profile.json has the version as well
                        Some(profile_text)
                    }
                })
        })
        .ok_or("Could not find version.json in Forge installer")?;

    // Parse and patch the version JSON to have correct inheritsFrom
    let mut version_detail: serde_json::Value =
        serde_json::from_str(&version_json).map_err(|e| format!("Failed to parse Forge version JSON: {}", e))?;

    // Set/override inheritsFrom
    version_detail["inheritsFrom"] = serde_json::json!(mc_version);
    version_detail["id"] = serde_json::json!(version_id);

    let patched_json = serde_json::to_string_pretty(&version_detail).map_err(|e| e.to_string())?;
    save_loader_profile(&app, &version_id, &patched_json)?;

    // Download Forge libraries from the version JSON
    let libraries_dir = data_dir.join("libraries");
    if let Some(libs) = version_detail["libraries"].as_array() {
        for lib in libs {
            let name = lib["name"].as_str().unwrap_or("");
            if name.is_empty() {
                continue;
            }

            let rel_path = crate::download::library_path_from_name(name);
            let lib_path = libraries_dir.join(&rel_path);

            if lib_path.exists() {
                continue;
            }

            if let Some(parent) = lib_path.parent() {
                fs::create_dir_all(parent).map_err(|e| e.to_string())?;
            }

            // Try to get the URL from downloads.artifact.url
            let url = lib["downloads"]["artifact"]["url"]
                .as_str()
                .map(|s| s.to_string())
                .or_else(|| {
                    let base = lib["url"]
                        .as_str()
                        .unwrap_or("https://maven.minecraftforge.net/");
                    Some(format!("{}{}", base.trim_end_matches('/'), format!("/{}", rel_path)))
                });

            if let Some(url) = url {
                if url.is_empty() {
                    // Try to extract from the installer JAR
                    let archive_path = format!("maven/{}", rel_path);
                    let file = fs::File::open(&installer_path).map_err(|e| e.to_string())?;
                    let mut archive = zip::ZipArchive::new(file).map_err(|e| e.to_string())?;
                    if let Some(data) = extract_zip_entry_bytes(&mut archive, &archive_path) {
                        fs::write(&lib_path, &data).map_err(|e| e.to_string())?;
                    }
                    continue;
                }

                match client.get(&url).send().await {
                    Ok(r) if r.status().is_success() => {
                        let data = r.bytes().await.map_err(|e| e.to_string())?;
                        fs::write(&lib_path, &data).map_err(|e| e.to_string())?;
                    }
                    _ => {
                        // Try extracting from installer JAR (bundled maven)
                        let archive_path = format!("maven/{}", rel_path);
                        let file = fs::File::open(&installer_path).map_err(|e| e.to_string())?;
                        let mut archive = zip::ZipArchive::new(file).map_err(|e| e.to_string())?;
                        if let Some(data) = extract_zip_entry_bytes(&mut archive, &archive_path) {
                            fs::write(&lib_path, &data).map_err(|e| e.to_string())?;
                        }
                        // Not fatal if library is missing - it may be in vanilla
                    }
                }
            }
        }
    }

    // Clean up installer
    let _ = fs::remove_file(&installer_path);

    Ok(version_id)
}

fn extract_zip_entry(archive: &mut zip::ZipArchive<fs::File>, name: &str) -> Option<String> {
    let mut entry = archive.by_name(name).ok()?;
    let mut contents = String::new();
    std::io::Read::read_to_string(&mut entry, &mut contents).ok()?;
    Some(contents)
}

fn extract_zip_entry_bytes(archive: &mut zip::ZipArchive<fs::File>, name: &str) -> Option<Vec<u8>> {
    let mut entry = archive.by_name(name).ok()?;
    let mut contents = Vec::new();
    std::io::Read::read_to_end(&mut entry, &mut contents).ok()?;
    Some(contents)
}

#[tauri::command]
pub async fn install_neoforge(
    mc_version: String,
    loader_version: String,
    app: tauri::AppHandle,
) -> Result<String, String> {
    let client = reqwest::Client::new();

    // NeoForge installer URL
    let installer_url = format!(
        "https://maven.neoforged.net/releases/net/neoforged/neoforge/{}/neoforge-{}-installer.jar",
        loader_version, loader_version
    );

    let data_dir = get_data_dir(&app);
    let temp_dir = data_dir.join("temp");
    fs::create_dir_all(&temp_dir).map_err(|e| e.to_string())?;
    let installer_path = temp_dir.join(format!("neoforge-{}-installer.jar", loader_version));

    // Download installer
    let resp = client
        .get(&installer_url)
        .send()
        .await
        .map_err(|e| format!("Failed to download NeoForge installer: {}", e))?;

    if !resp.status().is_success() {
        return Err(format!(
            "NeoForge installer download failed (HTTP {}). Check if version {} exists.",
            resp.status(),
            loader_version
        ));
    }

    let installer_data = resp.bytes().await.map_err(|e| e.to_string())?;
    fs::write(&installer_path, &installer_data).map_err(|e| e.to_string())?;

    // Extract version.json from installer
    let file = fs::File::open(&installer_path).map_err(|e| e.to_string())?;
    let mut archive = zip::ZipArchive::new(file).map_err(|e| format!("Failed to open NeoForge installer JAR: {}", e))?;

    let version_json = extract_zip_entry(&mut archive, "version.json")
        .ok_or("Could not find version.json in NeoForge installer")?;

    let version_id = format!("{}-neoforge-{}", mc_version, loader_version);

    let mut version_detail: serde_json::Value =
        serde_json::from_str(&version_json).map_err(|e| format!("Failed to parse NeoForge version JSON: {}", e))?;

    version_detail["inheritsFrom"] = serde_json::json!(mc_version);
    version_detail["id"] = serde_json::json!(version_id);

    let patched_json = serde_json::to_string_pretty(&version_detail).map_err(|e| e.to_string())?;
    save_loader_profile(&app, &version_id, &patched_json)?;

    // Download NeoForge libraries
    let libraries_dir = data_dir.join("libraries");
    if let Some(libs) = version_detail["libraries"].as_array() {
        for lib in libs {
            let name = lib["name"].as_str().unwrap_or("");
            if name.is_empty() {
                continue;
            }

            let rel_path = crate::download::library_path_from_name(name);
            let lib_path = libraries_dir.join(&rel_path);

            if lib_path.exists() {
                continue;
            }

            if let Some(parent) = lib_path.parent() {
                fs::create_dir_all(parent).map_err(|e| e.to_string())?;
            }

            let url = lib["downloads"]["artifact"]["url"]
                .as_str()
                .map(|s| s.to_string())
                .or_else(|| {
                    let base = lib["url"]
                        .as_str()
                        .unwrap_or("https://maven.neoforged.net/releases/");
                    Some(format!("{}{}", base.trim_end_matches('/'), format!("/{}", rel_path)))
                });

            if let Some(url) = url {
                if url.is_empty() {
                    let archive_path = format!("maven/{}", rel_path);
                    let file = fs::File::open(&installer_path).map_err(|e| e.to_string())?;
                    let mut archive = zip::ZipArchive::new(file).map_err(|e| e.to_string())?;
                    if let Some(data) = extract_zip_entry_bytes(&mut archive, &archive_path) {
                        fs::write(&lib_path, &data).map_err(|e| e.to_string())?;
                    }
                    continue;
                }

                match client.get(&url).send().await {
                    Ok(r) if r.status().is_success() => {
                        let data = r.bytes().await.map_err(|e| e.to_string())?;
                        fs::write(&lib_path, &data).map_err(|e| e.to_string())?;
                    }
                    _ => {
                        let archive_path = format!("maven/{}", rel_path);
                        let file = fs::File::open(&installer_path).map_err(|e| e.to_string())?;
                        let mut archive = zip::ZipArchive::new(file).map_err(|e| e.to_string())?;
                        if let Some(data) = extract_zip_entry_bytes(&mut archive, &archive_path) {
                            fs::write(&lib_path, &data).map_err(|e| e.to_string())?;
                        }
                    }
                }
            }
        }
    }

    // Clean up installer
    let _ = fs::remove_file(&installer_path);

    Ok(version_id)
}

#[tauri::command]
pub async fn get_available_loader_versions(
    loader_type: String,
    mc_version: String,
) -> Result<Vec<LoaderVersion>, String> {
    let client = reqwest::Client::new();

    match loader_type.to_lowercase().as_str() {
        "fabric" => {
            let url = format!(
                "https://meta.fabricmc.net/v2/versions/loader/{}",
                mc_version
            );
            let resp = client
                .get(&url)
                .send()
                .await
                .map_err(|e| format!("Failed to fetch Fabric versions: {}", e))?;

            if !resp.status().is_success() {
                return Err(format!(
                    "Fabric API error: HTTP {}",
                    resp.status()
                ));
            }

            let entries: Vec<FabricLoaderEntry> = resp
                .json()
                .await
                .map_err(|e| format!("Failed to parse Fabric versions: {}", e))?;

            Ok(entries
                .into_iter()
                .map(|e| LoaderVersion {
                    version: e.loader.version,
                    stable: e.loader.stable.unwrap_or(false),
                    loader_type: "fabric".to_string(),
                })
                .collect())
        }
        "quilt" => {
            let url = format!(
                "https://meta.quiltmc.org/v3/versions/loader/{}",
                mc_version
            );
            let resp = client
                .get(&url)
                .send()
                .await
                .map_err(|e| format!("Failed to fetch Quilt versions: {}", e))?;

            if !resp.status().is_success() {
                return Err(format!("Quilt API error: HTTP {}", resp.status()));
            }

            let entries: Vec<QuiltLoaderEntry> = resp
                .json()
                .await
                .map_err(|e| format!("Failed to parse Quilt versions: {}", e))?;

            Ok(entries
                .into_iter()
                .map(|e| LoaderVersion {
                    version: e.loader.version,
                    stable: true,
                    loader_type: "quilt".to_string(),
                })
                .collect())
        }
        "forge" => {
            // Forge versions from promotions or the files API
            let url = format!(
                "https://files.minecraftforge.net/net/minecraftforge/forge/index_{}.html",
                mc_version
            );

            // Try the maven metadata approach
            let maven_url = format!(
                "https://maven.minecraftforge.net/net/minecraftforge/forge/maven-metadata.xml"
            );
            let resp = client
                .get(&maven_url)
                .send()
                .await
                .map_err(|e| format!("Failed to fetch Forge versions: {}", e))?;

            if !resp.status().is_success() {
                return Err(format!("Forge API error: HTTP {}", resp.status()));
            }

            let xml_text = resp.text().await.map_err(|e| e.to_string())?;

            // Parse versions from maven-metadata.xml
            // Look for <version>MC_VERSION-FORGE_VERSION</version>
            let prefix = format!("{}-", mc_version);
            let mut versions: Vec<LoaderVersion> = Vec::new();

            for line in xml_text.lines() {
                let trimmed = line.trim();
                if trimmed.starts_with("<version>") && trimmed.ends_with("</version>") {
                    let ver = trimmed
                        .trim_start_matches("<version>")
                        .trim_end_matches("</version>");
                    if ver.starts_with(&prefix) {
                        let forge_ver = ver.trim_start_matches(&prefix);
                        versions.push(LoaderVersion {
                            version: forge_ver.to_string(),
                            stable: true,
                            loader_type: "forge".to_string(),
                        });
                    }
                }
            }

            // Show newest first
            versions.reverse();

            if versions.is_empty() {
                // Fallback: try the promotions API
                let promos_url = "https://files.minecraftforge.net/net/minecraftforge/forge/promotions_slim.json";
                if let Ok(r) = client.get(promos_url).send().await {
                    if let Ok(promos) = r.json::<serde_json::Value>().await {
                        if let Some(promos_map) = promos["promos"].as_object() {
                            let recommended_key = format!("{}-recommended", mc_version);
                            let latest_key = format!("{}-latest", mc_version);

                            if let Some(ver) = promos_map.get(&recommended_key).and_then(|v| v.as_str()) {
                                versions.push(LoaderVersion {
                                    version: ver.to_string(),
                                    stable: true,
                                    loader_type: "forge".to_string(),
                                });
                            }
                            if let Some(ver) = promos_map.get(&latest_key).and_then(|v| v.as_str()) {
                                if !versions.iter().any(|v2| v2.version == ver) {
                                    versions.push(LoaderVersion {
                                        version: ver.to_string(),
                                        stable: false,
                                        loader_type: "forge".to_string(),
                                    });
                                }
                            }
                        }
                    }
                }

                // Suppress unused variable warning
                let _ = url;
            }

            Ok(versions)
        }
        "neoforge" => {
            let maven_url =
                "https://maven.neoforged.net/releases/net/neoforged/neoforge/maven-metadata.xml";
            let resp = client
                .get(maven_url)
                .send()
                .await
                .map_err(|e| format!("Failed to fetch NeoForge versions: {}", e))?;

            if !resp.status().is_success() {
                return Err(format!("NeoForge API error: HTTP {}", resp.status()));
            }

            let xml_text = resp.text().await.map_err(|e| e.to_string())?;

            // NeoForge versions are like "20.4.70-beta" for MC 1.20.4
            // Parse MC version to determine NeoForge version prefix
            // MC 1.20.1 -> NeoForge 47.x (old forge naming)
            // MC 1.20.2+ -> NeoForge 20.2.x, 20.3.x, 20.4.x, etc.
            // MC 1.21+ -> NeoForge 21.x.x
            let mc_parts: Vec<&str> = mc_version.split('.').collect();
            let nf_prefix = if mc_parts.len() >= 3 {
                format!("{}.{}", mc_parts[1], mc_parts[2])
            } else if mc_parts.len() == 2 {
                format!("{}.", mc_parts[1])
            } else {
                mc_version.clone()
            };

            let mut versions: Vec<LoaderVersion> = Vec::new();

            for line in xml_text.lines() {
                let trimmed = line.trim();
                if trimmed.starts_with("<version>") && trimmed.ends_with("</version>") {
                    let ver = trimmed
                        .trim_start_matches("<version>")
                        .trim_end_matches("</version>");
                    if ver.starts_with(&nf_prefix) {
                        let stable = !ver.contains("beta") && !ver.contains("alpha");
                        versions.push(LoaderVersion {
                            version: ver.to_string(),
                            stable,
                            loader_type: "neoforge".to_string(),
                        });
                    }
                }
            }

            versions.reverse();
            Ok(versions)
        }
        _ => Err(format!("Unknown loader type: {}", loader_type)),
    }
}
