use discord_rich_presence::{activity, DiscordIpc, DiscordIpcClient};
use std::sync::Mutex;
use tauri::State;

struct DiscordState(Mutex<Option<DiscordIpcClient>>);

#[tauri::command]
fn set_discord_presence(
    state: State<'_, DiscordState>,
    details: String,
    state_str: String,
    end_timestamp: Option<i64>,
) -> Result<(), String> {
    let mut client_guard = state.0.lock().unwrap();
    if let Some(client) = client_guard.as_mut() {
        let mut activity = activity::Activity::new()
            .details(&details)
            .state(&state_str)
            .assets(activity::Assets::new().large_image("logo").large_text("ranzaKord Player"));
            
        if let Some(end) = end_timestamp {
            activity = activity.timestamps(activity::Timestamps::new().end(end));
        }

        let _ = client.set_activity(activity);
    }
    Ok(())
}

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
  let mut client = DiscordIpcClient::new("1510265493443973140");
  let _ = client.connect();

  tauri::Builder::default()
    .manage(DiscordState(Mutex::new(Some(client))))
    .invoke_handler(tauri::generate_handler![
        set_discord_presence,
        clear_discord_presence
    ])
    .setup(|_app| {
      if cfg!(debug_assertions) {
        // app.handle().plugin(
        //   tauri_plugin_log::Builder::default()
        //     .level(log::LevelFilter::Info)
        //     .build(),
        // )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
