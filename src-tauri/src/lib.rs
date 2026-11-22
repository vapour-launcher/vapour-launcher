pub mod auth;
pub mod instances;
pub mod download;
pub mod java;
pub mod mods_manager;
pub mod launch;
pub mod loaders;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            // Auth commands
            auth::login_microsoft,
            auth::login_offline,
            auth::logout,
            auth::get_accounts,
            auth::get_active_account,
            // Instance commands
            instances::list_instances,
            instances::create_instance,
            instances::get_instance,
            instances::update_instance,
            instances::delete_instance,
            instances::duplicate_instance,
            instances::set_active_instance,
            instances::get_active_instance,
            // Download commands
            download::fetch_version_manifest,
            download::download_version,
            // Java commands
            java::detect_java_runtimes,
            java::get_java_for_version,
            // Launch commands
            launch::launch_instance,
            launch::kill_instance,
            launch::get_launch_status,
            // Mods commands
            mods_manager::list_mods,
            mods_manager::toggle_mod,
            mods_manager::delete_mod,
            mods_manager::import_mod,
            mods_manager::search_modrinth,
            mods_manager::install_from_modrinth,
            // Loader commands
            loaders::install_fabric,
            loaders::install_quilt,
            loaders::install_forge,
            loaders::install_neoforge,
            loaders::get_available_loader_versions,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
