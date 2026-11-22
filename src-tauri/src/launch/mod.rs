use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::Emitter;
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command as TokioCommand;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum LaunchStatus {
    Idle,
    Preparing,
    Running(u32),
    Stopped(i32),
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct GameLogEvent {
    pub instance_id: String,
    pub line: String,
    pub stream: String, // "stdout" or "stderr"
}

static RUNNING_INSTANCES: std::sync::LazyLock<Mutex<HashMap<String, u32>>> =
    std::sync::LazyLock::new(|| Mutex::new(HashMap::new()));

fn get_data_dir(app: &tauri::AppHandle) -> PathBuf {
    app.path_resolver()
        .app_data_dir()
        .unwrap_or_else(|| {
            dirs::data_dir()
                .unwrap_or_else(|| PathBuf::from("."))
                .join("vapour-launcher")
        })
}

fn get_instance_minecraft_dir(app: &tauri::AppHandle, instance_id: &str) -> PathBuf {
    get_data_dir(app)
        .join("instances")
        .join(instance_id)
        .join(".minecraft")
}

fn build_classpath(app: &tauri::AppHandle, version_id: &str) -> Result<String, String> {
    let data_dir = get_data_dir(app);
    let version_dir = data_dir.join("versions").join(version_id);
    let version_json_path = version_dir.join(format!("{}.json", version_id));

    if !version_json_path.exists() {
        return Err(format!("Version JSON not found: {}", version_json_path.display()));
    }

    let json_text = fs::read_to_string(&version_json_path).map_err(|e| e.to_string())?;
    let version_detail: crate::download::VersionDetail =
        serde_json::from_str(&json_text).map_err(|e| e.to_string())?;

    let libraries_dir = data_dir.join("libraries");
    let separator = if cfg!(target_os = "windows") { ";" } else { ":" };

    let mut classpath_entries: Vec<String> = Vec::new();

    // Handle inheritsFrom for modded versions
    if let Some(ref parent_id) = version_detail.inherits_from {
        let parent_cp = build_classpath(app, parent_id)?;
        for entry in parent_cp.split(separator) {
            if !entry.is_empty() {
                classpath_entries.push(entry.to_string());
            }
        }
    }

    if let Some(ref libs) = version_detail.libraries {
        for lib in libs {
            if !crate::download::should_use_library(lib) {
                continue;
            }

            let lib_path = if let Some(ref dl) = lib.downloads {
                if let Some(ref artifact) = dl.artifact {
                    match &artifact.path {
                        Some(p) => libraries_dir.join(p),
                        None => libraries_dir.join(crate::download::library_path_from_name(&lib.name)),
                    }
                } else {
                    libraries_dir.join(crate::download::library_path_from_name(&lib.name))
                }
            } else {
                libraries_dir.join(crate::download::library_path_from_name(&lib.name))
            };

            let path_str = lib_path.to_string_lossy().to_string();
            if !classpath_entries.contains(&path_str) {
                classpath_entries.push(path_str);
            }
        }
    }

    // Add the client JAR
    // For modded versions, the client JAR may be in the parent version
    let client_jar = version_dir.join(format!("{}.jar", version_id));
    if client_jar.exists() {
        classpath_entries.push(client_jar.to_string_lossy().to_string());
    } else if let Some(ref parent_id) = version_detail.inherits_from {
        let parent_jar = data_dir
            .join("versions")
            .join(parent_id)
            .join(format!("{}.jar", parent_id));
        if parent_jar.exists() {
            let pj = parent_jar.to_string_lossy().to_string();
            if !classpath_entries.contains(&pj) {
                classpath_entries.push(pj);
            }
        }
    }

    Ok(classpath_entries.join(separator))
}

fn get_merged_version_detail(
    app: &tauri::AppHandle,
    version_id: &str,
) -> Result<crate::download::VersionDetail, String> {
    let data_dir = get_data_dir(app);
    let version_dir = data_dir.join("versions").join(version_id);
    let version_json_path = version_dir.join(format!("{}.json", version_id));

    let json_text = fs::read_to_string(&version_json_path).map_err(|e| e.to_string())?;
    let detail: crate::download::VersionDetail =
        serde_json::from_str(&json_text).map_err(|e| e.to_string())?;

    if let Some(ref parent_id) = detail.inherits_from {
        let parent = get_merged_version_detail(app, parent_id)?;
        // Merge: child overrides parent
        Ok(crate::download::VersionDetail {
            id: detail.id,
            version_type: detail.version_type.or(parent.version_type),
            main_class: detail.main_class.or(parent.main_class),
            minecraft_arguments: detail.minecraft_arguments.or(parent.minecraft_arguments),
            arguments: detail.arguments.or(parent.arguments),
            libraries: Some({
                let mut libs = parent.libraries.unwrap_or_default();
                libs.extend(detail.libraries.unwrap_or_default());
                libs
            }),
            downloads: detail.downloads.or(parent.downloads),
            asset_index: detail.asset_index.or(parent.asset_index),
            assets: detail.assets.or(parent.assets),
            java_version: detail.java_version.or(parent.java_version),
            inherits_from: None,
        })
    } else {
        Ok(detail)
    }
}

fn build_game_arguments(
    version_detail: &crate::download::VersionDetail,
    username: &str,
    uuid: &str,
    access_token: &str,
    game_dir: &PathBuf,
    assets_dir: &PathBuf,
    version_id: &str,
    assets_id: &str,
) -> Vec<String> {
    let mut args: Vec<String> = Vec::new();

    // Try new-style arguments first
    if let Some(ref arguments) = version_detail.arguments {
        if let Some(ref game_args) = arguments.game {
            for arg in game_args {
                match arg {
                    serde_json::Value::String(s) => {
                        args.push(s.clone());
                    }
                    serde_json::Value::Object(obj) => {
                        // Conditional argument - extract values if simple
                        if let Some(serde_json::Value::String(val)) = obj.get("value") {
                            args.push(val.clone());
                        } else if let Some(serde_json::Value::Array(vals)) = obj.get("value") {
                            for v in vals {
                                if let serde_json::Value::String(s) = v {
                                    args.push(s.clone());
                                }
                            }
                        }
                    }
                    _ => {}
                }
            }
        }
    } else if let Some(ref mc_args) = version_detail.minecraft_arguments {
        // Old-style minecraftArguments (space-separated)
        args.extend(mc_args.split_whitespace().map(|s| s.to_string()));
    }

    // Replace template variables
    let replacements: HashMap<&str, String> = HashMap::from([
        ("${auth_player_name}", username.to_string()),
        ("${version_name}", version_id.to_string()),
        ("${game_directory}", game_dir.to_string_lossy().to_string()),
        ("${assets_root}", assets_dir.to_string_lossy().to_string()),
        ("${game_assets}", assets_dir.to_string_lossy().to_string()),
        ("${assets_index_name}", assets_id.to_string()),
        ("${auth_uuid}", uuid.to_string()),
        ("${auth_access_token}", access_token.to_string()),
        ("${user_type}", "msa".to_string()),
        ("${version_type}", version_detail.version_type.clone().unwrap_or_else(|| "release".to_string())),
        ("${auth_session}", format!("token:{}", access_token)),
        ("${user_properties}", "{}".to_string()),
        ("${clientid}", "".to_string()),
        ("${auth_xuid}", "".to_string()),
    ]);

    args.iter()
        .map(|arg| {
            let mut result = arg.clone();
            for (key, value) in &replacements {
                result = result.replace(key, value);
            }
            result
        })
        .collect()
}

fn build_jvm_arguments(
    version_detail: &crate::download::VersionDetail,
    classpath: &str,
    game_dir: &PathBuf,
    natives_dir: &PathBuf,
    min_ram: u32,
    max_ram: u32,
    extra_jvm_args: Option<&str>,
) -> Vec<String> {
    let mut args: Vec<String> = Vec::new();

    // Memory
    args.push(format!("-Xms{}m", min_ram));
    args.push(format!("-Xmx{}m", max_ram));

    // Natives directory
    args.push(format!(
        "-Djava.library.path={}",
        natives_dir.to_string_lossy()
    ));

    // Try new-style JVM arguments
    if let Some(ref arguments) = version_detail.arguments {
        if let Some(ref jvm_args) = arguments.jvm {
            for arg in jvm_args {
                match arg {
                    serde_json::Value::String(s) => {
                        // Skip the ones we already handle
                        if !s.starts_with("-Xms") && !s.starts_with("-Xmx") {
                            args.push(s.clone());
                        }
                    }
                    serde_json::Value::Object(obj) => {
                        // Check OS rules
                        let mut matches = true;
                        if let Some(serde_json::Value::Array(rules)) = obj.get("rules") {
                            for rule in rules {
                                if let Some(os) = rule.get("os") {
                                    if let Some(serde_json::Value::String(name)) = os.get("name") {
                                        let current_os = if cfg!(target_os = "windows") {
                                            "windows"
                                        } else if cfg!(target_os = "macos") {
                                            "osx"
                                        } else {
                                            "linux"
                                        };
                                        if name != current_os {
                                            matches = false;
                                        }
                                    }
                                }
                            }
                        }
                        if matches {
                            if let Some(serde_json::Value::String(val)) = obj.get("value") {
                                if !val.starts_with("-Xms") && !val.starts_with("-Xmx") {
                                    args.push(val.clone());
                                }
                            } else if let Some(serde_json::Value::Array(vals)) = obj.get("value") {
                                for v in vals {
                                    if let serde_json::Value::String(s) = v {
                                        if !s.starts_with("-Xms") && !s.starts_with("-Xmx") {
                                            args.push(s.clone());
                                        }
                                    }
                                }
                            }
                        }
                    }
                    _ => {}
                }
            }
        }
    }

    // Extra JVM args from user
    if let Some(extra) = extra_jvm_args {
        for arg in extra.split_whitespace() {
            if !arg.is_empty() {
                args.push(arg.to_string());
            }
        }
    }

    // Replace template variables in JVM args
    let launcher_name = "vapour-launcher";
    let launcher_version = "0.1.0";
    let classpath_str = classpath.to_string();
    let game_dir_str = game_dir.to_string_lossy().to_string();
    let natives_dir_str = natives_dir.to_string_lossy().to_string();

    args.iter()
        .map(|arg| {
            arg.replace("${natives_directory}", &natives_dir_str)
                .replace("${launcher_name}", launcher_name)
                .replace("${launcher_version}", launcher_version)
                .replace("${classpath}", &classpath_str)
                .replace("${game_directory}", &game_dir_str)
                .replace("${library_directory}", &game_dir_str)
                .replace("${classpath_separator}", if cfg!(target_os = "windows") { ";" } else { ":" })
        })
        .collect()
}

#[tauri::command]
pub async fn launch_instance(instance_id: String, app: tauri::AppHandle) -> Result<(), String> {
    // Check if already running
    {
        let running = RUNNING_INSTANCES.lock().map_err(|e| e.to_string())?;
        if running.contains_key(&instance_id) {
            return Err("Instance is already running".to_string());
        }
    }

    let _ = app.emit("launch:status", serde_json::json!({
        "instance_id": instance_id,
        "status": "Preparing"
    }));

    // Load instance data
    let store_path = get_data_dir(&app).join("instances.json");
    let store_text = fs::read_to_string(&store_path).map_err(|e| e.to_string())?;
    let store: serde_json::Value = serde_json::from_str(&store_text).map_err(|e| e.to_string())?;
    let instances = store["instances"]
        .as_array()
        .ok_or("Invalid instance store")?;
    let instance_val = instances
        .iter()
        .find(|i| i["id"].as_str() == Some(&instance_id))
        .ok_or_else(|| format!("Instance '{}' not found", instance_id))?;

    let instance: crate::instances::Instance =
        serde_json::from_value(instance_val.clone()).map_err(|e| e.to_string())?;

    // Determine which version JSON to use (may include loader)
    let effective_version_id = if let (Some(ref loader), Some(ref loader_version)) =
        (&instance.loader, &instance.loader_version)
    {
        format!("{}-{}-{}", instance.version, loader, loader_version)
    } else {
        instance.version.clone()
    };

    // Check if the effective version exists; fallback to base version
    let data_dir = get_data_dir(&app);
    let version_json_path = data_dir
        .join("versions")
        .join(&effective_version_id)
        .join(format!("{}.json", effective_version_id));

    let final_version_id = if version_json_path.exists() {
        effective_version_id
    } else {
        instance.version.clone()
    };

    // Get merged version detail
    let version_detail = get_merged_version_detail(&app, &final_version_id)?;

    // Get main class
    let main_class = version_detail
        .main_class
        .clone()
        .ok_or("No main class found in version JSON")?;

    // Build classpath
    let classpath = build_classpath(&app, &final_version_id)?;

    // Get game directory
    let game_dir = get_instance_minecraft_dir(&app, &instance_id);
    fs::create_dir_all(&game_dir).map_err(|e| e.to_string())?;

    // Natives directory
    let natives_dir = data_dir
        .join("versions")
        .join(&final_version_id)
        .join("natives");
    fs::create_dir_all(&natives_dir).map_err(|e| e.to_string())?;

    // Assets directory
    let assets_dir = data_dir.join("assets");
    let assets_id = version_detail
        .assets
        .clone()
        .or_else(|| version_detail.asset_index.as_ref().map(|a| a.id.clone()))
        .unwrap_or_else(|| instance.version.clone());

    // Get account info
    let account_store = crate::auth::load_accounts(&app)?;
    let account = account_store
        .active
        .as_ref()
        .and_then(|uuid| account_store.accounts.iter().find(|a| &a.uuid == uuid))
        .cloned()
        .ok_or("No active account. Please log in first.")?;

    // Find Java
    let java_path = if let Some(ref jp) = instance.java_path {
        jp.clone()
    } else {
        let runtime = crate::java::get_java_for_version(instance.version.clone())
            .await?
            .ok_or("No compatible Java runtime found. Please install Java.")?;
        runtime.path
    };

    // Build JVM arguments
    let jvm_args = build_jvm_arguments(
        &version_detail,
        &classpath,
        &game_dir,
        &natives_dir,
        instance.min_ram,
        instance.max_ram,
        instance.jvm_args.as_deref(),
    );

    // Build game arguments
    let game_args = build_game_arguments(
        &version_detail,
        &account.username,
        &account.uuid,
        &account.access_token,
        &game_dir,
        &assets_dir,
        &final_version_id,
        &assets_id,
    );

    // Resolution args
    let mut resolution_args = Vec::new();
    if let Some(ref res) = instance.resolution {
        resolution_args.push("--width".to_string());
        resolution_args.push(res.width.to_string());
        resolution_args.push("--height".to_string());
        resolution_args.push(res.height.to_string());
    }

    // Construct final command
    let mut cmd = TokioCommand::new(&java_path);
    cmd.args(&jvm_args);
    cmd.arg("-cp");
    cmd.arg(&classpath);
    cmd.arg(&main_class);
    cmd.args(&game_args);
    cmd.args(&resolution_args);
    cmd.current_dir(&game_dir);

    // Setup stdout/stderr capture
    cmd.stdout(std::process::Stdio::piped());
    cmd.stderr(std::process::Stdio::piped());

    let mut child = cmd.spawn().map_err(|e| format!("Failed to launch game: {}", e))?;

    let pid = child.id().unwrap_or(0);

    // Record running instance
    {
        let mut running = RUNNING_INSTANCES.lock().map_err(|e| e.to_string())?;
        running.insert(instance_id.clone(), pid);
    }

    let _ = app.emit("launch:status", serde_json::json!({
        "instance_id": instance_id,
        "status": {"Running": pid}
    }));

    // Spawn tasks to stream stdout/stderr
    let stdout = child.stdout.take();
    let stderr = child.stderr.take();
    let app_stdout = app.clone();
    let instance_id_stdout = instance_id.clone();
    let app_stderr = app.clone();
    let instance_id_stderr = instance_id.clone();

    if let Some(stdout) = stdout {
        tokio::spawn(async move {
            let reader = BufReader::new(stdout);
            let mut lines = reader.lines();
            while let Ok(Some(line)) = lines.next_line().await {
                let _ = app_stdout.emit(
                    "game:log",
                    GameLogEvent {
                        instance_id: instance_id_stdout.clone(),
                        line,
                        stream: "stdout".to_string(),
                    },
                );
            }
        });
    }

    if let Some(stderr) = stderr {
        tokio::spawn(async move {
            let reader = BufReader::new(stderr);
            let mut lines = reader.lines();
            while let Ok(Some(line)) = lines.next_line().await {
                let _ = app_stderr.emit(
                    "game:log",
                    GameLogEvent {
                        instance_id: instance_id_stderr.clone(),
                        line,
                        stream: "stderr".to_string(),
                    },
                );
            }
        });
    }

    // Spawn task to wait for process exit
    let app_exit = app.clone();
    let instance_id_exit = instance_id.clone();
    tokio::spawn(async move {
        let status = child.wait().await;
        let exit_code = status.map(|s| s.code().unwrap_or(-1)).unwrap_or(-1);

        {
            if let Ok(mut running) = RUNNING_INSTANCES.lock() {
                running.remove(&instance_id_exit);
            }
        }

        let _ = app_exit.emit("launch:status", serde_json::json!({
            "instance_id": instance_id_exit,
            "status": {"Stopped": exit_code}
        }));
    });

    Ok(())
}

#[tauri::command]
pub async fn kill_instance(instance_id: String) -> Result<(), String> {
    let pid = {
        let running = RUNNING_INSTANCES.lock().map_err(|e| e.to_string())?;
        running
            .get(&instance_id)
            .copied()
            .ok_or_else(|| format!("Instance '{}' is not running", instance_id))?
    };

    // Kill the process
    #[cfg(unix)]
    {
        unsafe {
            libc::kill(pid as i32, libc::SIGTERM);
        }
    }
    #[cfg(not(unix))]
    {
        // On Windows, use taskkill
        std::process::Command::new("taskkill")
            .args(&["/PID", &pid.to_string(), "/F"])
            .output()
            .map_err(|e| e.to_string())?;
    }

    {
        let mut running = RUNNING_INSTANCES.lock().map_err(|e| e.to_string())?;
        running.remove(&instance_id);
    }

    Ok(())
}

#[tauri::command]
pub async fn get_launch_status(instance_id: String) -> Result<LaunchStatus, String> {
    let running = RUNNING_INSTANCES.lock().map_err(|e| e.to_string())?;
    if let Some(&pid) = running.get(&instance_id) {
        Ok(LaunchStatus::Running(pid))
    } else {
        Ok(LaunchStatus::Idle)
    }
}
