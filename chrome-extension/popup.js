// LuffyOS v6.0 — Popup & Side Panel Controller
(async () => {
  const apiKeyInput = document.getElementById("apiKeyInput");
  const ollamaInput = document.getElementById("ollamaInput");
  const status = document.getElementById("status");

  const stored = await chrome.storage.local.get(["geminiApiKey", "ollamaModel"]);
  if (stored.geminiApiKey) apiKeyInput.value = stored.geminiApiKey;
  if (stored.ollamaModel) ollamaInput.value = stored.ollamaModel;

  document.getElementById("saveBtn").addEventListener("click", async () => {
    await chrome.storage.local.set({
      geminiApiKey: apiKeyInput.value.trim(),
      ollamaModel: ollamaInput.value.trim() || "llama3.2"
    });
    status.textContent = "✓ Saved! Press Alt+L on any tab to summon Luffy.";
  });

  document.getElementById("sidePanelBtn").addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && chrome.sidePanel) {
      await chrome.sidePanel.open({ windowId: tab.windowId });
    }
  });
})();
