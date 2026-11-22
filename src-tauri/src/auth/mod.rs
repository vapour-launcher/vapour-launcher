use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::Emitter;
use uuid::Uuid;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Account {
    pub uuid: String,
    pub username: String,
    pub access_token: String,
    pub account_type: String,
    pub skin_url: Option<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct AccountStore {
    pub accounts: Vec<Account>,
    pub active: Option<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
struct DeviceCodePayload {
    user_code: String,
    device_code: String,
    verification_uri: String,
    expires_in: u64,
    interval: u64,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
struct DeviceCodeEvent {
    user_code: String,
    verification_uri: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
struct MsTokenResponse {
    access_token: String,
    refresh_token: Option<String>,
    token_type: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
struct MsTokenErrorResponse {
    error: String,
    error_description: Option<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
struct XboxLiveAuthResponse {
    #[serde(rename = "Token")]
    token: String,
    #[serde(rename = "DisplayClaims")]
    display_claims: serde_json::Value,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
struct MinecraftAuthResponse {
    access_token: String,
    token_type: String,
    expires_in: u64,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
struct MinecraftProfile {
    id: String,
    name: String,
    skins: Option<Vec<SkinInfo>>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
struct SkinInfo {
    url: Option<String>,
    state: Option<String>,
}

fn get_data_dir(_app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = dirs::data_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("vapour-launcher");
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir)
}

fn get_accounts_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = get_data_dir(app)?;
    Ok(dir.join("accounts.json"))
}

pub fn load_accounts(app: &tauri::AppHandle) -> Result<AccountStore, String> {
    let path = get_accounts_path(app)?;
    if path.exists() {
        let data = fs::read_to_string(&path).map_err(|e| e.to_string())?;
        serde_json::from_str(&data).map_err(|e| e.to_string())
    } else {
        Ok(AccountStore {
            accounts: Vec::new(),
            active: None,
        })
    }
}

pub fn save_accounts(app: &tauri::AppHandle, store: &AccountStore) -> Result<(), String> {
    let path = get_accounts_path(app)?;
    let data = serde_json::to_string_pretty(store).map_err(|e| e.to_string())?;
    fs::write(&path, data).map_err(|e| e.to_string())
}

// Microsoft OAuth client ID - this is the public Minecraft launcher client ID
const MS_CLIENT_ID: &str = "00000000402b5328";
const MS_DEVICE_CODE_URL: &str = "https://login.microsoftonline.com/consumers/oauth2/v2.0/devicecode";
const MS_TOKEN_URL: &str = "https://login.microsoftonline.com/consumers/oauth2/v2.0/token";
const XBOX_LIVE_AUTH_URL: &str = "https://user.auth.xboxlive.com/user/authenticate";
const XSTS_AUTH_URL: &str = "https://xsts.auth.xboxlive.com/xsts/authorize";
const MC_AUTH_URL: &str = "https://api.minecraftservices.com/authentication/login_with_xbox";
const MC_PROFILE_URL: &str = "https://api.minecraftservices.com/minecraft/profile";

#[tauri::command]
pub async fn login_microsoft(app: tauri::AppHandle) -> Result<Account, String> {
    let client = reqwest::Client::new();

    // Step 1: Request device code
    let device_code_resp = client
        .post(MS_DEVICE_CODE_URL)
        .form(&[
            ("client_id", MS_CLIENT_ID),
            ("scope", "XboxLive.signin offline_access"),
        ])
        .send()
        .await
        .map_err(|e| format!("Failed to request device code: {}", e))?;

    let device_code_text = device_code_resp.text().await.map_err(|e| e.to_string())?;
    let device_code: DeviceCodePayload =
        serde_json::from_str(&device_code_text).map_err(|e| format!("Failed to parse device code response: {} - body: {}", e, device_code_text))?;

    // Emit device code event so frontend can show user the code
    let _ = app.emit(
        "auth:device-code",
        DeviceCodeEvent {
            user_code: device_code.user_code.clone(),
            verification_uri: device_code.verification_uri.clone(),
        },
    );

    // Step 2: Poll for token
    let interval = std::cmp::max(device_code.interval, 5);
    let deadline = std::time::Instant::now() + std::time::Duration::from_secs(device_code.expires_in);
    let ms_token: MsTokenResponse;

    loop {
        if std::time::Instant::now() > deadline {
            return Err("Device code expired. Please try again.".to_string());
        }

        tokio::time::sleep(std::time::Duration::from_secs(interval)).await;

        let poll_resp = client
            .post(MS_TOKEN_URL)
            .form(&[
                ("client_id", MS_CLIENT_ID),
                ("grant_type", "urn:ietf:params:oauth:grant-type:device_code"),
                ("device_code", device_code.device_code.as_str()),
            ])
            .send()
            .await
            .map_err(|e| format!("Token poll failed: {}", e))?;

        let poll_text = poll_resp.text().await.map_err(|e| e.to_string())?;

        // Try to parse as success
        if let Ok(token) = serde_json::from_str::<MsTokenResponse>(&poll_text) {
            ms_token = token;
            break;
        }

        // Try to parse as error
        if let Ok(err) = serde_json::from_str::<MsTokenErrorResponse>(&poll_text) {
            match err.error.as_str() {
                "authorization_pending" => continue,
                "slow_down" => {
                    tokio::time::sleep(std::time::Duration::from_secs(5)).await;
                    continue;
                }
                "authorization_declined" => {
                    return Err("User declined authorization.".to_string());
                }
                "expired_token" => {
                    return Err("Device code expired. Please try again.".to_string());
                }
                _ => {
                    return Err(format!(
                        "Authentication error: {} - {}",
                        err.error,
                        err.error_description.unwrap_or_default()
                    ));
                }
            }
        }

        return Err(format!("Unexpected token response: {}", poll_text));
    }

    // Step 3: Xbox Live authentication
    let xbox_body = serde_json::json!({
        "Properties": {
            "AuthMethod": "RPS",
            "SiteName": "user.auth.xboxlive.com",
            "RpsTicket": format!("d={}", ms_token.access_token)
        },
        "RelyingParty": "http://auth.xboxlive.com",
        "TokenType": "JWT"
    });

    let xbox_resp = client
        .post(XBOX_LIVE_AUTH_URL)
        .header("Content-Type", "application/json")
        .header("Accept", "application/json")
        .json(&xbox_body)
        .send()
        .await
        .map_err(|e| format!("Xbox Live auth failed: {}", e))?;

    let xbox_data: XboxLiveAuthResponse = xbox_resp
        .json()
        .await
        .map_err(|e| format!("Failed to parse Xbox Live response: {}", e))?;

    let xbox_token = &xbox_data.token;
    let user_hash = xbox_data.display_claims["xui"][0]["uhs"]
        .as_str()
        .ok_or_else(|| "Failed to get Xbox user hash".to_string())?
        .to_string();

    // Step 4: XSTS token
    let xsts_body = serde_json::json!({
        "Properties": {
            "SandboxId": "RETAIL",
            "UserTokens": [xbox_token]
        },
        "RelyingParty": "rp://api.minecraftservices.com/",
        "TokenType": "JWT"
    });

    let xsts_resp = client
        .post(XSTS_AUTH_URL)
        .header("Content-Type", "application/json")
        .header("Accept", "application/json")
        .json(&xsts_body)
        .send()
        .await
        .map_err(|e| format!("XSTS auth failed: {}", e))?;

    let xsts_status = xsts_resp.status();
    if !xsts_status.is_success() {
        let err_text = xsts_resp.text().await.unwrap_or_default();
        return Err(format!("XSTS authentication failed ({}): {}", xsts_status, err_text));
    }

    let xsts_data: XboxLiveAuthResponse = xsts_resp
        .json()
        .await
        .map_err(|e| format!("Failed to parse XSTS response: {}", e))?;

    // Step 5: Minecraft authentication
    let mc_body = serde_json::json!({
        "identityToken": format!("XBL3.0 x={};{}", user_hash, xsts_data.token)
    });

    let mc_resp = client
        .post(MC_AUTH_URL)
        .header("Content-Type", "application/json")
        .json(&mc_body)
        .send()
        .await
        .map_err(|e| format!("Minecraft auth failed: {}", e))?;

    let mc_data: MinecraftAuthResponse = mc_resp
        .json()
        .await
        .map_err(|e| format!("Failed to parse Minecraft auth response: {}", e))?;

    // Step 6: Get Minecraft profile
    let profile_resp = client
        .get(MC_PROFILE_URL)
        .header("Authorization", format!("Bearer {}", mc_data.access_token))
        .send()
        .await
        .map_err(|e| format!("Failed to get Minecraft profile: {}", e))?;

    let profile_status = profile_resp.status();
    if !profile_status.is_success() {
        return Err(format!(
            "This Microsoft account does not own Minecraft (status {})",
            profile_status
        ));
    }

    let profile: MinecraftProfile = profile_resp
        .json()
        .await
        .map_err(|e| format!("Failed to parse Minecraft profile: {}", e))?;

    let skin_url = profile
        .skins
        .as_ref()
        .and_then(|skins| skins.first())
        .and_then(|skin| skin.url.clone());

    let account = Account {
        uuid: profile.id,
        username: profile.name,
        access_token: mc_data.access_token,
        account_type: "microsoft".to_string(),
        skin_url,
    };

    // Save account
    let mut store = load_accounts(&app)?;
    // Remove existing account with same UUID
    store.accounts.retain(|a| a.uuid != account.uuid);
    store.accounts.push(account.clone());
    if store.active.is_none() {
        store.active = Some(account.uuid.clone());
    }
    save_accounts(&app, &store)?;

    Ok(account)
}

#[tauri::command]
pub async fn login_offline(username: String, app: tauri::AppHandle) -> Result<Account, String> {
    if username.is_empty() {
        return Err("Username cannot be empty".to_string());
    }
    if username.len() > 16 {
        return Err("Username cannot be longer than 16 characters".to_string());
    }
    if !username.chars().all(|c| c.is_alphanumeric() || c == '_') {
        return Err("Username can only contain letters, numbers, and underscores".to_string());
    }

    let offline_uuid = Uuid::new_v4().to_string().replace('-', "");

    let account = Account {
        uuid: offline_uuid,
        username: username.clone(),
        access_token: "offline".to_string(),
        account_type: "offline".to_string(),
        skin_url: None,
    };

    let mut store = load_accounts(&app)?;
    store.accounts.push(account.clone());
    if store.active.is_none() {
        store.active = Some(account.uuid.clone());
    }
    save_accounts(&app, &store)?;

    Ok(account)
}

#[tauri::command]
pub async fn logout(uuid: String, app: tauri::AppHandle) -> Result<(), String> {
    let mut store = load_accounts(&app)?;
    store.accounts.retain(|a| a.uuid != uuid);
    if store.active.as_deref() == Some(&uuid) {
        store.active = store.accounts.first().map(|a| a.uuid.clone());
    }
    save_accounts(&app, &store)?;
    Ok(())
}

#[tauri::command]
pub async fn get_accounts(app: tauri::AppHandle) -> Result<Vec<Account>, String> {
    let store = load_accounts(&app)?;
    Ok(store.accounts)
}

#[tauri::command]
pub async fn get_active_account(app: tauri::AppHandle) -> Result<Option<Account>, String> {
    let store = load_accounts(&app)?;
    let active = store
        .active
        .as_ref()
        .and_then(|uuid| store.accounts.iter().find(|a| &a.uuid == uuid))
        .cloned();
    Ok(active)
}
