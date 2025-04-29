const chat = document.getElementById("chat");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const themeToggle = document.getElementById("themeToggle");
const clearChatBtn = document.getElementById("clearChatBtn"); // Add this line

let isWaitingForResponse = false;

// Check for saved theme preference or use system preference
const prefersDarkMode =
  window.matchMedia &&
  window.matchMedia("(prefers-color-scheme: dark)").matches;
const savedTheme = localStorage.getItem("theme");

if (savedTheme === "dark" || (!savedTheme && prefersDarkMode)) {
  document.body.classList.add("dark-mode");
  themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
}

// Toggle theme
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  const isDarkMode = document.body.classList.contains("dark-mode");
  localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  themeToggle.innerHTML = isDarkMode
    ? '<i class="fas fa-sun"></i>'
    : '<i class="fas fa-moon"></i>';
});

// Show empty state with suggestions
function showEmptyState() {
  const emptyState = document.createElement("div");
  emptyState.className = "empty-state";
  emptyState.innerHTML = `
    <i class="fas fa-comments"></i>
    <h2>Start a conversation</h2>
    <p>Ask me anything! I'm here to help with information, tasks, or just to chat.</p>
    <div class="suggestion-chips">
      <div class="suggestion-chip">What can you do?</div>
      <div class="suggestion-chip">Tell me a fun fact</div>
      <div class="suggestion-chip">How does AI work?</div>
      <div class="suggestion-chip">Write a poem about technology</div>
    </div>
  `;
  chat.appendChild(emptyState);

  // Add click event to suggestion chips
  const chips = emptyState.querySelectorAll(".suggestion-chip");
  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      userInput.value = chip.textContent;
      sendMessage();
    });
  });
}

let conversationHistory = [];

async function sendMessage() {
  const input = userInput.value.trim();
  if (!input || isWaitingForResponse) return;

  // Remove empty state if present
  const emptyState = chat.querySelector(".empty-state");
  if (emptyState) {
    chat.removeChild(emptyState);
  }

  appendMessage("user", input);
  userInput.value = "";

  // Add user message to history
  conversationHistory.push({ role: "user", content: input });

  // Show typing indicator
  isWaitingForResponse = true;
  const typingIndicator = document.createElement("div");
  typingIndicator.className = "typing-indicator";
  typingIndicator.innerHTML = `
    <div class="typing-dot"></div>
    <div class="typing-dot"></div>
    <div class="typing-dot"></div>
  `;
  chat.appendChild(typingIndicator);
  chat.scrollTop = chat.scrollHeight;

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: input,
        history: conversationHistory,
      }),
    });

    if (!res.ok) {
      throw new Error(`Server responded with ${res.status}`);
    }

    const data = await res.json();

    // Remove typing indicator
    chat.removeChild(typingIndicator);

    appendMessage("ai", data.reply);

    // Add AI response to history
    conversationHistory.push({ role: "assistant", content: data.reply });
  } catch (err) {
    console.error("Error:", err);

    // Remove typing indicator if it exists
    if (typingIndicator.parentNode === chat) {
      chat.removeChild(typingIndicator);
    }

    appendMessage("ai", "Error: Unable to fetch response. Please try again.");
  }

  isWaitingForResponse = false;
  chat.scrollTop = chat.scrollHeight;
}

function formatTimestamp() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

function appendMessage(sender, text) {
  const container = document.createElement("div");
  container.className = `message-container ${sender}-container`;

  const msg = document.createElement("div");
  msg.className = `message ${sender}`;
  if (sender === "ai") {
    msg.innerHTML = marked.parse(text);
  } else {
    msg.textContent = text;
  }

  const timestamp = document.createElement("div");
  timestamp.className = "timestamp";
  timestamp.textContent = formatTimestamp();

  container.appendChild(msg);
  container.appendChild(timestamp);
  chat.appendChild(container);
}

sendBtn.addEventListener("click", sendMessage);
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

// Clear chat functionality
clearChatBtn.addEventListener("click", () => {
  chat.innerHTML = "";
  conversationHistory = []; // Clear the conversation history
  showEmptyState();
});

// Focus input on page load
userInput.focus();
showEmptyState();
