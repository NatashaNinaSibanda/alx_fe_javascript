// Array of quotes (each with text + category)
let quotes = [
  { text: "The best way to predict the future is to invent it.", category: "Inspiration" },
  { text: "Life is what happens when you’re busy making other plans.", category: "Life" },
  { text: "Do not wait to strike till the iron is hot, but make it hot by striking.", category: "Motivation" }
];

const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");
const addQuoteBtn = document.getElementById("addQuoteBtn");

// ✅ Function to show a random quote
function showRandomQuote() {
  if (quotes.length === 0) {
    quoteDisplay.textContent = "No quotes available!";
    return;
  }

  // Pick random index
  const randomIndex = Math.floor(Math.random() * quotes.length);
  const randomQuote = quotes[randomIndex];

  // Clear previous quote
  quoteDisplay.innerHTML = "";

  // Create DOM elements dynamically
  const quoteText = document.createElement("p");
  quoteText.textContent = `"${randomQuote.text}"`;

  const quoteCategory = document.createElement("span");
  quoteCategory.textContent = `Category: ${randomQuote.category}`;
  quoteCategory.style.fontStyle = "italic";
  quoteCategory.style.color = "gray";

  // Append to display
  quoteDisplay.appendChild(quoteText);
  quoteDisplay.appendChild(quoteCategory);
}

// ✅ Function to add new quotes dynamically
function addQuote() {
  const newText = document.getElementById("newQuoteText").value.trim();
  const newCategory = document.getElementById("newQuoteCategory").value.trim();

  if (newText === "" || newCategory === "") {
    alert("Please enter both a quote and a category.");
    return;
  }

  // Add to quotes array
  quotes.push({ text: newText, category: newCategory });

  // Clear inputs
  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";

  alert("New quote added successfully!");
}

// ✅ Event Listeners
newQuoteBtn.addEventListener("click", showRandomQuote);
addQuoteBtn.addEventListener("click", addQuote);

// Show one random quote when page loads
showRandomQuote();
