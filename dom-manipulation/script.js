// ---- Storage keys
const STORAGE_KEY = "dqg_quotes_v1";
const SESSION_LAST_KEY = "dqg_last_quote_v1";

// ---- Default seed quotes
const defaultQuotes = [
  { text: "The best way to predict the future is to invent it.", category: "Inspiration" },
  { text: "Life is what happens when you’re busy making other plans.", category: "Life" },
  { text: "Make it hot by striking.", category: "Motivation" }
];

// ---- State
let quotes = [];

// ---- DOM
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn   = document.getElementById("newQuote");
const exportBtn     = document.getElementById("exportBtn");

// ---- Utils
function isValidQuote(q) {
  return q
    && typeof q.text === "string" && q.text.trim() !== ""
    && typeof q.category === "string" && q.category.trim() !== "";
}
function keyFor(q) {
  return `${q.text.trim()}::${q.category.trim()}`.toLowerCase();
}

// ---- Local Storage
function loadQuotes() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        quotes = parsed.filter(isValidQuote);
        if (quotes.length) return;
      }
    }
  } catch {}
  quotes = defaultQuotes.slice();
  saveQuotes();
}
function saveQuotes() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes));
}

// ---- Session Storage
function saveLastViewed(q) {
  try {
    sessionStorage.setItem(SESSION_LAST_KEY, JSON.stringify(q));
  } catch {}
}
function getLastViewed() {
  try {
    const s = sessionStorage.getItem(SESSION_LAST_KEY);
    return s ? JSON.parse(s) : null;
  } catch { return null; }
}

// ---- Rendering
function showQuote(quote) {
  quoteDisplay.innerHTML = "";

  const quoteText = document.createElement("p");
  quoteText.textContent = `"${quote.text}"`;

  const quoteCategory = document.createElement("span");
  quoteCategory.textContent = `Category: ${quote.category}`;
  quoteCategory.style.fontStyle = "italic";

  quoteDisplay.appendChild(quoteText);
  quoteDisplay.appendChild(quoteCategory);
}

function showRandomQuote() {
  if (!quotes.length) {
    quoteDisplay.textContent = "No quotes available!";
    return;
  }
  const idx = Math.floor(Math.random() * quotes.length);
  const q = quotes[idx];
  showQuote(q);
  saveLastViewed(q);
}

// ---- Add Quote Form (dynamic DOM creation)
function createAddQuoteForm() {
  const formContainer = document.createElement("div");
  formContainer.style.marginTop = "1rem";

  const inputText = document.createElement("input");
  inputText.id = "newQuoteText";
  inputText.type = "text";
  inputText.placeholder = "Enter a new quote";
  inputText.style.marginRight = "0.5rem";

  const inputCategory = document.createElement("input");
  inputCategory.id = "newQuoteCategory";
  inputCategory.type = "text";
  inputCategory.placeholder = "Enter quote category";
  inputCategory.style.marginRight = "0.5rem";

  const addBtn = document.createElement("button");
  addBtn.textContent = "Add Quote";

  addBtn.addEventListener("click", addQuote);

  formContainer.appendChild(inputText);
  formContainer.appendChild(inputCategory);
  formContainer.appendChild(addBtn);

  document.body.appendChild(formContainer);
}

// ---- Add Quote
function addQuote() {
  const textEl = document.getElementById("newQuoteText");
  const catEl  = document.getElementById("newQuoteCategory");
  const newText = textEl.value.trim();
  const newCategory = catEl.value.trim();

  if (!newText || !newCategory) {
    alert("Please enter both a quote and a category.");
    return;
  }

  const newQ = { text: newText, category: newCategory };

  // prevent duplicates
  const existing = new Set(quotes.map(keyFor));
  if (existing.has(keyFor(newQ))) {
    alert("That exact quote + category already exists.");
    return;
  }

  quotes.push(newQ);
  saveQuotes();
  showQuote(newQ);
  saveLastViewed(newQ);

  textEl.value = "";
  catEl.value = "";
  alert("New quote added successfully!");
}

// ---- Export JSON
function exportToJsonFile() {
  const data = JSON.stringify(quotes, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().replace(/[:T]/g, "-").slice(0, 19);
  a.href = url;
  a.download = `quotes-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ---- Import JSON
function importFromJsonFile(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(e.target.result);
      const incoming = Array.isArray(parsed) ? parsed
                    : Array.isArray(parsed?.quotes) ? parsed.quotes
                    : null;
      if (!incoming) throw new Error("JSON must be an array of {text, category}");

      const map = new Map(quotes.map(q => [keyFor(q), q]));
      let added = 0, skipped = 0;

      for (const q of incoming) {
        if (isValidQuote(q)) {
          const k = keyFor(q);
          if (!map.has(k)) {
            map.set(k, { text: q.text.trim(), category: q.category.trim() });
            added++;
          } else skipped++;
        } else skipped++;
      }

      quotes = Array.from(map.values());
      saveQuotes();

      alert(`Imported ${added} new quote(s). Skipped ${skipped}. Total now: ${quotes.length}.`);
      event.target.value = "";
    } catch (err) {
      alert("Invalid JSON file: " + err.message);
    }
  };
  reader.readAsText(file);
}

// ---- Init
loadQuotes();
createAddQuoteForm();

const last = getLastViewed();
if (last && isValidQuote(last)) {
  showQuote(last);
} else {
  showRandomQuote();
}

newQuoteBtn.addEventListener("click", showRandomQuote);
exportBtn.addEventListener("click", exportToJsonFile);

// Make import function global (for inline onchange in HTML)
window.importFromJsonFile = importFromJsonFile;


