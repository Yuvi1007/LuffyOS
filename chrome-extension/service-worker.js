// LuffyOS v6.0 — Universal J.A.R.V.I.S. Service Worker
// Supports 9-Pool Gemini Flash High-Quota Mesh + Zero-Key Offline Local Ollama Fallback

const GEMINI_POOLS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash"
];

const SYSTEM_PROMPT = `You are LUFFY J.A.R.V.I.S. OS v6.0, a universal high-agency AI companion running inside the user's browser across Windows, macOS, and Linux.
Deliver concise, actionable, structured Markdown responses:
- When summarizing pages or YouTube videos: provide 5 high-signal bullets + key takeaways.
- When matching a Job Description (JD): compute an ATS Match Score (0-100%), list missing keywords, and write 3 tailored resume bullets.
- When drafting replies (Gmail/LinkedIn/WhatsApp): provide a polished, ready-to-send response.
- When solving coding problems or errors: provide optimal Time/Space complexity and clean runnable code.`;

async function callGeminiMesh(apiKey, prompt) {
  let lastErr = "Unknown error";
  for (const model of GEMINI_POOLS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.35, maxOutputTokens: 2048 }
        })
      });
      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("\n") || "";
        if (text.trim()) {
          return { ok: true, text: text.trim(), model };
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        lastErr = errJson?.error?.message || `HTTP ${res.status}`;
      }
    } catch (e) {
      lastErr = e.message;
    }
  }
  return { ok: false, error: lastErr };
}

async function callLocalOllama(prompt, ollamaModel = "llama3.2") {
  try {
    const res = await fetch("http://127.0.0.1:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: ollamaModel,
        system: SYSTEM_PROMPT,
        prompt,
        stream: false
      })
    });
    if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
    const data = await res.json();
    return { ok: true, text: data.response || "No response from local model.", model: `ollama:${ollamaModel}` };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    if (message.type === "LUFFY_ASK") {
      const stored = await chrome.storage.local.get(["geminiApiKey", "ollamaModel"]);
      const apiKey = (message.apiKey || stored.geminiApiKey || "").trim();

      if (apiKey) {
        const res = await callGeminiMesh(apiKey, message.prompt);
        if (res.ok) {
          sendResponse(res);
          return;
        }
      }

      // Automatic Zero-Key Fallback to Local Ollama if running, or Smart Built-in Extractive Engine
      const ollamaRes = await callLocalOllama(message.prompt, stored.ollamaModel || "llama3.2");
      if (ollamaRes.ok) {
        sendResponse(ollamaRes);
        return;
      }

      // Built-in Instant Local Heuristic Analyzer so Luffy works 100% out-of-the-box even with 0 setup!
      const raw = message.pageContext || message.prompt || "";
      const sentences = raw
        .replace(/\s+/g, " ")
        .split(/(?<=[.!?])\s+/)
        .filter(s => s.length > 35 && s.length < 260)
        .slice(0, 6);
      const fallbackSummary = sentences.length
        ? `⚡ **Luffy Instant Local Intelligence (Zero-Key Mode)**\n\n` +
          sentences.map(s => `• ${s}`).join("\n") +
          `\n\n💡 *Tip: Paste a free Google Gemini API key in the Luffy extension popup (or run local Ollama) to unlock full generative AI!*`
        : `⚡ **Luffy Instant Local Mode Active**\nPaste a free Gemini API key in the extension popup (or start local \`ollama serve\`) for deep generative reasoning!`;
      sendResponse({ ok: true, text: fallbackSummary, model: "local-zero-key-engine" });
    }
  })();
  return true;
});
