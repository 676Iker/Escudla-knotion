// =============================================================================
// EDUCATIONAL WEB PROXY - FRONTEND JAVASCRIPT
// Beginner-friendly, heavily commented code
// =============================================================================

// =============================================================================
// CONSTANTS
// =============================================================================

// API endpoint for the proxy
const PROXY_ENDPOINT = '/proxy/';

// List of suggested URLs for quick access
const SUGGESTED_URLS = [
  'https://github.com',
  'https://wikipedia.org',
  'https://google.com',
  'https://example.com',
  'https://stackoverflow.com'
];

// Recent URLs stored in localStorage
const RECENT_URLS_KEY = 'escudla_recent_urls';
const MAX_RECENT_URLS = 5;

// =============================================================================
// DOM ELEMENT REFERENCES
// Cache DOM elements for better performance
// =============================================================================

const urlInput = document.getElementById('urlInput');
const proxyForm = document.getElementById('proxyForm');
const statusMessage = document.getElementById('statusMessage');
const loadingModal = document.getElementById('loadingModal');
const suggestionsContainer = document.getElementById('suggestions');
const quickLinkButtons = document.querySelectorAll('.quick-link-btn');
const themeToggle = document.getElementById('themeToggle');

// =============================================================================
// INITIALIZATION
// Run when the page loads
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
  console.log('✅ Escudla proxy initialized');
  
  // Set up event listeners
  setupEventListeners();
  
  // Load saved theme preference
  loadThemePreference();
  
  // Load recent URLs from storage
  loadRecentUrls();
});

// =============================================================================
// EVENT LISTENERS SETUP
// =============================================================================

function setupEventListeners() {
  // Form submission (when user clicks Browse or presses Enter)
  proxyForm.addEventListener('submit', handleFormSubmit);
  
  // URL input field - show suggestions as user types
  urlInput.addEventListener('input', handleInputChange);
  urlInput.addEventListener('focus', showSuggestions);
  urlInput.addEventListener('blur', () => {
    // Delay hiding to allow click on suggestions
    setTimeout(hideSuggestions, 200);
  });
  
  // Quick link buttons - open those URLs through the proxy
  quickLinkButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const url = btn.getAttribute('data-url');
      openProxyURL(url);
    });
  });
  
  // Theme toggle button
  themeToggle.addEventListener('click', toggleTheme);
  
  // Close modal when clicking outside of it
  loadingModal.addEventListener('click', (e) => {
    if (e.target === loadingModal) {
      hideLoadingModal();
    }
  });
}

// =============================================================================
// FORM SUBMISSION HANDLER
// This runs when the user submits the proxy form
// =============================================================================

function handleFormSubmit(e) {
  e.preventDefault(); // Prevent default form submission
  
  // Get the URL from the input field and trim whitespace
  let inputURL = urlInput.value.trim();
  
  // Validate that something was entered
  if (!inputURL) {
    showStatusMessage('Please enter a URL', 'error');
    return;
  }
  
  // Normalize the URL (add https:// if missing)
  inputURL = normalizeURL(inputURL);
  
  // Validate the URL format
  if (!isValidURL(inputURL)) {
    showStatusMessage('Invalid URL format. Example: https://example.com', 'error');
    return;
  }
  
  // Open the URL through the proxy
  openProxyURL(inputURL);
}

// =============================================================================
// URL NORMALIZATION
// Adds https:// if the user didn't include a protocol
// =============================================================================

function normalizeURL(input) {
  // If the URL doesn't start with http:// or https://, add https://
  if (!input.startsWith('http://') && !input.startsWith('https://')) {
    return 'https://' + input;
  }
  return input;
}

// =============================================================================
// URL VALIDATION
// Checks if a URL is valid before sending to the proxy
// =============================================================================

function isValidURL(urlString) {
  try {
    // Try to parse the URL
    // If it succeeds, the URL is valid
    new URL(urlString);
    return true;
  } catch (error) {
    // If parsing fails, the URL is invalid
    return false;
  }
}

// =============================================================================
// OPEN PROXY URL
// Sends the request to the proxy server
// =============================================================================

function openProxyURL(url) {
  try {
    // Show loading indicator
    showLoadingModal();
    
    // Hide any previous status messages
    hideStatusMessage();
    
    // Log the request (for debugging)
    console.log('🔗 Sending proxy request for:', url);
    
    // Build the proxy URL by encoding the target URL as a query parameter
    // Format: /proxy/?url=https://example.com
    const encodedURL = encodeURIComponent(url);
    const proxyURL = `${PROXY_ENDPOINT}?url=${encodedURL}`;
    
    // Open the proxied URL in a new tab
    window.open(proxyURL, '_blank');
    
    // Save to recent URLs
    saveRecentURL(url);
    
    // Update the input field
    urlInput.value = '';
    
    // Show success message
    showStatusMessage(`Opened: ${url}`, 'success');
    
    // Hide loading modal after a short delay
    setTimeout(hideLoadingModal, 1000);
    
  } catch (error) {
    console.error('Error opening proxy URL:', error);
    showStatusMessage('Error: Could not open proxy URL', 'error');
    hideLoadingModal();
  }
}

// =============================================================================
// INPUT CHANGE HANDLER
// Shows suggestions as the user types
// =============================================================================

function handleInputChange(e) {
  const input = e.target.value.trim();
  
  // Only show suggestions if there's input
  if (input.length === 0) {
    hideSuggestions();
    return;
  }
  
  // Filter suggested URLs based on what the user typed
  const filtered = SUGGESTED_URLS.filter(url =>
    url.toLowerCase().includes(input.toLowerCase())
  );
  
  // Also include recent URLs in suggestions
  const recentURLs = getRecentUrls();
  const allSuggestions = [...new Set([...filtered, ...recentURLs])];
  
  // Show filtered suggestions
  showFilteredSuggestions(allSuggestions);
}

// =============================================================================
// SUGGESTIONS DISPLAY
// Shows a dropdown list of suggested URLs
// =============================================================================

function showFilteredSuggestions(suggestions) {
  // Clear previous suggestions
  suggestionsContainer.innerHTML = '';
  
  // If no suggestions, hide the container
  if (suggestions.length === 0) {
    hideSuggestions();
    return;
  }
  
  // Create and add suggestion elements
  suggestions.slice(0, 5).forEach(url => { // Show max 5 suggestions
    const item = document.createElement('div');
    item.className = 'suggestion-item';
    item.textContent = url;
    item.addEventListener('click', () => {
      urlInput.value = url;
      hideSuggestions();
      openProxyURL(url);
    });
    suggestionsContainer.appendChild(item);
  });
  
  // Show the suggestions container
  suggestionsContainer.classList.remove('hidden');
}

function showSuggestions() {
  if (urlInput.value.trim().length > 0) {
    suggestionsContainer.classList.remove('hidden');
  }
}

function hideSuggestions() {
  suggestionsContainer.classList.add('hidden');
}

// =============================================================================
// RECENT URLS MANAGEMENT
// Store and retrieve recently accessed URLs from browser storage
// =============================================================================

function getRecentUrls() {
  try {
    // Get recent URLs from localStorage (browser's local storage)
    const stored = localStorage.getItem(RECENT_URLS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn('Error reading recent URLs:', error);
    return [];
  }
}

function saveRecentURL(url) {
  try {
    // Get current recent URLs
    let recent = getRecentUrls();
    
    // Add new URL to the beginning of the list
    recent.unshift(url);
    
    // Remove duplicates (keep only the first occurrence)
    recent = [...new Set(recent)];
    
    // Keep only the most recent URLs (limit to MAX_RECENT_URLS)
    recent = recent.slice(0, MAX_RECENT_URLS);
    
    // Save back to localStorage
    localStorage.setItem(RECENT_URLS_KEY, JSON.stringify(recent));
    
    console.log('📌 Saved recent URL:', url);
  } catch (error) {
    console.warn('Error saving recent URL:', error);
  }
}

function loadRecentUrls() {
  try {
    const recentUrls = getRecentUrls();
    if (recentUrls.length > 0) {
      console.log('📌 Recent URLs:', recentUrls);
    }
  } catch (error) {
    console.warn('Error loading recent URLs:', error);
  }
}

// =============================================================================
// STATUS MESSAGE DISPLAY
// Shows error, success, or warning messages to the user
// =============================================================================

function showStatusMessage(message, type = 'info') {
  // Set the message text
  statusMessage.textContent = message;
  
  // Remove all type classes
  statusMessage.classList.remove('success', 'error', 'warning');
  
  // Add the appropriate type class
  statusMessage.classList.add(type);
  
  // Show the message
  statusMessage.classList.remove('hidden');
  
  // Auto-hide after 5 seconds
  setTimeout(hideStatusMessage, 5000);
}

function hideStatusMessage() {
  statusMessage.classList.add('hidden');
}

// =============================================================================
// LOADING MODAL
// Shows a loading indicator while the proxy request is processing
// =============================================================================

function showLoadingModal() {
  loadingModal.classList.remove('hidden');
}

function hideLoadingModal() {
  loadingModal.classList.add('hidden');
}

// =============================================================================
// THEME MANAGEMENT
// Dark mode toggle functionality
// =============================================================================

const THEME_KEY = 'escudla_theme';
const THEME_DARK = 'dark';
const THEME_LIGHT = 'light';

function loadThemePreference() {
  try {
    // Get saved theme preference from localStorage
    const saved = localStorage.getItem(THEME_KEY);
    
    // If saved preference exists, use it
    if (saved) {
      applyTheme(saved);
    } else {
      // Otherwise, use system preference or default to dark
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(prefersDark ? THEME_DARK : THEME_LIGHT);
    }
  } catch (error) {
    console.warn('Error loading theme preference:', error);
    applyTheme(THEME_DARK); // Default to dark
  }
}

function toggleTheme() {
  try {
    // Get the current theme from the HTML element
    const currentTheme = document.documentElement.getAttribute('data-theme');
    
    // Toggle between dark and light
    const newTheme = currentTheme === THEME_LIGHT ? THEME_DARK : THEME_LIGHT;
    
    // Apply the new theme
    applyTheme(newTheme);
    
    // Save the preference
    localStorage.setItem(THEME_KEY, newTheme);
    
    console.log('🎨 Theme changed to:', newTheme);
  } catch (error) {
    console.warn('Error toggling theme:', error);
  }
}

function applyTheme(theme) {
  // Set the data-theme attribute on the HTML element
  document.documentElement.setAttribute('data-theme', theme);
  
  // Update the theme toggle button emoji
  themeToggle.textContent = theme === THEME_LIGHT ? '🌙' : '☀️';
}

// =============================================================================
// DEVELOPER INFO
// Shows information about the project
// =============================================================================

function showDeveloperInfo() {
  alert(
    `Educational Web Proxy - v1.0
    
Made for learning and testing purposes.

Features:
• Dark mode UI with modern design
• Mobile optimized (iPad 10th gen)
• Rate limiting and security headers
• Beginner-friendly code

Learn more at the GitHub repository.

⚠️ Disclaimer:
Use responsibly and ethically.
Do not bypass restrictions or access unauthorized content.`
  );
}

// =============================================================================
// KEYBOARD SHORTCUTS (Optional)
// =============================================================================

document.addEventListener('keydown', (e) => {
  // Ctrl+L or Cmd+L: Focus on URL input
  if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
    e.preventDefault();
    urlInput.focus();
  }
  
  // Escape: Clear input and hide suggestions
  if (e.key === 'Escape') {
    urlInput.value = '';
    hideSuggestions();
  }
});

// =============================================================================
// ADDITIONAL UTILITIES
// =============================================================================

// Log initialization complete
console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║      Escudla - Educational Web Proxy Frontend              ║
║                                                            ║
║      Ready to use! Enter a URL and click Browse.           ║
║                                                            ║
║      Keyboard Shortcuts:                                   ║
║      • Ctrl+L (Cmd+L): Focus URL input                     ║
║      • Escape: Clear input                                 ║
║                                                            ║
║      ⚠️  Educational Use Only                              ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
`);
