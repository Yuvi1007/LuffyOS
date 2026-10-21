// LuffyOS v6.0 — Universal Floating J.A.R.V.I.S. Content Script (Windows, Mac, Linux)
(() => {
  if (document.getElementById("luffy-jarvis-root")) return;

  let voiceEnabled = false;
  let isDragging = false;
  let didMove = false;
  let startX = 0, startY = 0, origRight = 20, origBottom = 20;

  const root = document.createElement("div");
  root.id = "luffy-jarvis-root";

  const spriteUrl = chrome.runtime.getURL("icons/luffy-idle.gif");

  root.innerHTML = `
    <div id="luffy-jarvis-hud" class="luffy-hidden">
      <div class="luffy-hud-header">
        <span>⚡ LUFFY J.A.R.V.I.S. // WEB OS (ALT+L)</span>
        <div class="luffy-hud-actions">
          <button class="luffy-pill-btn" id="luffy-voice-btn">🔇 Voice</button>
          <button class="luffy-pill-btn" id="luffy-copy-btn">Copy</button>
          <button class="luffy-pill-btn" id="luffy-close-btn">✕</button>
        </div>
      </div>
      <div id="luffy-jarvis-bubble">⚡ Gear-5 J.A.R.V.I.S. Web Companion Online! Click any superpower below to summarize this page/YouTube video, match a job to your resume, draft a reply, or highlight text and press Explain.</div>
      <div class="luffy-orb-grid">
        <button class="luffy-orb" data-action="summarize">📄 Summarize Page</button>
        <button class="luffy-orb" data-action="youtube">🎬 YouTube Notes</button>
        <button class="luffy-orb" data-action="reply">✉️ Draft Reply</button>
        <button class="luffy-orb" data-action="jd_match">🎯 Job -> ATS Score</button>
        <button class="luffy-orb" data-action="explain">✨ Explain Selection</button>
        <button class="luffy-orb" data-action="code_fix">💻 Solve / Fix Code</button>
      </div>
      <div class="luffy-input-row">
        <input id="luffy-jarvis-input" type="text" placeholder="Ask Luffy anything about this page…" />
        <button class="luffy-pill-btn" id="luffy-mic-btn" title="Voice Input">🎙️</button>
        <button class="luffy-pill-btn" id="luffy-send-btn">⬆️</button>
      </div>
    </div>
    <div id="luffy-avatar-trigger" title="Drag Luffy anywhere on screen · Click or press Alt+L to toggle J.A.R.V.I.S. HUD">
      <button id="luffy-toggle-badge">⚡ J.A.R.V.I.S. (Alt+L)</button>
      <img id="luffy-sprite-img" src="${spriteUrl}" alt="Luffy Companion" draggable="false" />
    </div>
  `;

  document.body.appendChild(root);

  const hud = document.getElementById("luffy-jarvis-hud");
  const bubble = document.getElementById("luffy-jarvis-bubble");
  const input = document.getElementById("luffy-jarvis-input");
  const trigger = document.getElementById("luffy-avatar-trigger");
  const voiceBtn = document.getElementById("luffy-voice-btn");

  function toggleHUD() {
    hud.classList.toggle("luffy-hidden");
    if (!hud.classList.contains("luffy-hidden")) {
      input.focus();
    }
  }

  // Whole-screen drag support for Luffy Avatar
  trigger.addEventListener("mousedown", (e) => {
    isDragging = true;
    didMove = false;
    startX = e.clientX;
    startY = e.clientY;
    const rect = root.getBoundingClientRect();
    origRight = window.innerWidth - rect.right;
    origBottom = window.innerHeight - rect.bottom;
  });

  window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.hypot(dx, dy) > 5) didMove = true;
    if (didMove) {
      root.style.right = `${Math.max(4, origRight - dx)}px`;
      root.style.bottom = `${Math.max(4, origBottom - dy)}px`;
    }
  });

  window.addEventListener("mouseup", () => {
    if (isDragging && !didMove) {
      toggleHUD();
    }
    isDragging = false;
  });

  document.getElementById("luffy-close-btn").addEventListener("click", () => hud.classList.add("luffy-hidden"));

  voiceBtn.addEventListener("click", () => {
    voiceEnabled = !voiceEnabled;
    voiceBtn.textContent = voiceEnabled ? "🔊 Voice ON" : "🔇 Voice";
    if (!voiceEnabled && window.speechSynthesis) window.speechSynthesis.cancel();
  });

  document.getElementById("luffy-copy-btn").addEventListener("click", async () => {
    await navigator.clipboard.writeText(bubble.textContent || "");
    const btn = document.getElementById("luffy-copy-btn");
    btn.textContent = "Copied!";
    setTimeout(() => (btn.textContent = "Copy"), 1400);
  });

  function getPageSnapshot() {
    const sel = window.getSelection()?.toString()?.trim() || "";
    const bodyText = (document.body?.innerText || "").replace(/\s+/g, " ").slice(0, 5000);
    return {
      title: document.title,
      url: location.href,
      selection: sel,
      bodyText
    };
  }

  async function askLuffy(customPrompt) {
    hud.classList.remove("luffy-hidden");
    const snap = getPageSnapshot();
    bubble.textContent = "⚡ J.A.R.V.I.S. analyzing active page…";
    const fullPrompt = `${customPrompt}\n\n[Active Page: ${snap.title} (${snap.url})]\n` +
      (snap.selection ? `[Selected Text]:\n${snap.selection}\n\n` : "") +
      `[Page Excerpt]:\n${snap.bodyText}`;

    chrome.runtime.sendMessage(
      { type: "LUFFY_ASK", prompt: fullPrompt, pageContext: snap.selection || snap.bodyText },
      (res) => {
        const reply = res?.text || res?.error || "Could not reach Luffy background worker.";
        bubble.textContent = reply;
        if (voiceEnabled && window.speechSynthesis) {
          window.speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(reply.replace(/[*#`]/g, "").slice(0, 320));
          window.speechSynthesis.speak(u);
        }
      }
    );
  }

  document.querySelectorAll(".luffy-orb").forEach((btn) => {
    btn.addEventListener("click", () => {
      const act = btn.getAttribute("data-action");
      if (act === "summarize") askLuffy("Summarize this webpage in 5 crisp, high-signal bullets and list the key takeaways.");
      if (act === "youtube") askLuffy("Extract structured study notes, core concepts, and actionable takeaways from this video/lecture page.");
      if (act === "reply") askLuffy("Read the visible message, email, or thread on this page and draft a polite, high-impact reply ready to copy-paste.");
      if (act === "jd_match") askLuffy("Analyze this job/internship posting, compute an ATS Match Score (0-100%), list top skills required, and write 3 tailored resume bullet points.");
      if (act === "explain") askLuffy("Explain the selected text (or main topic of this page) in simple first-principles English with an example.");
      if (act === "code_fix") askLuffy("Solve the coding problem or fix the error shown on this page with optimal time/space complexity and clean runnable code.");
    });
  });

  function submitInput() {
    const val = input.value.trim();
    if (!val) return;
    input.value = "";
    askLuffy(val);
  }

  document.getElementById("luffy-send-btn").addEventListener("click", submitInput);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submitInput();
  });

  // Web Speech API Voice Input
  document.getElementById("luffy-mic-btn").addEventListener("click", () => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      bubble.textContent = "⚠️ Browser speech recognition requires Chrome/Edge.";
      return;
    }
    const rec = new SpeechRec();
    rec.lang = "en-US";
    bubble.textContent = "🎙️ Listening… speak your command now!";
    rec.onresult = (ev) => {
      const spoken = ev.results?.[0]?.[0]?.transcript || "";
      if (spoken) {
        input.value = spoken;
        submitInput();
      }
    };
    rec.start();
  });

  // Global keyboard shortcut inside browser: Alt+L (Option+L on Mac)
  window.addEventListener("keydown", (e) => {
    if (e.altKey && e.code === "KeyL") {
      e.preventDefault();
      toggleHUD();
    }
  });
})();
