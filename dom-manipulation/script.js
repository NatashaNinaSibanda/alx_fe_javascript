// Storage keys
const STORAGE_KEY = "quotes";
const SESSION_LAST_KEY = "lastViewedQuote";
const STORAGE_FILTER_KEY = "selectedCategory";

// DOM elements
const quoteInput = document.getElementById("quoteInput");
const authorInput = document.getElementById("authorInput");
const categoryInput = document.getElementById("categoryInput");
const addQuoteBtn = document.getElementById("addQuoteBtn");
const quotesList = document.getElementById("quotesList");
const categoryFilter = document.getElementById("categoryFilter");
const importFileInput = document.getElementById("importFile");
const exportBtn = document.getElementById("exportBtn");
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");
const syncBtn = document.getElementById("syncBtn");

// Mock server URL
const SERVER_URL = "https://jsonplaceholder.typicode.com/posts";

// Load saved quotes or defaults
let quotes = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [
  { text: "The best way to predict the future is to create it.", author: "Peter Drucker", category: "Motivation" },
  { text: "Do not wait to strike till the iron is hot; but make it hot by striking.", author: "William B. Sprague", category: "Action" },
  { text: "Great minds discuss ideas; average minds discuss events; small minds discuss people.", author: "Eleanor Roosevelt", category: "Wisdom" }
];

// ===============================
// Utility Functions
// ===============================
function saveQuotes() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes));
}

function saveSelectedFilter(category) {
  localStorage.setItem(STORAGE_FILTER_KEY, category);
}

// ===============================
// Add Quote
// ===============================
function addQuote() {
  const text = quoteInput.value.trim();
  const author = authorInput.value.trim() || "Unknown";
  const category = categoryInput.value.trim() || "General";

  if (!text) {
    alert("Please enter a quote!");
    return;
  }

  if (quotes.some(q => q.text.toLowerCase() === text.toLowerCase())) {
    alert("This quote already exists!");
    return;
  }

  const newQuote = { text, author, category };
  quotes.push(newQuote);
  saveQuotes();
  populateCategories();
  displayQuotes();

  // Post to server
  postQuoteToServer(newQuote);

  quoteInput.value = "";
  authorInput.value = "";
  categoryInput.value = "";
  alert("Quote added successfully!");
}

// ===============================
// Display Quotes
// ===============================
function displayQuotes() {
  const selectedCategory = categoryFilter.value || "all";
  quotesList.innerHTML = "";

  const filteredQuotes = selectedCategory === "all"
    ? quotes
    : quotes.filter(q => q.category === selectedCategory);

  filteredQuotes.forEach(q => {
    const li = document.createElement("li");
    li.textContent = `"${q.text}" — ${q.author} [${q.category}]`;
    quotesList.appendChild(li);
  });
}

// ===============================
// Show Random Quote
// ===============================
function showRandomQuote() {
  const selectedCategory = categoryFilter.value || "all";

  const filteredQuotes = selectedCategory === "all"
    ? quotes
    : quotes.filter(q => q.category === selectedCategory);

  if (filteredQuotes.length === 0) {
    quoteDisplay.textContent = "No quotes available for this category.";
    return;
  }

  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  const randomQuote = filteredQuotes[randomIndex];

  quoteDisplay.textContent = `"${randomQuote.text}" — ${randomQuote.author} [${randomQuote.category}]`;
  sessionStorage.setItem(SESSION_LAST_KEY, JSON.stringify(randomQuote));
}

// ===============================
// Populate Categories
// ===============================
function populateCategories() {
  const uniqueCategories = [...new Set(quotes.map(q => q.category))];
  categoryFilter.innerHTML = `<option value="all">All Categories</option>`;

  uniqueCategories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
  });

  const savedFilter = localStorage.getItem(STORAGE_FILTER_KEY);
  if (savedFilter) categoryFilter.value = savedFilter;
}

// ===============================
// Filter Quotes
// ===============================
function filterQuotes() {
  const selectedCategory = categoryFilter.value;
  saveSelectedFilter(selectedCategory);
  displayQuotes();
  showRandomQuote();
}

// ===============================
// Import/Export JSON
// ===============================
function exportToJsonFile() {
  const jsonData = JSON.stringify(quotes, null, 2);
  const blob = new Blob([jsonData], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const a = document.createElement("a");
  a.href = url;
  a.download = `quotes-${timestamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importFromJsonFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const importedQuotes = JSON.parse(e.target.result);
      if (Array.isArray(importedQuotes)) {
        quotes.push(...importedQuotes);
        saveQuotes();
        populateCategories();
        displayQuotes();
        alert("Quotes imported successfully!");
      } else {
        alert("Invalid JSON format. Must be an array of quotes.");
      }
      importFileInput.value = "";
    } catch {
      alert("Error reading JSON file.");
    }
  };
  reader.readAsText(file);
}

// ===============================
// Server Sync & Conflict Resolution
// ===============================
async function fetchQuotesFromServer() {
  try {
    const response = await fetch(SERVER_URL);
    if (!response.ok) throw new Error("Failed to fetch server quotes");

    const serverData = await response.json();
    const serverQuotes = serverData.slice(0, 10).map(post => ({
      text: post.title,
      author: post.userId ? `User ${post.userId}` : "Server",
      category: "Server"
    }));

    resolveConflicts(serverQuotes);
  } catch (error) {
    console.error("Server fetch error:", error);
  }
}

function resolveConflicts(serverQuotes) {
  const map = new Map(quotes.map(q => [`${q.text}::${q.author}`, q]));
  let conflictsResolved = 0;

  serverQuotes.forEach(sq => {
    const key = `${sq.text}::${sq.author}`;
    if (!map.has(key)) {
      map.set(key, sq);
    } else {
      map.set(key, sq); // server wins
      conflictsResolved++;
    }
  });

  quotes = Array.from(map.values());
  saveQuotes();
  populateCategories();
  displayQuotes();

  if (conflictsResolved > 0) {
    alert(`${conflictsResolved} local quote(s) updated with server data.`);
  }
}

async function postQuoteToServer(quote) {
  try {
    const response = await fetch(SERVER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(quote)
    });

    if (!response.ok) throw new Error("Failed to post quote to server");

    const data = await response.json();
    console.log("Quote posted successfully:", data);
  } catch (error) {
    console.error("Error posting quote:", error);
  }
}

// ===============================
// Initialization
// ===============================
window.onload = function() {
  populateCategories();
  displayQuotes();

  const lastViewed = sessionStorage.getItem(SESSION_LAST_KEY);
  if (lastViewed) {
    const q = JSON.parse(lastViewed);
    quoteDisplay.textContent = `"${q.text}" — ${q.author} [${q.category}]`;
  }

  fetchQuotesFromServer(); // initial sync
};

// ===============================
// Event Listeners
// ===============================
addQuoteBtn.addEventListener("click", addQuote);
categoryFilter.addEventListener("change", filterQuotes);
newQuoteBtn.addEventListener("click", showRandomQuote);
exportBtn.addEventListener("click", exportToJsonFile);
importFileInput.addEventListener("change", importFromJsonFile);
if (syncBtn) syncBtn.addEventListener("click", fetchQuotesFromServer);

// Auto-sync every 60 seconds
setInterval(fetchQuotesFromServer, 60000);