const FUNCTION_ENDPOINT = "/.netlify/functions/chef";
const chatEl = document.getElementById("chat");
const composerEl = document.getElementById("composer");
const inputEl = document.getElementById("input");
const sendBtn = document.getElementById("sendBtn");
const chipsEl = document.getElementById("budgetChips");
const history = [];

function addMessage({ role, text, status }) {
  const wrapper = document.createElement("div");
  wrapper.className = `msg msg-${role === "user" ? "user" : "chef"}`;
  if (status === "loading") wrapper.classList.add("loading");
  if (status === "error") wrapper.classList.add("msg-error");
  const label = document.createElement("span");
  label.className = "msg-label";
  label.textContent = role === "user" ? "Toi" : "Chef Tirelire";
  const p = document.createElement("p");
  p.textContent = text;
  wrapper.appendChild(label);
  wrapper.appendChild(p);
  chatEl.appendChild(wrapper);
  chatEl.scrollTop = chatEl.scrollHeight;
  return wrapper;
}

async function sendMessage(text) {
  const trimmed = text.trim();
  if (!trimmed) return;
  addMessage({ role: "user", text: trimmed });
  history.push({ role: "user", content: trimmed });
  inputEl.value = "";
  inputEl.style.height = "auto";
  setBusy(true);
  const loadingEl = addMessage({ role: "chef", text: "Le chef réfléchit…", status: "loading" });
  try {
    const response = await fetch(FUNCTION_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history }),
    });
    const data = await response.json();
    loadingEl.remove();
    if (!response.ok) {
      addMessage({ role: "chef", text: data.error || "Une erreur est survenue.", status: "error" });
      return;
    }
    addMessage({ role: "chef", text: data.reply });
    history.push({ role: "assistant", content: data.reply });
  } catch (err) {
    loadingEl.remove();
    addMessage({ role: "chef", text: "Impossible de joindre le serveur. Réessaie.", status: "error" });
  } finally {
    setBusy(false);
  }
}

function setBusy(isBusy) {
  sendBtn.disabled = isBusy;
  inputEl.disabled = isBusy;
}

composerEl.addEventListener("submit", (e) => {
  e.preventDefault();
  sendMessage(inputEl.value);
});

inputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    composerEl.requestSubmit();
  }
});

inputEl.addEventListener("input", () => {
  inputEl.style.height = "auto";
  inputEl.style.height = `${Math.min(inputEl.scrollHeight, 120)}px`;
});

chipsEl.addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  sendMessage(chip.dataset.text);
});
