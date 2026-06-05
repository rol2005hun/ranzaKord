export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:html', (html) => {
    // We only inject the static titlebar style into the head
    html.head.push(`
    <style id="static-tauri-titlebar-style">
      #static-tauri-titlebar {
        display: none;
        height: 32px;
        background: #1a1a1a;
        border-bottom: 1px solid #333;
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
        color: #999;
        pointer-events: none;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      #static-tauri-titlebar .middle {
        flex: 1;
        height: 100%;
        -webkit-app-region: drag;
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
        color: #999;
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
      <div class="middle" data-tauri-drag-region></div>
      <div class="right">
        <!-- Static placeholders for buttons -->
        <div class="button"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg></div>
        <div class="button"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg></div>
        <div class="button"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></div>
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
