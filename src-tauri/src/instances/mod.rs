use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use uuid::Uuid;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Instance {
    pub id: String,
    pub name: String,
    pub version: String,
    pub loader: Option<String>,
    pub loader_version: Option<String>,
    pub description: Option<String>,
    pub java_path: Option<String>,
    pub min_ram: u32,
    pub max_ram: u32,
    pub jvm_args: Option<String>,
    pub resolution: Option<Resolution>,
    pub created_at: String,
    pub last_played: Option<String>,
    pub play_time: u64,
    pub icon: Option<String>,
    pub background: Option<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Resolution {
    pub width: u32,
    pub height: u32,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
struct InstanceStore {
    instances: Vec<Instance>,
    active: Option<String>,
}

fn get_instances_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path_resolver()
        .app_data_dir()
        .unwrap_or_else(|| {
            dirs::data_dir()
                .unwrap_or_else(|| PathBuf::from("."))
                .join("vapour-launcher")
        })
        .join("instances");
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir)
}

fn get_instance_store_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path_resolver()
        .app_data_dir()
        .unwrap_or_else(|| {
            dirs::data_dir()
                .unwrap_or_else(|| PathBuf::from("."))
                .join("vapour-launcher")
        });
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join("instances.json"))
}

fn load_instance_store(app: &tauri::AppHandle) -> Result<InstanceStore, String> {
    let path = get_instance_store_path(app)?;
    if path.exists() {
        let data = fs::read_to_string(&path).map_err(|e| e.to_string())?;
        serde_json::from_str(&data).map_err(|e| e.to_string())
    } else {
        Ok(InstanceStore {
            instances: Vec::new(),
            active: None,
        })
    }
}

fn save_instance_store(app: &tauri::AppHandle, store: &InstanceStore) -> Result<(), String> {
    let path = get_instance_store_path(app)?;
    let data = serde_json::to_string_pretty(store).map_err(|e| e.to_string())?;
    fs::write(&path, data).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn list_instances(app: tauri::AppHandle) -> Result<Vec<Instance>, String> {
    let store = load_instance_store(&app)?;
    Ok(store.instances)
}

#[tauri::command]
pub async fn create_instance(
    name: String,
    version: String,
    loader: Option<String>,
    loader_version: Option<String>,
    description: Option<String>,
    app: tauri::AppHandle,
) -> Result<Instance, String> {
    if name.is_empty() {
        return Err("Instance name cannot be empty".to_string());
    }

    let id = Uuid::new_v4().to_string();
    let instances_dir = get_instances_dir(&app)?;
    let instance_dir = instances_dir.join(&id);
    let minecraft_dir = instance_dir.join(".minecraft");
    fs::create_dir_all(&minecraft_dir).map_err(|e| e.to_string())?;

    let now = chrono::Utc::now().to_rfc3339();
    let instance = Instance {
        id,
        name,
        version,
        loader,
        loader_version,
        description,
        java_path: None,
        min_ram: 512,
        max_ram: 4096,
        jvm_args: None,
        resolution: None,
        created_at: now,
        last_played: None,
        play_time: 0,
        icon: None,
        background: None,
    };

    let mut store = load_instance_store(&app)?;
    store.instances.push(instance.clone());
    if store.active.is_none() {
        store.active = Some(instance.id.clone());
    }
    save_instance_store(&app, &store)?;

    Ok(instance)
}

#[tauri::command]
pub async fn get_instance(id: String, app: tauri::AppHandle) -> Result<Instance, String> {
    let store = load_instance_store(&app)?;
    store
        .instances
        .into_iter()
        .find(|i| i.id == id)
        .ok_or_else(|| format!("Instance '{}' not found", id))
}

#[tauri::command]
pub async fn update_instance(instance: Instance, app: tauri::AppHandle) -> Result<Instance, String> {
    let mut store = load_instance_store(&app)?;
    let pos = store
        .instances
        .iter()
        .position(|i| i.id == instance.id)
        .ok_or_else(|| format!("Instance '{}' not found", instance.id))?;
    store.instances[pos] = instance.clone();
    save_instance_store(&app, &store)?;
    Ok(instance)
}

#[tauri::command]
pub async fn delete_instance(id: String, app: tauri::AppHandle) -> Result<(), String> {
    let mut store = load_instance_store(&app)?;
    store.instances.retain(|i| i.id != id);
    if store.active.as_deref() == Some(&id) {
        store.active = store.instances.first().map(|i| i.id.clone());
    }
    save_instance_store(&app, &store)?;

    // Delete instance directory
    let instances_dir = get_instances_dir(&app)?;
    let instance_dir = instances_dir.join(&id);
    if instance_dir.exists() {
        fs::remove_dir_all(&instance_dir).map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
pub async fn duplicate_instance(id: String, new_name: String, app: tauri::AppHandle) -> Result<Instance, String> {
    let store = load_instance_store(&app)?;
    let source = store
        .instances
        .iter()
        .find(|i| i.id == id)
        .ok_or_else(|| format!("Instance '{}' not found", id))?
        .clone();

    let new_id = Uuid::new_v4().to_string();
    let instances_dir = get_instances_dir(&app)?;
    let source_dir = instances_dir.join(&id);
    let dest_dir = instances_dir.join(&new_id);

    // Copy directory recursively
    if source_dir.exists() {
        copy_dir_recursive(&source_dir, &dest_dir)?;
    } else {
        let minecraft_dir = dest_dir.join(".minecraft");
        fs::create_dir_all(&minecraft_dir).map_err(|e| e.to_string())?;
    }

    let now = chrono::Utc::now().to_rfc3339();
    let new_instance = Instance {
        id: new_id,
        name: new_name,
        version: source.version,
        loader: source.loader,
        loader_version: source.loader_version,
        description: source.description,
        java_path: source.java_path,
        min_ram: source.min_ram,
        max_ram: source.max_ram,
        jvm_args: source.jvm_args,
        resolution: source.resolution,
        created_at: now,
        last_played: None,
        play_time: 0,
        icon: source.icon,
        background: source.background,
    };

    let mut store = load_instance_store(&app)?;
    store.instances.push(new_instance.clone());
    save_instance_store(&app, &store)?;

    Ok(new_instance)
}

fn copy_dir_recursive(src: &PathBuf, dst: &PathBuf) -> Result<(), String> {
    fs::create_dir_all(dst).map_err(|e| e.to_string())?;
    for entry in fs::read_dir(src).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let src_path = entry.path();
        let dst_path = dst.join(entry.file_name());
        if src_path.is_dir() {
            copy_dir_recursive(&src_path, &dst_path)?;
        } else {
            fs::copy(&src_path, &dst_path).map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

#[tauri::command]
pub async fn set_active_instance(id: String, app: tauri::AppHandle) -> Result<(), String> {
    let mut store = load_instance_store(&app)?;
    if !store.instances.iter().any(|i| i.id == id) {
        return Err(format!("Instance '{}' not found", id));
    }
    store.active = Some(id);
    save_instance_store(&app, &store)?;
    Ok(())
}

#[tauri::command]
pub async fn get_active_instance(app: tauri::AppHandle) -> Result<Option<Instance>, String> {
    let store = load_instance_store(&app)?;
    let active = store
        .active
        .as_ref()
        .and_then(|id| store.instances.iter().find(|i| &i.id == id))
        .cloned();
    Ok(active)
}
