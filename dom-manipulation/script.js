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

// Load saved quotes or use defaults
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

  // Prevent duplicate quotes
  if (quotes.some(q => q.text.toLowerCase() === text.toLowerCase())) {
    alert("This quote already exists!");
    return;
  }

  const newQuote = { text, author, category };
  quotes.push(newQuote);
  saveQuotes();

  quoteInput.value = "";
  authorInput.value = "";
  categoryInput.value = "";

  populateCategories();
  displayQuotes();
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
    alert("No quotes available for this category.");
    return;
  }

  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  const randomQuote = filteredQuotes[randomIndex];

  alert(`"${randomQuote.text}" — ${randomQuote.author}`);

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

  // Restore saved filter if exists
  const savedFilter = localStorage.getItem(STORAGE_FILTER_KEY);
  if (savedFilter) {
    categoryFilter.value = savedFilter;
  }
}

// ===============================
// Filter Quotes
// ===============================
function filterQuotes() {
  const selectedCategory = categoryFilter.value;
  saveSelectedFilter(selectedCategory);
  displayQuotes();
}

// ===============================
// Export JSON
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

// ===============================
// Import JSON
// ===============================
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
      importFileInput.value = ""; // clear input
    } catch {
      alert("Error reading JSON file.");
    }
  };
  reader.readAsText(file);
}

// ===============================
// Initialization
// ===============================
window.onload = function() {
  populateCategories();
  displayQuotes();

  // Restore last viewed quote
  const lastViewed = sessionStorage.getItem(SESSION_LAST_KEY);
  if (lastViewed) {
    const q = JSON.parse(lastViewed);
    console.log("Last viewed quote:", `"${q.text}" — ${q.author}`);
  }
};

// ===============================
// Event Listeners
// ===============================
addQuoteBtn.addEventListener("click", addQuote);
categoryFilter.addEventListener("change", filterQuotes);
exportBtn.addEventListener("click", exportToJsonFile);
importFileInput.addEventListener("change", importFromJsonFile);