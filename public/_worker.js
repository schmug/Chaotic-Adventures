// Create a simple worker script that serves the index.html directly
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // For all routes except specific routes, serve the main HTML
  if (path === "/app.js") {
    // Handle app.js requests with standard string concatenation
    return new Response(
      "/**\n" +
      " * Chaotic Adventures - Frontend JavaScript\n" +
      " * \n" +
      " * Handles user interaction and communicates with the backend API.\n" +
      " */\n\n" +
      "// Game state\n" +
      "const gameState = {\n" +
      "    playerName: '',\n" +
      "    chaosLevel: 5,\n" +
      "    currentNarrative: '',\n" +
      "    choices: [],\n" +
      "    gameId: null,\n" +
      "    isGameActive: false,\n" +
      "    llmMode: 'mock', // 'mock', 'browser', or 'server'\n" +
      "    browserLlm: null\n" +
      "};\n\n" +
      "// Global constants\n" +
      "const MOCK_MODE = false; // Set to true to use mock data for save/load\n\n" +
      "// DOM elements\n" +
      "const elements = {\n" +
      "    // Screens\n" +
      "    startScreen: document.getElementById('start-screen'),\n" +
      "    gameScreen: document.getElementById('game-screen'),\n" +
      "    summaryScreen: document.getElementById('summary-screen'),\n" +
      "    \n" +
      "    // Start screen elements\n" +
      "    playerNameInput: document.getElementById('player-name'),\n" +
      "    randomNameButton: document.getElementById('random-name'),\n" +
      "    chaosLevelInput: document.getElementById('chaos-level'),\n" +
      "    chaosValueDisplay: document.getElementById('chaos-value'),\n" +
      "    startGameButton: document.getElementById('start-game'),\n" +
      "    llmModeMock: document.getElementById('llm-mode-mock'),\n" +
      "    llmModeBrowser: document.getElementById('llm-mode-browser'),\n" +
      "    llmModeServer: document.getElementById('llm-mode-server'),\n" +
      "    llmLoading: document.getElementById('llm-loading'),\n" +
      "    loadProgress: document.getElementById('load-progress'),\n" +
      "    progressFill: document.querySelector('.progress-fill'),\n" +
      "    \n" +
      "    // Game screen elements\n" +
      "    narrativeText: document.getElementById('narrative-text'),\n" +
      "    choicesList: document.getElementById('choices-list'),\n" +
      "    saveGameButton: document.getElementById('save-game'),\n" +
      "    loadGameButton: document.getElementById('load-game'),\n" +
      "    endGameButton: document.getElementById('end-game'),\n" +
      "    \n" +
      "    // Summary screen elements\n" +
      "    summaryText: document.getElementById('summary-text'),\n" +
      "    newGameButton: document.getElementById('new-game')\n" +
      "};\n\n" +
      "// API endpoints\n" +
      "const API = {\n" +
      "    baseUrl: '/api',\n" +
      "    startGame: '/start',\n" +
      "    makeChoice: '/choice',\n" +
      "    getChoices: '/choices',\n" +
      "    getSummary: '/summary',\n" +
      "    saveGame: '/save',\n" +
      "    loadGame: '/load'\n" +
      "};\n\n" +
      "// WebLLM config\n" +
      "const WEBLLM_CONFIG = {\n" +
      "    // Use smaller models for better performance in browsers\n" +
      "    // Options for various sizes (smaller = faster, less accurate)\n" +
      "    models: {\n" +
      "        tiny: \"Xenova/TinyLlama-1.1B-Chat-v1.0\",\n" +
      "        small: \"Xenova/Llama-2-7b-chat-hf\",\n" +
      "        medium: \"Xenova/Llama-2-13b-chat-hf\"\n" +
      "    },\n" +
      "    // Default to the smallest model for faster loading\n" +
      "    modelId: \"Xenova/TinyLlama-1.1B-Chat-v1.0\",\n" +
      "    // Callback for loading progress\n" +
      "    progress_callback: function(progress) {\n" +
      "        const percent = Math.round(progress * 100);\n" +
      "        if (elements.loadProgress) {\n" +
      "            elements.loadProgress.textContent = percent + '%';\n" +
      "        }\n" +
      "        if (elements.progressFill) {\n" +
      "            elements.progressFill.style.width = percent + '%';\n" +
      "        }\n" +
      "        // Additional loading step messages\n" +
      "        if (percent < 20) {\n" +
      "            elements.llmLoading.querySelector('p').textContent = \n" +
      "                'Preparing model resources... ' + percent + '%';\n" +
      "        } else if (percent < 60) {\n" +
      "            elements.llmLoading.querySelector('p').textContent = \n" +
      "                'Downloading model files... ' + percent + '%';\n" +
      "        } else if (percent < 90) {\n" +
      "            elements.llmLoading.querySelector('p').textContent = \n" +
      "                'Initializing language model... ' + percent + '%';\n" +
      "        } else {\n" +
      "            elements.llmLoading.querySelector('p').textContent = \n" +
      "                'Almost ready... ' + percent + '%';\n" +
      "        }\n" +
      "    }\n" +
      "};\n\n" +
      "/**\n" +
      " * Generate a random player name\n" +
      " */\n" +
      "function generateRandomName() {\n" +
      "    const prefixes = [\n" +
      "        \"Adventurous\", \"Chaotic\", \"Curious\", \"Daring\", \"Eccentric\", \n" +
      "        \"Fearless\", \"Goofy\", \"Heroic\", \"Intrepid\", \"Jovial\",\n" +
      "        \"Kooky\", \"Lucky\", \"Mysterious\", \"Nimble\", \"Odd\", \n" +
      "        \"Peculiar\", \"Quirky\", \"Reckless\", \"Silly\", \"Tenacious\",\n" +
      "        \"Unpredictable\", \"Valiant\", \"Wacky\", \"Zealous\"\n" +
      "    ];\n" +
      "    \n" +
      "    const names = [\n" +
      "        \"Alex\", \"Bailey\", \"Casey\", \"Dana\", \"Ellis\",\n" +
      "        \"Finley\", \"Gray\", \"Harper\", \"Indigo\", \"Jordan\",\n" +
      "        \"Kelly\", \"Logan\", \"Morgan\", \"Noel\", \"Parker\",\n" +
      "        \"Quinn\", \"Riley\", \"Sam\", \"Taylor\", \"Val\",\n" +
      "        \"Wren\", \"Yuri\", \"Zephyr\"\n" +
      "    ];\n" +
      "    \n" +
      "    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];\n" +
      "    const name = names[Math.floor(Math.random() * names.length)];\n" +
      "    \n" +
      "    return prefix + \" \" + name;\n" +
      "}\n\n" +
      "// Define the init function that sets up the game\n" +
      "function init() {\n" +
      "    console.log('Game initialization started');\n" +
      "    \n" +
      "    // Set up event listeners\n" +
      "    const startButton = document.getElementById('start-game');\n" +
      "    if (startButton) {\n" +
      "        startButton.addEventListener('click', startGame);\n" +
      "    }\n" +
      "    \n" +
      "    // Generate random name button\n" +
      "    const randomNameButton = document.getElementById('random-name');\n" +
      "    if (randomNameButton) {\n" +
      "        randomNameButton.addEventListener('click', function() {\n" +
      "            const playerNameInput = document.getElementById('player-name');\n" +
      "            if (playerNameInput) {\n" +
      "                playerNameInput.value = generateRandomName();\n" +
      "            }\n" +
      "        });\n" +
      "    }\n" +
      "    \n" +
      "    console.log('Game initialization completed');\n" +
      "}\n" +
      "\n" +
      "// Function to start the game\n" +
      "function startGame() {\n" +
      "    console.log('Starting game');\n" +
      "    \n" +
      "    // Get player name and validate\n" +
      "    const playerNameInput = document.getElementById('player-name');\n" +
      "    const playerName = playerNameInput ? playerNameInput.value.trim() : 'Adventurer';\n" +
      "    if (!playerName) {\n" +
      "        alert('Please enter your name to begin the adventure!');\n" +
      "        return;\n" +
      "    }\n" +
      "    \n" +
      "    // Switch screens\n" +
      "    const startScreen = document.getElementById('start-screen');\n" +
      "    const gameScreen = document.getElementById('game-screen');\n" +
      "    \n" +
      "    if (startScreen && gameScreen) {\n" +
      "        // Hide start screen\n" +
      "        startScreen.classList.remove('active');\n" +
      "        startScreen.style.display = 'none';\n" +
      "        \n" +
      "        // Show game screen\n" +
      "        gameScreen.classList.add('active');\n" +
      "        gameScreen.style.display = 'block';\n" +
      "        \n" +
      "        // Set up narrative\n" +
      "        const narrativeText = document.getElementById('narrative-text');\n" +
      "        if (narrativeText) {\n" +
      "            narrativeText.textContent = 'Welcome, ' + playerName + ', to the Whimsical Woods, a place where logic takes a backseat and chaos reigns supreme! As you step into the forest, the trees seem to whisper your name, occasionally mispronouncing it in increasingly ridiculous ways. The path ahead splits in three directions, and you notice a squirrel wearing tiny spectacles studying a miniature map nearby.';\n" +
      "        }\n" +
      "        \n" +
      "        // Set up choices\n" +
      "        const choicesList = document.getElementById('choices-list');\n" +
      "        if (choicesList) {\n" +
      "            choicesList.innerHTML = \n" +
      "                '<li>Follow the glowing mushrooms deeper into the woods</li>' +\n" +
      "                '<li>Climb the nearest tree to get a better view</li>' +\n" +
      "                '<li>Strike up a conversation with the bespectacled squirrel</li>';\n" +
      "            \n" +
      "            // Add click handlers to choices\n" +
      "            const choices = choicesList.querySelectorAll('li');\n" +
      "            choices.forEach(function(choice) {\n" +
      "                choice.addEventListener('click', function() {\n" +
      "                    alert('You chose: ' + choice.textContent);\n" +
      "                });\n" +
      "            });\n" +
      "        }\n" +
      "    }\n" +
      "}\n" +
      "\n" +
      "// Initialize the game when the window is ready\n" +
      "window.addEventListener('DOMContentLoaded', init);\n\n" +
      "// Extra initialization to ensure the game loads correctly\n" +
      "(function() {\n" +
      "    console.log(\"Initialization system loaded successfully\");\n" +
      "})();",
      {
        headers: {
          "content-type": "application/javascript",
          "cache-control": "no-cache, no-store, must-revalidate"
        }
      }
    );
  } else if (path === "/style.css") {
    // Handle style.css requests with standard string concatenation
    return new Response(
      "/* Chaotic Adventures Stylesheet */\n\n" +
      "/* Global Styles */\n" +
      ":root {\n" +
      "    --primary-color: #6a0dad;\n" +
      "    --primary-dark: #4a007d;\n" +
      "    --secondary-color: #8e44ad;\n" +
      "    --accent-color: #ffdb58;\n" +
      "    --accent-secondary: #ff6b6b;\n" +
      "    --accent-tertiary: #4ecdc4;\n" +
      "    --text-color: #333;\n" +
      "    --text-color-light: #555;\n" +
      "    --bg-color: #f8f8f8;\n" +
      "    --bg-secondary: #f0f0f0;\n" +
      "    --border-radius: 8px;\n" +
      "    --font-primary: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;\n" +
      "}\n\n" +
      "body {\n" +
      "    font-family: var(--font-primary);\n" +
      "    background-color: var(--bg-color);\n" +
      "    margin: 0;\n" +
      "    padding: 0;\n" +
      "    color: var(--text-color);\n" +
      "    line-height: 1.6;\n" +
      "}\n\n" +
      ".container {\n" +
      "    max-width: 800px;\n" +
      "    margin: 0 auto;\n" +
      "    padding: 1rem;\n" +
      "}\n\n" +
      ".game-screen {\n" +
      "    display: none;\n" +
      "    transition: opacity 0.3s ease;\n" +
      "}\n\n" +
      ".game-screen.active {\n" +
      "    display: block;\n" +
      "}\n\n" +
      "header {\n" +
      "    text-align: center;\n" +
      "    margin-bottom: 2rem;\n" +
      "    color: var(--primary-color);\n" +
      "}\n\n" +
      "footer {\n" +
      "    text-align: center;\n" +
      "    margin-top: 2rem;\n" +
      "    padding: 1rem;\n" +
      "    font-size: 0.8rem;\n" +
      "    color: var(--text-color-light);\n" +
      "}\n\n" +
      "button {\n" +
      "    background-color: var(--primary-color);\n" +
      "    color: white;\n" +
      "    border: none;\n" +
      "    padding: 0.5rem 1rem;\n" +
      "    border-radius: var(--border-radius);\n" +
      "    cursor: pointer;\n" +
      "    transition: background-color 0.3s ease;\n" +
      "}\n\n" +
      "button:hover {\n" +
      "    background-color: var(--primary-dark);\n" +
      "}\n\n" +
      ".form-group {\n" +
      "    margin-bottom: 1.5rem;\n" +
      "}\n\n" +
      ".form-group label {\n" +
      "    display: block;\n" +
      "    margin-bottom: 0.5rem;\n" +
      "    font-weight: bold;\n" +
      "}\n\n" +
      ".input-row {\n" +
      "    display: flex;\n" +
      "    gap: 0.5rem;\n" +
      "}\n\n" +
      "input[type=\"text\"] {\n" +
      "    padding: 0.5rem;\n" +
      "    border: 1px solid #ccc;\n" +
      "    border-radius: var(--border-radius);\n" +
      "    width: 100%;\n" +
      "}\n\n" +
      ".llm-options {\n" +
      "    background-color: var(--bg-secondary);\n" +
      "    padding: 1rem;\n" +
      "    border-radius: var(--border-radius);\n" +
      "    margin-bottom: 1.5rem;\n" +
      "}\n\n" +
      ".radio-group {\n" +
      "    margin: 0.7rem 0;\n" +
      "}\n\n" +
      ".begin-adventure-button {\n" +
      "    font-size: 1.2rem;\n" +
      "    padding: 0.7rem 1.5rem;\n" +
      "    margin: 1rem auto;\n" +
      "    display: block;\n" +
      "    width: 80%;\n" +
      "    max-width: 300px;\n" +
      "    background-color: var(--accent-color);\n" +
      "    color: var(--text-color);\n" +
      "    font-weight: bold;\n" +
      "    box-shadow: 0 3px 5px rgba(0,0,0,0.2);\n" +
      "}\n\n" +
      ".begin-adventure-button:hover {\n" +
      "    background-color: #e6c621;\n" +
      "    transform: translateY(-2px);\n" +
      "    box-shadow: 0 5px 8px rgba(0,0,0,0.2);\n" +
      "}\n\n" +
      "#narrative-container {\n" +
      "    background-color: rgba(106, 13, 173, 0.05);\n" +
      "    padding: 1.5rem;\n" +
      "    border-radius: 8px;\n" +
      "    margin-bottom: 1.5rem;\n" +
      "    border-left: 4px solid #6a0dad;\n" +
      "}\n\n" +
      "#narrative-text {\n" +
      "    font-size: 1.1rem;\n" +
      "    line-height: 1.6;\n" +
      "}\n\n" +
      "#choices-list {\n" +
      "    list-style: none;\n" +
      "    padding: 0;\n" +
      "}\n\n" +
      "#choices-list li {\n" +
      "    margin: 1rem 0;\n" +
      "    padding: 1rem;\n" +
      "    background-color: rgba(142, 68, 173, 0.1);\n" +
      "    border-radius: 8px;\n" +
      "    cursor: pointer;\n" +
      "    transition: all 0.3s ease;\n" +
      "}\n\n" +
      "#choices-list li:hover {\n" +
      "    background-color: rgba(142, 68, 173, 0.2);\n" +
      "    transform: translateX(10px);\n" +
      "}\n\n" +
      ".game-controls {\n" +
      "    display: flex;\n" +
      "    justify-content: space-between;\n" +
      "    margin-top: 2rem;\n" +
      "}\n\n" +
      ".hidden {\n" +
      "    display: none;\n" +
      "}\n\n" +
      ".progress-bar {\n" +
      "    width: 100%;\n" +
      "    height: 20px;\n" +
      "    background-color: #e0e0e0;\n" +
      "    border-radius: 10px;\n" +
      "    margin: 10px 0;\n" +
      "    overflow: hidden;\n" +
      "}\n\n" +
      ".progress-fill {\n" +
      "    height: 100%;\n" +
      "    background-color: var(--primary-color);\n" +
      "    transition: width 0.3s ease;\n" +
      "}\n\n" +
      ".small-text {\n" +
      "    font-size: 0.8rem;\n" +
      "    color: var(--text-color-light);\n" +
      "}\n\n" +
      ".generating-indicator {\n" +
      "    text-align: center;\n" +
      "    padding: 1rem;\n" +
      "    font-style: italic;\n" +
      "    color: var(--primary-dark);\n" +
      "}\n\n" +
      ".loading-dots {\n" +
      "    display: inline-block;\n" +
      "    width: 20px;\n" +
      "}\n\n" +
      "@media (max-width: 600px) {\n" +
      "    body {\n" +
      "        font-size: 0.9rem;\n" +
      "    }\n" +
      "    \n" +
      "    .container {\n" +
      "        padding: 0.5rem;\n" +
      "    }\n" +
      "    \n" +
      "    .game-controls {\n" +
      "        flex-direction: column;\n" +
      "        gap: 0.5rem;\n" +
      "    }\n" +
      "    \n" +
      "    .game-controls button {\n" +
      "        width: 100%;\n" +
      "    }\n" +
      "}",
      {
        headers: {
          "content-type": "text/css",
          "cache-control": "no-cache, no-store, must-revalidate"
        }
      }
    );
  } else {
    // Handle all other routes, serve the main HTML with standard string concatenation
    return new Response(
      "<!DOCTYPE html>" +
      "<html lang=\"en\">" +
      "<head>" +
      "    <meta charset=\"UTF-8\">" +
      "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">" +
      "    <meta http-equiv=\"Cache-Control\" content=\"no-cache, no-store, must-revalidate\">" +
      "    <meta http-equiv=\"Pragma\" content=\"no-cache\">" +
      "    <meta http-equiv=\"Expires\" content=\"0\">" +
      "    <title>Chaotic Adventures v1.3.2</title>" +
      "    <link rel=\"stylesheet\" href=\"style.css\">" +
      "    <!-- Import Transformers.js for browser-based LLM -->" +
      "    <script>" +
      "        // Create a transformers loader function that will handle errors gracefully" +
      "        window.loadTransformers = function() {" +
      "            console.log(\"Attempting to load Transformers.js library\");" +
      "            return new Promise((resolve, reject) => {" +
      "                try {" +
      "                    // Create script element" +
      "                    const script = document.createElement('script');" +
      "                    script.src = \"https://cdn.jsdelivr.net/npm/@xenova/transformers@2.15.1\";" +
      "                    script.async = true;" +
      "                    " +
      "                    // Set up success handler" +
      "                    script.onload = function() {" +
      "                        console.log(\"Transformers.js script loaded successfully\");" +
      "                        try {" +
      "                            // Set global access with additional checks" +
      "                            if (window.Xenova && window.Xenova.transformers) {" +
      "                                window.webllm = window.Xenova.transformers;" +
      "                                console.log(\"Transformers.js initialized successfully\");" +
      "                                resolve(true);" +
      "                            } else {" +
      "                                console.warn(\"Transformers.js loaded but Xenova.transformers not found\");" +
      "                                window.webllm = null;" +
      "                                resolve(false);" +
      "                            }" +
      "                        } catch (e) {" +
      "                            console.error(\"Error in Transformers.js initialization:\", e);" +
      "                            window.webllm = null;" +
      "                            resolve(false);" +
      "                        }" +
      "                    };" +
      "                    " +
      "                    // Set up error handler" +
      "                    script.onerror = function(e) {" +
      "                        console.error(\"Failed to load Transformers.js script:\", e);" +
      "                        window.webllm = null;" +
      "                        resolve(false); // Resolve with false rather than reject to prevent crashing" +
      "                    };" +
      "                    " +
      "                    // Add script to document" +
      "                    document.head.appendChild(script);" +
      "                } catch (e) {" +
      "                    console.error(\"Error setting up Transformers.js loader:\", e);" +
      "                    window.webllm = null;" +
      "                    resolve(false);" +
      "                }" +
      "            });" +
      "        };" +
      "        " +
      "        // Also create a fallback mechanism" +
      "        window.webllm = null;" +
      "        " +
      "        // Immediately try to load transformers" +
      "        window.loadTransformers().then(function(success) {" +
      "            if (!success) {" +
      "                console.warn(\"Transformers.js initialization failed, will use mock mode\");" +
      "                // Ensure the mock mode is selected" +
      "                setTimeout(function() {" +
      "                    var mockRadio = document.getElementById('llm-mode-mock');" +
      "                    if (mockRadio) {" +
      "                        mockRadio.checked = true;" +
      "                        // Trigger change event" +
      "                        var event = new Event('change');" +
      "                        mockRadio.dispatchEvent(event);" +
      "                    }" +
      "                }, 500);" +
      "            }" +
      "        });" +
      "    </script>" +
      "    <script>" +
      "        // EMERGENCY INITIALIZATION SCRIPT" +
      "        window.emergencyInit = function() {" +
      "            console.log(\"Emergency initialization running\");" +
      "            " +
      "            try {" +
      "                // Create emergency header panel" +
      "                var emergencyHeader = document.createElement('div');" +
      "                emergencyHeader.id = 'emergency-header';" +
      "                emergencyHeader.style.cssText = 'position:fixed; top:0; left:0; right:0; background:#6a0dad; color:white; padding:5px; z-index:999999; text-align:center; font-weight:bold; font-size:12px;';" +
      "                emergencyHeader.innerHTML = 'CHAOTIC ADVENTURES v1.3.2 - ENHANCED RELIABILITY MODE - ' + new Date().toLocaleTimeString();" +
      "                " +
      "                // Add to document if it doesn't already exist" +
      "                var existingHeader = document.getElementById('emergency-header');" +
      "                if (existingHeader) {" +
      "                    existingHeader.parentNode.replaceChild(emergencyHeader, existingHeader);" +
      "                } else if (document.body) {" +
      "                    document.body.appendChild(emergencyHeader);" +
      "                }" +
      "                " +
      "                // Create a function to handle the emergency game start" +
      "                window.emergencyGameStart = function() {" +
      "                    var playerName = document.getElementById('player-name') ? document.getElementById('player-name').value : 'Adventurer';" +
      "                    if (!playerName) playerName = 'Adventurer';" +
      "                    " +
      "                    // Hide all screens" +
      "                    var allScreens = document.querySelectorAll('.game-screen');" +
      "                    for (var i = 0; i < allScreens.length; i++) {" +
      "                        allScreens[i].style.display = 'none';" +
      "                        allScreens[i].classList.remove('active');" +
      "                    }" +
      "                    " +
      "                    // Show game screen" +
      "                    var gameScreen = document.getElementById('game-screen');" +
      "                    if (gameScreen) {" +
      "                        gameScreen.style.display = 'block';" +
      "                        gameScreen.style.visibility = 'visible';" +
      "                        gameScreen.style.opacity = '1';" +
      "                        gameScreen.classList.add('active');" +
      "                    }" +
      "                    " +
      "                    // Set up narrative" +
      "                    var narrativeContainer = document.getElementById('narrative-container');" +
      "                    var narrativeText = document.getElementById('narrative-text');" +
      "                    " +
      "                    if (narrativeContainer) {" +
      "                        narrativeContainer.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; background-color: rgba(106, 13, 173, 0.05); padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem; border-left: 4px solid #6a0dad;';" +
      "                    }" +
      "                    " +
      "                    if (narrativeText) {" +
      "                        narrativeText.innerHTML = '<strong style=\"color:#6a0dad\">[EMERGENCY START]</strong> Welcome, ' + playerName + ', to the Whimsical Woods, a place where logic takes a backseat and chaos reigns supreme! As you step into the forest, the trees seem to whisper your name, occasionally mispronouncing it in increasingly ridiculous ways. The path ahead splits in three directions, and you notice a squirrel wearing tiny spectacles studying a miniature map nearby.';" +
      "                        narrativeText.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; font-size: 1.1rem; line-height: 1.6;';" +
      "                    }" +
      "                    " +
      "                    // Set up choices" +
      "                    var choicesList = document.getElementById('choices-list');" +
      "                    if (choicesList) {" +
      "                        choicesList.innerHTML = '';" +
      "                        " +
      "                        var choices = [" +
      "                            \"Follow the glowing mushrooms deeper into the woods\"," +
      "                            \"Climb the nearest tree to get a better view\"," +
      "                            \"Strike up a conversation with the bespectacled squirrel\"" +
      "                        ];" +
      "                        " +
      "                        choices.forEach(function(choice) {" +
      "                            var li = document.createElement('li');" +
      "                            li.textContent = choice;" +
      "                            li.style.cssText = 'margin: 1rem 0; padding: 1rem; background-color: rgba(142, 68, 173, 0.1); border-radius: 8px; cursor: pointer; transition: all 0.3s ease;';" +
      "                            li.onmouseover = function() { this.style.backgroundColor = 'rgba(142, 68, 173, 0.2)'; this.style.transform = 'translateX(10px)'; };" +
      "                            li.onmouseout = function() { this.style.backgroundColor = 'rgba(142, 68, 173, 0.1)'; this.style.transform = 'translateX(0)'; };" +
      "                            li.onclick = function() {" +
      "                                alert('You chose: ' + choice + '\\n\\nEmergency mode is active, so the game cannot progress further, but the UI is working!');" +
      "                            };" +
      "                            choicesList.appendChild(li);" +
      "                        });" +
      "                    }" +
      "                    " +
      "                    // Update the emergency header" +
      "                    if (document.getElementById('emergency-header')) {" +
      "                        document.getElementById('emergency-header').innerHTML = '⚡ EMERGENCY MODE ACTIVE - GAME RUNNING IN FALLBACK MODE - Player: ' + playerName;" +
      "                    }" +
      "                };" +
      "                " +
      "                // Add a safe wrapper to the start button" +
      "                var startButton = document.getElementById('start-game');" +
      "                if (startButton) {" +
      "                    startButton.addEventListener('click', function() {" +
      "                        if (typeof window.startGame === 'function') {" +
      "                            try {" +
      "                                window.startGame();" +
      "                            } catch (err) {" +
      "                                console.error(\"Regular startGame failed:\", err);" +
      "                                window.emergencyGameStart();" +
      "                            }" +
      "                        } else {" +
      "                            window.emergencyGameStart();" +
      "                        }" +
      "                    });" +
      "                }" +
      "            } catch (err) {" +
      "                console.error(\"Emergency initialization error:\", err);" +
      "            }" +
      "        };" +
      "        " +
      "        // Run emergency init on window load" +
      "        window.addEventListener('load', function() {" +
      "            window.emergencyInit();" +
      "        });" +
      "        " +
      "        // Also run it after a delay as a fallback" +
      "        setTimeout(function() {" +
      "            if (document.readyState === 'complete' && !document.getElementById('emergency-header')) {" +
      "                window.emergencyInit();" +
      "            }" +
      "        }, 1000);" +
      "    </script>" +
      "</head>" +
      "<body>" +
      "    <div class=\"container\">" +
      "        <header>" +
      "            <h1>Chaotic Adventures</h1>" +
      "            <p class=\"tagline\">Where the unexpected becomes reality! (v1.3.2)</p>" +
      "        </header>" +
      "        " +
      "        <main>" +
      "            <div id=\"start-screen\" class=\"game-screen active\">" +
      "                <h2>Begin Your Chaotic Adventure</h2>" +
      "                <div class=\"form-group\">" +
      "                    <label for=\"player-name\">Enter your name:</label>" +
      "                    <div class=\"input-row\">" +
      "                        <input type=\"text\" id=\"player-name\" placeholder=\"Your name\">" +
      "                        <button id=\"random-name\" type=\"button\" title=\"Generate random name\">🎲</button>" +
      "                    </div>" +
      "                </div>" +
      "                <div class=\"form-group\">" +
      "                    <label for=\"chaos-level\">Chaos Level (1-10):</label>" +
      "                    <input type=\"range\" id=\"chaos-level\" min=\"1\" max=\"10\" value=\"5\">" +
      "                    <span id=\"chaos-value\">5</span>" +
      "                </div>" +
      "                <div class=\"form-group llm-options\">" +
      "                    <label>LLM Mode:</label>" +
      "                    <div class=\"radio-group\">" +
      "                        <input type=\"radio\" id=\"llm-mode-mock\" name=\"llm-mode\" value=\"mock\" checked>" +
      "                        <label for=\"llm-mode-mock\">Use Mock Responses (Instant)</label>" +
      "                    </div>" +
      "                    <div class=\"radio-group\">" +
      "                        <input type=\"radio\" id=\"llm-mode-browser\" name=\"llm-mode\" value=\"browser\">" +
      "                        <label for=\"llm-mode-browser\">Run LLM in Browser (Offline Play)</label>" +
      "                    </div>" +
      "                    <div class=\"radio-group\">" +
      "                        <input type=\"radio\" id=\"llm-mode-server\" name=\"llm-mode\" value=\"server\">" +
      "                        <label for=\"llm-mode-server\">Use Server API (Best Quality)</label>" +
      "                    </div>" +
      "                </div>" +
      "                <div id=\"llm-loading\" class=\"hidden\">" +
      "                    <p>Preparing model resources... <span id=\"load-progress\">0%</span></p>" +
      "                    <div class=\"progress-bar\">" +
      "                        <div class=\"progress-fill\" style=\"width: 0%\"></div>" +
      "                    </div>" +
      "                    <div class=\"model-info\">" +
      "                        <p class=\"small-text\">First load may take a few minutes. Model will be cached for future use.</p>" +
      "                    </div>" +
      "                </div>" +
      "                <button id=\"start-game\" class=\"begin-adventure-button\">Begin Adventure</button>" +
      "            </div>" +
      "            " +
      "            <div id=\"game-screen\" class=\"game-screen\" style=\"display: none;\">" +
      "                <div id=\"narrative-container\" style=\"display: block !important; visibility: visible !important; opacity: 1 !important;\">" +
      "                    <p id=\"narrative-text\" style=\"display: block !important; visibility: visible !important; opacity: 1 !important;\"></p>" +
      "                </div>" +
      "                " +
      "                <div id=\"choices-container\">" +
      "                    <h3>What will you do?</h3>" +
      "                    <ul id=\"choices-list\"></ul>" +
      "                </div>" +
      "                " +
      "                <div class=\"game-controls\">" +
      "                    <button id=\"save-game\">Save Game</button>" +
      "                    <button id=\"load-game\">Load Game</button>" +
      "                    <button id=\"end-game\">End Adventure</button>" +
      "                </div>" +
      "            </div>" +
      "            " +
      "            <div id=\"summary-screen\" class=\"game-screen\">" +
      "                <h2>Your Adventure Summary</h2>" +
      "                <div id=\"summary-container\">" +
      "                    <p id=\"summary-text\"></p>" +
      "                </div>" +
      "                <button id=\"new-game\">Start New Adventure</button>" +
      "            </div>" +
      "        </main>" +
      "        " +
      "        <footer>" +
      "            <p>Powered by browser-based LLM - Created for Chaotic Adventures v1.3.2</p>" +
      "        </footer>" +
      "    </div>" +
      "    " +
      "    <script src=\"app.js\"></script>" +
      "</body>" +
      "</html>",
      {
        headers: {
          "content-type": "text/html",
          "cache-control": "no-cache, no-store, must-revalidate"
        }
      }
    );
  }
}