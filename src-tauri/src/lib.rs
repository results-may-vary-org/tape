use serde::{Deserialize, Serialize};
use std::fs;
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use tauri::Manager;

#[derive(Serialize, Debug, Clone)]
pub struct Node {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub children: Option<Vec<Node>>, // present only for directories
}

fn safe_join(root: &Path, target: &Path) -> Result<PathBuf, String> {
    use std::path::Component;
    let root = root
        .canonicalize()
        .map_err(|e| format!("Invalid root: {}", e))?;
    let joined = if target.is_absolute() {
        target.to_path_buf()
    } else {
        root.join(target)
    };
    // reject parent directory components to avoid escapes when the path doesn't exist yet
    if joined.components().any(|c| matches!(c, Component::ParentDir)) {
        return Err("Invalid path".into());
    }
    // canonicalize if exists for a robust check
    let check_path = if joined.exists() {
        joined
            .canonicalize()
            .map_err(|e| format!("Invalid path: {}", e))?
    } else {
        joined.clone()
    };
    if !check_path.starts_with(&root) {
        return Err("Path escapes root".into());
    }
    Ok(joined)
}

fn build_tree(dir: &Path) -> Result<Vec<Node>, String> {
    let mut entries: Vec<Node> = vec![];
    let read_dir = fs::read_dir(dir).map_err(|e| format!("read_dir failed: {}", e))?;
    for entry in read_dir {
        let entry = entry.map_err(|e| format!("dir entry error: {}", e))?;
        let path = entry.path();
        let name = entry
            .file_name()
            .to_string_lossy()
            .to_string();
        if path.is_dir() {
            let children = build_tree(&path)?;
            entries.push(Node {
                name,
                path: path.to_string_lossy().to_string(),
                is_dir: true,
                children: Some(children),
            });
        } else if path
            .extension()
            .and_then(|s| s.to_str())
            .map(|ext| ext.eq_ignore_ascii_case("md"))
            .unwrap_or(false)
        {
            entries.push(Node {
                name,
                path: path.to_string_lossy().to_string(),
                is_dir: false,
                children: None,
            });
        }
    }
    // sort: dirs first, then files, both alphabetically
    entries.sort_by(|a, b| match (a.is_dir, b.is_dir) {
        (true, false) => std::cmp::Ordering::Less,
        (false, true) => std::cmp::Ordering::Greater,
        _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
    });
    Ok(entries)
}

#[tauri::command]
fn list_tree(root: String) -> Result<Vec<Node>, String> {
    let root_path = PathBuf::from(&root);
    let root_dir = match root_path.canonicalize() {
        Ok(c) => c,
        Err(_) => root_path.clone(),
    };
    if !root_dir.exists() || !root_dir.is_dir() {
        return Err("Root doesn't exist or is not a directory".into());
    }
    build_tree(&root_dir)
}

#[tauri::command]
fn read_note(root: String, path: String) -> Result<String, String> {
    let root_path = PathBuf::from(root);
    let target = safe_join(&root_path, Path::new(&path))?;
    let mut file = fs::File::open(&target).map_err(|e| format!("open failed: {}", e))?;
    let mut content = String::new();
    file.read_to_string(&mut content)
        .map_err(|e| format!("read failed: {}", e))?;
    Ok(content)
}

#[tauri::command]
fn write_note(root: String, path: String, content: String) -> Result<(), String> {
    let root_path = PathBuf::from(root);
    let target = safe_join(&root_path, Path::new(&path))?;
    let mut file = fs::File::create(&target).map_err(|e| format!("create failed: {}", e))?;
    file.write_all(content.as_bytes())
        .map_err(|e| format!("write failed: {}", e))?;
    Ok(())
}

#[tauri::command]
fn create_folder(root: String, parent: String, name: String) -> Result<String, String> {
    let root_path = PathBuf::from(root);
    let parent_path = safe_join(&root_path, Path::new(&parent))?;

    let trimmed = name.trim();
    if trimmed.is_empty() {
        return Err("Nom invalide".into());
    }
    if trimmed.contains(['/', '\\']) || trimmed == "." || trimmed == ".." {
        return Err("Nom invalide".into());
    }

    let new_dir = parent_path.join(trimmed);
    if new_dir.exists() {
        return Err("Un fichier ou dossier du même nom existe déjà".into());
    }

    fs::create_dir(&new_dir).map_err(|e| format!("mkdir failed: {}", e))?;
    Ok(new_dir.to_string_lossy().to_string())
}

#[tauri::command]
fn create_note(root: String, dir: String, name: String) -> Result<String, String> {
    let root_path = PathBuf::from(root);
    let dir_path = safe_join(&root_path, Path::new(&dir))?;
    fs::create_dir_all(&dir_path).map_err(|e| format!("ensure dir failed: {}", e))?;

    let trimmed = name.trim();
    if trimmed.is_empty() {
        return Err("Nom invalide".into());
    }
    if trimmed.contains(['/', '\\']) || trimmed == "." || trimmed == ".." {
        return Err("Nom invalide".into());
    }

    // Ensure .md extension exactly once
    let mut base = trimmed.to_string();
    if let Some(dot) = base.rfind('.') {
        // strip any provided extension; we control it to avoid mistakes
        base = base[..dot].to_string();
    }
    if base.trim().is_empty() {
        return Err("Nom invalide".into());
    }

    let file_name = format!("{}.md", base);
    let file_path = dir_path.join(file_name);
    if file_path.exists() {
        return Err("Un fichier ou dossier du même nom existe déjà".into());
    }

    fs::File::create(&file_path).map_err(|e| format!("create note failed: {}", e))?;
    Ok(file_path.to_string_lossy().to_string())
}

#[tauri::command]
fn rename_path(root: String, path: String, new_name: String) -> Result<String, String> {
    let root_path = PathBuf::from(root);
    let target = safe_join(&root_path, Path::new(&path))?;
    let parent = target
        .parent()
        .ok_or_else(|| "Invalid path".to_string())?
        .to_path_buf();

    let trimmed = new_name.trim();
    if trimmed.is_empty() {
        return Err("Nom invalide".into());
    }
    if trimmed.contains(['/', '\\']) || trimmed == "." || trimmed == ".." {
        return Err("Nom invalide".into());
    }

    // Prepare base name: only strip a user-typed extension if the target is a file
    let base: String = if target.is_file() {
        if let Some(dot) = trimmed.rfind('.') { trimmed[..dot].to_string() } else { trimmed.to_string() }
    } else {
        trimmed.to_string()
    };
    if base.trim().is_empty() {
        return Err("Nom invalide".into());
    }

    // Determine final name
    let final_name = if target.is_file() {
        if let Some(ext_os) = target.extension() {
            let ext = ext_os.to_string_lossy();
            if ext.is_empty() {
                base.clone()
            } else {
                format!("{}.{}", base, ext)
            }
        } else {
            base.clone()
        }
    } else {
        base.clone()
    };

    let new_path = parent.join(final_name);

    if new_path == target {
        return Ok(new_path.to_string_lossy().to_string());
    }
    if new_path.exists() {
        return Err("Un fichier ou dossier du même nom existe déjà".into());
    }

    fs::rename(&target, &new_path).map_err(|e| format!("rename failed: {}", e))?;
    Ok(new_path.to_string_lossy().to_string())
}

#[tauri::command]
fn delete_path(root: String, path: String) -> Result<(), String> {
    let root_path = PathBuf::from(root);
    let target = safe_join(&root_path, Path::new(&path))?;
    if target.is_dir() {
        fs::remove_dir_all(&target).map_err(|e| format!("rmdir failed: {}", e))?
    } else if target.exists() {
        fs::remove_file(&target).map_err(|e| format!("unlink failed: {}", e))?
    }
    Ok(())
}

#[tauri::command]
fn pick_root() -> Option<String> {
    rfd::FileDialog::new().pick_folder().map(|p| p.to_string_lossy().to_string())
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
#[serde(default)] // Allow missing fields when deserializing from older configs
struct Settings {
    view_mode: String,
    show_line_numbers: bool,
    relative_line_numbers: bool,
    show_config_in_sidebar: bool,
    last_note_path: Option<String>,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            view_mode: "edit".to_string(),
            show_line_numbers: true,
            relative_line_numbers: false,
            show_config_in_sidebar: false,
            last_note_path: None,
        }
    }
}

fn config_path(root: &Path) -> PathBuf {
    root.join("carnet.config.json")
}

fn load_or_init_config(root: &Path) -> Result<Settings, String> {
    let path = config_path(root);
    if !path.exists() {
        let defaults = Settings::default();
        let json = serde_json::to_string_pretty(&defaults).map_err(|e| e.to_string())?;
        fs::write(&path, json).map_err(|e| format!("write config failed: {}", e))?;
        return Ok(defaults);
    }
    let data = fs::read_to_string(&path).map_err(|e| format!("read config failed: {}", e))?;
    match serde_json::from_str::<Settings>(&data) {
        Ok(s) => Ok(s),
        Err(_) => {
            // If invalid, overwrite with defaults
            let defaults = Settings::default();
            let json = serde_json::to_string_pretty(&defaults).map_err(|e| e.to_string())?;
            fs::write(&path, json).map_err(|e| format!("write config failed: {}", e))?;
            Ok(defaults)
        }
    }
}

fn save_config(root: &Path, settings: &Settings) -> Result<(), String> {
    let path = config_path(root);
    let json = serde_json::to_string_pretty(settings).map_err(|e| e.to_string())?;
    fs::write(&path, json).map_err(|e| format!("write config failed: {}", e))
}

#[tauri::command]
fn get_settings(root: String) -> Result<Settings, String> {
    let root_path = PathBuf::from(root);
    if !root_path.exists() || !root_path.is_dir() {
        return Err("Root doesn't exist or is not a directory".into());
    }
    load_or_init_config(&root_path)
}

#[tauri::command]
fn save_settings(root: String, settings: Settings) -> Result<(), String> {
    let root_path = PathBuf::from(root);
    if !root_path.exists() || !root_path.is_dir() {
        return Err("Root doesn't exist or is not a directory".into());
    }
    save_config(&root_path, &settings)
}

#[tauri::command]
fn get_last_root(app: tauri::AppHandle) -> Result<Option<String>, String> {
    use std::fs;
    use std::io::Read;
    let resolver = app.path();
    let dir = resolver
        .app_config_dir()
        .map_err(|e| format!("Cannot resolve app config dir: {}", e))?;
    if !dir.exists() {
        return Ok(None);
    }
    let path = dir.join("settings.json");
    if !path.exists() {
        return Ok(None);
    }
    let mut file = fs::File::open(&path).map_err(|e| format!("open settings failed: {}", e))?;
    let mut data = String::new();
    file.read_to_string(&mut data)
        .map_err(|e| format!("read settings failed: {}", e))?;
    #[derive(Deserialize)]
    struct Global { last_root: Option<String> }
    let parsed: Global = serde_json::from_str(&data).unwrap_or(Global { last_root: None });
    Ok(parsed.last_root)
}

#[tauri::command]
fn save_last_root(app: tauri::AppHandle, root: Option<String>) -> Result<(), String> {
    use std::fs;
    use std::io::Write;
    let resolver = app.path();
    let dir = resolver
        .app_config_dir()
        .map_err(|e| format!("Cannot resolve app config dir: {}", e))?;
    if !dir.exists() {
        fs::create_dir_all(&dir).map_err(|e| format!("create config dir failed: {}", e))?;
    }
    let path = dir.join("settings.json");
    #[derive(Serialize)]
    struct Global<'a> { last_root: Option<&'a String> }
    let json = serde_json::to_string_pretty(&Global { last_root: root.as_ref() })
        .map_err(|e| e.to_string())?;
    let mut file = fs::File::create(&path).map_err(|e| format!("write settings failed: {}", e))?;
    file.write_all(json.as_bytes())
        .map_err(|e| format!("write settings failed: {}", e))?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1"); // https://github.com/tauri-apps/tauri/issues/11994
    std::env::set_var("WEBKIT_DISABLE_COMPOSITING_MODE", "1"); // alternatively `WEBKIT_DISABLE_COMPOSITING_MODE` if this one is not enough
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            pick_root,
            list_tree,
            read_note,
            write_note,
            create_folder,
            create_note,
            rename_path,
            delete_path,
            get_settings,
            save_settings,
            get_last_root,
            save_last_root,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
