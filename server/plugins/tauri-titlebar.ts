export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:html', (html) => {
    // We only inject the static titlebar style into the head
    html.head.push(`
    <style id="static-tauri-titlebar-style">
      #static-tauri-titlebar {
        display: none;
        height: 32px;
        background: var(--color-surface, #0d0d1e);
        border-bottom: 1px solid var(--color-border, #1e1e40);
        user-select: none;
        justify-content: space-between;
        align-items: center;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 99999;
      }
      #static-tauri-titlebar .left {
        display: flex;
        align-items: center;
        padding-left: 12px;
        gap: 8px;
        height: 100%;
        -webkit-app-region: drag;
      }
      #static-tauri-titlebar .left img {
        width: 16px;
        height: 16px;
        pointer-events: none;
      }
      #static-tauri-titlebar .left span {
        font-size: 12px;
        font-weight: 600;
        color: var(--color-primary, hsl(262, 80%, 55%));
        pointer-events: none;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      #static-tauri-titlebar .middle {
        flex: 1;
        height: 100%;
        -webkit-app-region: drag;
        display: flex;
        justify-content: center;
        align-items: center;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 12px;
        font-weight: 500;
        color: var(--color-text-secondary, #9494c7);
      }
      #static-tauri-titlebar .right {
        display: flex;
        height: 100%;
      }
      #static-tauri-titlebar .button {
        display: inline-flex;
        justify-content: center;
        align-items: center;
        width: 46px;
        height: 100%;
        color: var(--color-text-primary, #e8e8ff);
        transition: background 0.1s;
      }
      #static-tauri-titlebar .button:hover {
        background: var(--color-surface-hover, #121230);
      }
      #static-tauri-titlebar .button.close:hover {
        background: #e81123;
        color: white;
      }
    </style>
    `);

    // We inject the static titlebar HTML at the beginning of the body
    html.bodyPrepend.push(`
    <div id="static-tauri-titlebar" data-tauri-drag-region>
      <div class="left" data-tauri-drag-region>
        <img src="/logo.webp" alt="Logo" />
        <span>ranzaKord</span>
      </div>
      <div class="middle" data-tauri-drag-region id="static-tauri-titlebar-title"></div>
      <div class="right">
        <!-- Static placeholders for buttons -->
        <div class="button"><svg width="10" height="10" viewBox="0 0 10 10"><path d="M 0 5 h 10" stroke="currentColor" stroke-width="1.5"/></svg></div>
        <div class="button"><svg width="10" height="10" viewBox="0 0 10 10"><rect x="0.5" y="0.5" width="9" height="9" fill="none" stroke="currentColor" stroke-width="1"/></svg></div>
        <div class="button close"><svg width="10" height="10" viewBox="0 0 10 10"><path d="M 1 1 l 8 8 M 9 1 l -8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></div>
      </div>
    </div>
    <script id="static-tauri-titlebar-script">
      if (window.__TAURI_INTERNALS__) {
        document.getElementById('static-tauri-titlebar').style.display = 'flex';
        document.documentElement.style.setProperty('--titlebar-height', '32px');
      }
    </script>
    `);
  });
});
