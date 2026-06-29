#[cfg(desktop)]
use discord_rich_presence::{activity, DiscordIpc, DiscordIpcClient};
#[cfg(desktop)]
use std::sync::Mutex;
#[cfg(desktop)]
use tauri::State;

#[cfg(desktop)]
struct DiscordState(Mutex<Option<DiscordIpcClient>>);

#[cfg(desktop)]
#[tauri::command]
fn set_discord_presence(
    state: State<'_, DiscordState>,
    details: String,
    state_str: String,
    large_image: Option<String>,
    button_url: Option<String>,
    start_timestamp: Option<i64>,
    end_timestamp: Option<i64>,
) -> Result<(), String> {
    let mut client_guard = state.0.lock().unwrap();
    if let Some(client) = client_guard.as_mut() {
        let mut activity = activity::Activity::new()
            .details(&details)
            .state(&state_str)
            .activity_type(activity::ActivityType::Listening)
            .status_display_type(activity::StatusDisplayType::State);

        let image = large_image.unwrap_or_else(|| "logo".to_string());
        activity = activity.assets(
            activity::Assets::new()
                .large_image(&image)
                .large_text("ranzaKord"),
        );

        let mut timestamps = activity::Timestamps::new();
        let mut has_timestamps = false;
        if let Some(start) = start_timestamp {
            timestamps = timestamps.start(start);
            has_timestamps = true;
        }
        if let Some(end) = end_timestamp {
            timestamps = timestamps.end(end);
            has_timestamps = true;
        }
        if has_timestamps {
            activity = activity.timestamps(timestamps);
        }

        if let Some(ref url) = button_url {
            activity = activity.buttons(vec![activity::Button::new("Listen on ranzaKord", url)]);
        }

        if let Err(e) = client.set_activity(activity.clone()) {
            eprintln!(
                "[Discord RPC] Failed to set activity: {:?}. Attempting reconnect...",
                e
            );
            let _ = client.close();
            if let Err(e2) = client.connect() {
                eprintln!("[Discord RPC] Failed to connect: {:?}", e2);
            } else if let Err(e3) = client.set_activity(activity) {
                eprintln!(
                    "[Discord RPC] Failed to set activity after connect: {:?}",
                    e3
                );
            }
        }
    }
    Ok(())
}

#[cfg(desktop)]
#[tauri::command]
fn clear_discord_presence(state: State<'_, DiscordState>) -> Result<(), String> {
    let mut client_guard = state.0.lock().unwrap();
    if let Some(client) = client_guard.as_mut() {
        let _ = client.clear_activity();
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[allow(unused_mut)]
    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_process::init());

    #[cfg(desktop)]
    {
        let mut client = DiscordIpcClient::new("1510265493443973140");
        let _ = client.connect();
        
        builder = builder
            .plugin(tauri_plugin_single_instance::init(|_app, _args, _cwd| {
                // The deep link plugin automatically integrates with single instance
                // to trigger the onOpenUrl callback in JavaScript on Windows/Linux.
            }))
            .plugin(tauri_plugin_updater::Builder::new().build())
            .manage(DiscordState(Mutex::new(Some(client))))
            .invoke_handler(tauri::generate_handler![
                set_discord_presence,
                clear_discord_presence
            ]);
    }

    builder
        .plugin(tauri_plugin_deep_link::init())
        .setup(|app| {
            #[cfg(any(windows, target_os = "linux"))]
            {
                use tauri_plugin_deep_link::DeepLinkExt;
                let _ = app.deep_link().register_all();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
