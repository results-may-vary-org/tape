use serde::Serialize;
use std::fs;
use std::io::{Read, Write};
use std::path::{Path, PathBuf};

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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            pick_root,
            list_tree,
            read_note,
            write_note,
            create_folder,
            create_note,
            rename_path,
            delete_path
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
