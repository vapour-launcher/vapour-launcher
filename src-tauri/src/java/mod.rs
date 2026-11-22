use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::process::Command;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct JavaRuntime {
    pub path: String,
    pub version: String,
    pub arch: String,
    pub is_64bit: bool,
}

fn parse_java_version(output: &str) -> Option<(String, String, bool)> {
    // Try to parse version from `java -version` stderr output
    // Typical output: openjdk version "17.0.1" 2021-10-19
    //                 OpenJDK Runtime Environment ...
    //                 OpenJDK 64-Bit Server VM ...
    let mut version = String::new();
    let mut arch = String::new();
    let mut is_64bit = false;

    for line in output.lines() {
        let line_lower = line.to_lowercase();
        if version.is_empty()
            && (line_lower.contains("version") || line_lower.contains("openjdk") || line_lower.contains("java"))
        {
            // Extract version string between quotes
            if let Some(start) = line.find('"') {
                if let Some(end) = line[start + 1..].find('"') {
                    version = line[start + 1..start + 1 + end].to_string();
                }
            }
        }
        if line_lower.contains("64-bit") || line_lower.contains("64bit") || line_lower.contains("amd64") || line_lower.contains("x86_64") || line_lower.contains("aarch64") {
            is_64bit = true;
        }
        if line_lower.contains("aarch64") || line_lower.contains("arm64") {
            arch = "aarch64".to_string();
        } else if line_lower.contains("amd64") || line_lower.contains("x86_64") {
            arch = "x86_64".to_string();
        } else if line_lower.contains("x86") || line_lower.contains("i386") || line_lower.contains("i686") {
            arch = "x86".to_string();
        }
    }

    if arch.is_empty() {
        arch = if cfg!(target_arch = "x86_64") {
            "x86_64".to_string()
        } else if cfg!(target_arch = "aarch64") {
            "aarch64".to_string()
        } else {
            "unknown".to_string()
        };
    }

    if version.is_empty() {
        None
    } else {
        Some((version, arch, is_64bit))
    }
}

fn probe_java(java_path: &str) -> Option<JavaRuntime> {
    let output = Command::new(java_path)
        .arg("-version")
        .output()
        .ok()?;

    // java -version outputs to stderr
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let combined = format!("{}\n{}", stderr, stdout);

    let (version, arch, is_64bit) = parse_java_version(&combined)?;

    Some(JavaRuntime {
        path: java_path.to_string(),
        version,
        arch,
        is_64bit,
    })
}

fn get_java_major_version(version: &str) -> u32 {
    // Parse major version from strings like "17.0.1", "1.8.0_292", "21"
    let parts: Vec<&str> = version.split('.').collect();
    if let Some(first) = parts.first() {
        if let Ok(major) = first.parse::<u32>() {
            if major == 1 && parts.len() > 1 {
                // Old format: 1.8.x means Java 8
                parts[1].parse::<u32>().unwrap_or(0)
            } else {
                major
            }
        } else {
            0
        }
    } else {
        0
    }
}

#[tauri::command]
pub async fn detect_java_runtimes() -> Result<Vec<JavaRuntime>, String> {
    let mut runtimes: Vec<JavaRuntime> = Vec::new();
    let mut seen_paths: std::collections::HashSet<String> = std::collections::HashSet::new();

    let mut candidates: Vec<String> = Vec::new();

    // Check JAVA_HOME
    if let Ok(java_home) = std::env::var("JAVA_HOME") {
        candidates.push(format!("{}/bin/java", java_home));
    }

    // Linux paths
    if cfg!(target_os = "linux") || cfg!(target_os = "macos") {
        // /usr/lib/jvm/*
        if let Ok(entries) = std::fs::read_dir("/usr/lib/jvm") {
            for entry in entries.flatten() {
                let path = entry.path().join("bin").join("java");
                if path.exists() {
                    candidates.push(path.to_string_lossy().to_string());
                }
            }
        }
        // SDKMAN
        if let Ok(home) = std::env::var("HOME") {
            let sdkman_dir = PathBuf::from(&home).join(".sdkman/candidates/java");
            if sdkman_dir.exists() {
                if let Ok(entries) = std::fs::read_dir(&sdkman_dir) {
                    for entry in entries.flatten() {
                        let path = entry.path().join("bin").join("java");
                        if path.exists() {
                            candidates.push(path.to_string_lossy().to_string());
                        }
                    }
                }
            }
            // Common adoptium/temurin paths
            let adoptium_dir = PathBuf::from(&home).join(".jdks");
            if adoptium_dir.exists() {
                if let Ok(entries) = std::fs::read_dir(&adoptium_dir) {
                    for entry in entries.flatten() {
                        let path = entry.path().join("bin").join("java");
                        if path.exists() {
                            candidates.push(path.to_string_lossy().to_string());
                        }
                    }
                }
            }
        }
        // macOS specific
        if cfg!(target_os = "macos") {
            let mac_jvm_dir = PathBuf::from("/Library/Java/JavaVirtualMachines");
            if mac_jvm_dir.exists() {
                if let Ok(entries) = std::fs::read_dir(&mac_jvm_dir) {
                    for entry in entries.flatten() {
                        let path = entry.path().join("Contents/Home/bin/java");
                        if path.exists() {
                            candidates.push(path.to_string_lossy().to_string());
                        }
                    }
                }
            }
        }
        // System java
        candidates.push("/usr/bin/java".to_string());
    }

    // Windows paths
    if cfg!(target_os = "windows") {
        let program_files = vec![
            std::env::var("ProgramFiles").unwrap_or_else(|_| "C:\\Program Files".to_string()),
            std::env::var("ProgramFiles(x86)").unwrap_or_else(|_| "C:\\Program Files (x86)".to_string()),
            std::env::var("LOCALAPPDATA").unwrap_or_default(),
        ];
        let java_dirs = vec!["Java", "Eclipse Adoptium", "AdoptOpenJDK", "Zulu", "Microsoft"];

        for pf in &program_files {
            if pf.is_empty() {
                continue;
            }
            for jd in &java_dirs {
                let base = PathBuf::from(pf).join(jd);
                if base.exists() {
                    if let Ok(entries) = std::fs::read_dir(&base) {
                        for entry in entries.flatten() {
                            let path = entry.path().join("bin").join("java.exe");
                            if path.exists() {
                                candidates.push(path.to_string_lossy().to_string());
                            }
                        }
                    }
                }
            }
        }
    }

    // Also check PATH
    if let Ok(output) = Command::new(if cfg!(target_os = "windows") { "where" } else { "which" })
        .arg("java")
        .output()
    {
        let stdout = String::from_utf8_lossy(&output.stdout);
        for line in stdout.lines() {
            let trimmed = line.trim();
            if !trimmed.is_empty() {
                candidates.push(trimmed.to_string());
            }
        }
    }

    // Probe each candidate
    for candidate in candidates {
        // Resolve symlinks
        let resolved = std::fs::canonicalize(&candidate)
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_else(|_| candidate.clone());

        if seen_paths.contains(&resolved) {
            continue;
        }
        seen_paths.insert(resolved.clone());

        if let Some(mut runtime) = probe_java(&candidate) {
            runtime.path = candidate;
            runtimes.push(runtime);
        }
    }

    // Sort by version descending
    runtimes.sort_by(|a, b| {
        let a_major = get_java_major_version(&a.version);
        let b_major = get_java_major_version(&b.version);
        b_major.cmp(&a_major)
    });

    Ok(runtimes)
}

#[tauri::command]
pub async fn get_java_for_version(mc_version: String) -> Result<Option<JavaRuntime>, String> {
    // Determine required Java version based on MC version
    let required_major = get_required_java_version(&mc_version);

    let runtimes = detect_java_runtimes().await?;

    // Try exact match first
    for rt in &runtimes {
        let major = get_java_major_version(&rt.version);
        if major == required_major && rt.is_64bit {
            return Ok(Some(rt.clone()));
        }
    }

    // Try any compatible (>= required)
    for rt in &runtimes {
        let major = get_java_major_version(&rt.version);
        if major >= required_major && rt.is_64bit {
            return Ok(Some(rt.clone()));
        }
    }

    // Try any 64-bit Java
    for rt in &runtimes {
        if rt.is_64bit {
            return Ok(Some(rt.clone()));
        }
    }

    // Return first available
    Ok(runtimes.into_iter().next())
}

fn get_required_java_version(mc_version: &str) -> u32 {
    // Parse MC version to determine Java requirement
    // MC 1.21+ requires Java 21
    // MC 1.18-1.20.x requires Java 17
    // MC 1.17 requires Java 16
    // MC 1.12-1.16.5 requires Java 8
    // Older versions require Java 8

    let parts: Vec<&str> = mc_version.split('.').collect();
    if parts.len() < 2 {
        return 17; // Default
    }

    let minor: u32 = parts[1].parse().unwrap_or(0);

    // Handle snapshot/pre-release versions
    if parts[0] != "1" {
        // Could be a snapshot like "24w10a"
        return 21;
    }

    match minor {
        0..=16 => 8,
        17 => 16,
        18..=20 => 17,
        _ => 21, // 1.21+
    }
}
