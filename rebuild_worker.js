// Create a simple worker script that serves static content directly
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // For the root path or index.html, serve the HTML content
  if (path === "/" || path === "/index.html") {
    return new Response(
      // HTML content (manually copied from index.html)
      `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
    <meta http-equiv="Pragma" content="no-cache">
    <meta http-equiv="Expires" content="0">
    <title>Chaotic Adventures v1.3.2</title>
    <link rel="stylesheet" href="style.css">
    <!-- Import Transformers.js for browser-based LLM -->
    <script src="https://cdn.jsdelivr.net/npm/@xenova/transformers@2.15.1"></script>
    <script>
        // Make Transformers.js available globally
        window.webllm = window.Xenova?.transformers;
        if (!window.webllm) {
            console.warn("Transformers.js not available");
        }
        
        // EMERGENCY INITIALIZATION SCRIPT - v1.3.2 Enhanced Reliability
        // This script will run even before DOM is loaded and provides a completely
        // independent way to check and fix the game's functionality
        
        // Create a global initialization function that can be called at any time
        window.emergencyInit = function() {
            console.log("🚨 Emergency initialization running");
            
            try {
                // Create emergency header panel
                var emergencyHeader = document.createElement('div');
                emergencyHeader.id = 'emergency-header';
                emergencyHeader.style.cssText = 'position:fixed; top:0; left:0; right:0; background:#6a0dad; color:white; padding:5px; z-index:999999; text-align:center; font-weight:bold; font-size:12px;';
                emergencyHeader.innerHTML = 'CHAOTIC ADVENTURES v1.3.2 - ENHANCED RELIABILITY MODE - ' + new Date().toLocaleTimeString();
                
                // Add to document if it doesn't already exist
                var existingHeader = document.getElementById('emergency-header');
                if (existingHeader) {
                    existingHeader.parentNode.replaceChild(emergencyHeader, existingHeader);
                } else if (document.body) {
                    document.body.appendChild(emergencyHeader);
                }
                
                // Create a function to handle the emergency game start
                window.emergencyGameStart = function() {
                    var playerName = document.getElementById('player-name')?.value || 'Adventurer';
                    
                    // Hide all screens
                    var allScreens = document.querySelectorAll('.game-screen');
                    for (var i = 0; i < allScreens.length; i++) {
                        allScreens[i].style.display = 'none';
                        allScreens[i].classList.remove('active');
                    }
                    
                    // Show game screen
                    var gameScreen = document.getElementById('game-screen');
                    if (gameScreen) {
                        gameScreen.style.display = 'block';
                        gameScreen.style.visibility = 'visible';
                        gameScreen.style.opacity = '1';
                        gameScreen.classList.add('active');
                    }
                    
                    // Set up narrative
                    var narrativeContainer = document.getElementById('narrative-container');
                    var narrativeText = document.getElementById('narrative-text');
                    
                    if (narrativeContainer) {
                        narrativeContainer.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; background-color: rgba(106, 13, 173, 0.05); padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem; border-left: 4px solid #6a0dad;';
                    }
                    
                    if (narrativeText) {
                        narrativeText.innerHTML = '<strong style="color:#6a0dad">[EMERGENCY START]</strong> Welcome, ' + playerName + ', to the Whimsical Woods, a place where logic takes a backseat and chaos reigns supreme! As you step into the forest, the trees seem to whisper your name, occasionally mispronouncing it in increasingly ridiculous ways. The path ahead splits in three directions, and you notice a squirrel wearing tiny spectacles studying a miniature map nearby.';
                        narrativeText.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; font-size: 1.1rem; line-height: 1.6;';
                    }
                    
                    // Set up choices
                    var choicesList = document.getElementById('choices-list');
                    if (choicesList) {
                        choicesList.innerHTML = '';
                        
                        var choices = [
                            "Follow the glowing mushrooms deeper into the woods",
                            "Climb the nearest tree to get a better view",
                            "Strike up a conversation with the bespectacled squirrel"
                        ];
                        
                        choices.forEach(function(choice) {
                            var li = document.createElement('li');
                            li.textContent = choice;
                            li.style.cssText = 'margin: 1rem 0; padding: 1rem; background-color: rgba(142, 68, 173, 0.1); border-radius: 8px; cursor: pointer; transition: all 0.3s ease;';
                            li.onmouseover = function() { this.style.backgroundColor = 'rgba(142, 68, 173, 0.2)'; this.style.transform = 'translateX(10px)'; };
                            li.onmouseout = function() { this.style.backgroundColor = 'rgba(142, 68, 173, 0.1)'; this.style.transform = 'translateX(0)'; };
                            li.onclick = function() {
                                alert('You chose: ' + choice + '\\n\\nEmergency mode is active, so the game cannot progress further, but the UI is working!');
                            };
                            choicesList.appendChild(li);
                        });
                    }
                    
                    // Update the emergency header
                    if (document.getElementById('emergency-header')) {
                        document.getElementById('emergency-header').innerHTML = '⚡ EMERGENCY MODE ACTIVE - GAME RUNNING IN FALLBACK MODE - Player: ' + playerName;
                    }
                };
                
                // Create the debug control panel
                var debugPanel = document.createElement('div');
                debugPanel.id = 'debug-panel';
                debugPanel.style.cssText = 'position:fixed; top:30px; right:10px; background:white; color:black; padding:10px; z-index:999998; box-shadow:0 0 10px rgba(0,0,0,0.5); border-radius:5px; max-width:300px;';
                
                // Add a header
                var header = document.createElement('h3');
                header.textContent = 'Debug Controls v1.3.2';
                header.style.margin = '0 0 10px 0';
                header.style.color = '#6a0dad';
                debugPanel.appendChild(header);
                
                // Add emergency game start button
                var emergencyButton = document.createElement('button');
                emergencyButton.textContent = '🚀 Start Emergency Game';
                emergencyButton.style.cssText = 'background:#6a0dad; color:white; border:none; padding:5px 10px; margin:5px 0; border-radius:3px; cursor:pointer; width:100%;';
                emergencyButton.onclick = window.emergencyGameStart;
                debugPanel.appendChild(emergencyButton);
                
                // Add a test button
                var testButton = document.createElement('button');
                testButton.textContent = '🔍 Test Narrative Display';
                testButton.style.cssText = 'background:#333; color:white; border:none; padding:5px 10px; margin:5px 0; border-radius:3px; cursor:pointer; width:100%;';
                testButton.onclick = function() {
                    var narrativeEl = document.getElementById('narrative-text');
                    if (narrativeEl) {
                        narrativeEl.innerHTML = '<span style="color:red; font-weight:bold; font-size:20px;">EMERGENCY TEST TEXT - IF YOU CAN SEE THIS, TEXT DISPLAY WORKS</span>';
                        alert('Test text inserted. Check if you can see it.');
                    } else {
                        alert('Error: Could not find narrative-text element!');
                    }
                };
                debugPanel.appendChild(testButton);
                
                // Add a DOM check button
                var checkButton = document.createElement('button');
                checkButton.textContent = '🔬 Inspect DOM State';
                checkButton.style.cssText = 'background:#333; color:white; border:none; padding:5px 10px; margin:5px 0; border-radius:3px; cursor:pointer; width:100%;';
                checkButton.onclick = function() {
                    var narrativeEl = document.getElementById('narrative-text');
                    var gameScreen = document.getElementById('game-screen');
                    
                    var report = 'DOM STATUS REPORT:\\n\\n';
                    
                    if (narrativeEl) {
                        report += 'Narrative Element: ✓\\n' +
                                'Content: ' + (narrativeEl.textContent ? '✓ (' + narrativeEl.textContent.length + ' chars)' : '✗ EMPTY') + '\\n' +
                                'Display: ' + window.getComputedStyle(narrativeEl).display + '\\n' +
                                'Visibility: ' + window.getComputedStyle(narrativeEl).visibility + '\\n' +
                                'Opacity: ' + window.getComputedStyle(narrativeEl).opacity + '\\n\\n';
                    } else {
                        report += 'Narrative Element: ✗ NOT FOUND\\n\\n';
                    }
                    
                    if (gameScreen) {
                        report += 'Game Screen: ✓\\n' +
                                'Active Class: ' + (gameScreen.classList.contains('active') ? '✓' : '✗') + '\\n' +
                                'Display: ' + window.getComputedStyle(gameScreen).display + '\\n' +
                                'Visibility: ' + window.getComputedStyle(gameScreen).visibility + '\\n' +
                                'Opacity: ' + window.getComputedStyle(gameScreen).opacity + '\\n\\n';
                    } else {
                        report += 'Game Screen: ✗ NOT FOUND\\n\\n';
                    }
                    
                    alert(report);
                };
                debugPanel.appendChild(checkButton);
                
                // Add close button
                var closeButton = document.createElement('button');
                closeButton.textContent = '✖ Close';
                closeButton.style.cssText = 'background:#f44336; color:white; border:none; padding:5px 10px; margin:5px 0; border-radius:3px; cursor:pointer; width:100%;';
                closeButton.onclick = function() {
                    debugPanel.style.display = 'none';
                };
                debugPanel.appendChild(closeButton);
                
                // Add to document if body is available
                if (document.body) {
                    document.body.appendChild(debugPanel);
                }
                
                // Check if we should attach to the start button
                var startButton = document.getElementById('start-game');
                if (startButton) {
                    // Create a wrapper function to try the regular startGame first, then fall back
                    var safeStartGame = function() {
                        console.log("Safe start game wrapper invoked");
                        // Try regular startGame first if it exists
                        if (typeof window.startGame === 'function') {
                            try {
                                window.startGame();
                                return;
                            } catch (err) {
                                console.error("Regular startGame failed:", err);
                            }
                        }
                        
                        // If we get here, regular startGame failed or doesn't exist
                        window.emergencyGameStart();
                    };
                    
                    // Attach our safe wrapper
                    startButton.addEventListener('click', safeStartGame);
                    startButton.onclick = safeStartGame;
                    
                    console.log("Emergency start button handler attached");
                }
                
                console.log("🚨 Emergency initialization complete");
            } catch (err) {
                console.error("Emergency initialization error:", err);
                
                // Last resort error handler - just show a basic alert
                if (document.body) {
                    var errorMsg = document.createElement('div');
                    errorMsg.style.cssText = 'position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); background:red; color:white; padding:20px; z-index:999999; text-align:center; font-weight:bold; border-radius:10px;';
                    errorMsg.innerHTML = 'ERROR: Emergency script failed:<br>' + err.message;
                    document.body.appendChild(errorMsg);
                }
            }
        };
        
        // Run emergency init on window load
        window.addEventListener('load', function() {
            console.log("Window load event - running emergency init");
            window.emergencyInit();
        });
        
        // Also run it after a delay as a fallback
        setTimeout(function() {
            console.log("Delayed emergency init check");
            if (document.readyState === 'complete' && !document.getElementById('emergency-header')) {
                console.log("Running delayed emergency init");
                window.emergencyInit();
            }
        }, 1000);
    </script>
</head>
<body>
    <div class="container">
        <header>
            <h1>Chaotic Adventures</h1>
            <p class="tagline">Where the unexpected becomes reality! (v1.3.2)</p>
        </header>
        
        <main>
            <div id="start-screen" class="game-screen active">
                <h2>Begin Your Chaotic Adventure</h2>
                <div class="form-group">
                    <label for="player-name">Enter your name:</label>
                    <div class="input-row">
                        <input type="text" id="player-name" placeholder="Your name">
                        <button id="random-name" type="button" title="Generate random name">🎲</button>
                    </div>
                </div>
                <div class="form-group">
                    <label for="chaos-level">Chaos Level (1-10):</label>
                    <input type="range" id="chaos-level" min="1" max="10" value="5">
                    <span id="chaos-value">5</span>
                </div>
                <div class="form-group llm-options">
                    <label>LLM Mode:</label>
                    <div class="radio-group">
                        <input type="radio" id="llm-mode-mock" name="llm-mode" value="mock" checked>
                        <label for="llm-mode-mock">Use Mock Responses (Instant)</label>
                    </div>
                    <div class="radio-group">
                        <input type="radio" id="llm-mode-browser" name="llm-mode" value="browser">
                        <label for="llm-mode-browser">Run LLM in Browser (Offline Play)</label>
                    </div>
                    <div class="radio-group">
                        <input type="radio" id="llm-mode-server" name="llm-mode" value="server">
                        <label for="llm-mode-server">Use Server API (Unavailable in this deployment)</label>
                    </div>
                </div>
                <div id="llm-loading" class="hidden">
                    <p>Preparing model resources... <span id="load-progress">0%</span></p>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 0%"></div>
                    </div>
                    <div class="model-info">
                        <p class="small-text">First load may take a few minutes. Model will be cached for future use.</p>
                    </div>
                </div>
                <button id="start-game" class="begin-adventure-button">Begin Adventure</button>
            </div>
            
            <div id="game-screen" class="game-screen" style="display: none;">
                <div id="narrative-container" style="display: block !important; visibility: visible !important; opacity: 1 !important;">
                    <p id="narrative-text" style="display: block !important; visibility: visible !important; opacity: 1 !important;"></p>
                </div>
                
                <div id="choices-container">
                    <h3>What will you do?</h3>
                    <ul id="choices-list"></ul>
                </div>
                
                <div class="game-controls">
                    <button id="save-game">Save Game</button>
                    <button id="load-game">Load Game</button>
                    <button id="end-game">End Adventure</button>
                </div>
            </div>
            
            <div id="summary-screen" class="game-screen">
                <h2>Your Adventure Summary</h2>
                <div id="summary-container">
                    <p id="summary-text"></p>
                </div>
                <button id="new-game">Start New Adventure</button>
            </div>
        </main>
        
        <footer>
            <p>Powered by browser-based LLM - Created for Chaotic Adventures v1.3.2</p>
        </footer>
    </div>
    
    <script src="app.js?v=1.3.2&bust=20250322"></script>
    <script>
        // BUTTON FIX - Direct approach to ensure button works
        (function() {
            // Immediately try to set up the button onclick handler
            var startButton = document.getElementById('start-game');
            if (startButton) {
                console.log("IMMEDIATE FIX: Adding direct click handler to start button");
                startButton.onclick = function() {
                    // This is a local startGame function that will work regardless of other scripts
                    console.log("Direct button handler executed");
                    
                    // Get player name and validate
                    var playerNameInput = document.getElementById('player-name');
                    var playerName = playerNameInput ? playerNameInput.value.trim() : "Player";
                    if (!playerName) {
                        alert('Please enter your name to begin the adventure!');
                        return;
                    }
                    
                    // Get chaos level
                    var chaosLevelInput = document.getElementById('chaos-level');
                    var chaosLevel = chaosLevelInput ? parseInt(chaosLevelInput.value) : 5;
                    
                    // Show game screen
                    var startScreen = document.getElementById('start-screen');
                    var gameScreen = document.getElementById('game-screen');
                    
                    if (startScreen && gameScreen) {
                        // Hide start screen
                        startScreen.classList.remove('active');
                        startScreen.style.display = 'none';
                        
                        // Show game screen
                        gameScreen.classList.add('active');
                        gameScreen.style.display = 'block';
                        gameScreen.style.opacity = '1';
                        gameScreen.style.visibility = 'visible';
                        
                        // Make sure narrative is visible
                        var narrativeText = document.getElementById('narrative-text');
                        var narrativeContainer = document.getElementById('narrative-container');
                        
                        if (narrativeContainer) {
                            narrativeContainer.style.display = 'block';
                            narrativeContainer.style.visibility = 'visible';
                            narrativeContainer.style.opacity = '1';
                        }
                        
                        if (narrativeText) {
                            // Set default narrative
                            narrativeText.textContent = "Welcome, " + playerName + ", to the Whimsical Woods, a place where logic takes a backseat and chaos reigns supreme! As you step into the forest, the trees seem to whisper your name, occasionally mispronouncing it in increasingly ridiculous ways. The path ahead splits in three directions, and you notice a squirrel wearing tiny spectacles studying a miniature map nearby.";
                            
                            // Make sure it's visible
                            narrativeText.style.display = 'block';
                            narrativeText.style.visibility = 'visible';
                            narrativeText.style.opacity = '1';
                        }
                        
                        // Set up some default choices
                        var choicesList = document.getElementById('choices-list');
                        if (choicesList) {
                            choicesList.innerHTML = 
                                "<li>Follow the glowing mushrooms deeper into the woods</li>" +
                                "<li>Climb the nearest tree to get a better view</li>" +
                                "<li>Strike up a conversation with the bespectacled squirrel</li>";
                            
                            // Add click handlers to choices
                            var choices = choicesList.querySelectorAll('li');
                            choices.forEach(function(choice) {
                                choice.addEventListener('click', function() {
                                    alert('This is a direct fallback implementation. The main game functionality should be working now!');
                                });
                            });
                        }
                    } else {
                        alert('Game screen elements not found. Please refresh the page.');
                    }
                };
            }
            
            // Also add a global startGame function as a fallback
            window.startGame = window.startGame || function() {
                console.log("Global fallback startGame function called");
                if (startButton && startButton.onclick) {
                    startButton.onclick();
                } else {
                    alert('Cannot start game: button functionality not available');
                }
            };
        })();
        
        // DIRECT EMERGENCY SCRIPT - Last resort intervention
        setTimeout(function() {
            // Create a direct message to the user about caching issues
            var cachingNotice = document.createElement('div');
            cachingNotice.style.cssText = 'position:fixed; bottom:0; left:0; right:0; background:orange; color:black; padding:15px; z-index:999999; font-size:18px; text-align:center;';
            cachingNotice.innerHTML = '<strong>IMPORTANT:</strong> If you do not see a red debug bar at the top of the page, you are viewing a cached version. Please try: <br>' +
                '1. Hard refresh (Ctrl+F5 or Cmd+Shift+R)<br>' +
                '2. Clear browser cache<br>' +
                '3. Open in incognito/private window<br>' +
                '4. Try a different browser';
            document.body.appendChild(cachingNotice);
            
            // Direct emergency fix for game screen
            var gameScreen = document.getElementById('game-screen');
            if (gameScreen) {
                gameScreen.style.cssText = 'display:block !important; opacity:1 !important; visibility:visible !important;';
                gameScreen.classList.add('active');
            }
            
            // Direct emergency fix for narrative container
            var narrativeContainer = document.getElementById('narrative-container');
            if (narrativeContainer) {
                narrativeContainer.style.cssText = 'display:block !important; opacity:1 !important; visibility:visible !important; background-color:#ff0 !important; padding:20px !important; margin:20px !important; border:5px solid red !important;';
            }
            
            // Direct emergency fix for narrative text
            var narrativeText = document.getElementById('narrative-text');
            if (narrativeText) {
                narrativeText.innerHTML = '<div style="color:red; font-size:24px; font-weight:bold;">EMERGENCY DIRECT INSERT - v1.3.2-NOCACHE</div>' +
                    '<div style="color:blue; font-size:18px; margin-top:10px;">If you can see this text, direct DOM insertion works.</div>' +
                    '<div style="margin-top:20px;">This text was added by a direct script injection at the bottom of the HTML file.</div>' +
                    '<div style="margin-top:10px;">Current time: ' + new Date().toISOString() + '</div>';
                
                narrativeText.style.cssText = 'display:block !important; opacity:1 !important; visibility:visible !important; color:#000 !important; font-size:16px !important;';
            }
        }, 1000); // Wait 1 second after page load to apply these changes
    </script>
</body>
</html>`,
      {
        headers: {
          "content-type": "text/html;charset=UTF-8",
          "cache-control": "no-cache, no-store, must-revalidate"
        }
      }
    );
  }

  // Handle app.js requests
  if (path === "/app.js") {
    return new Response(
      // App.js content (insert the entire app.js file here but with template literals escaped)
      // For this example, we'll just include a small mock version
      `
/**
 * Chaotic Adventures - Frontend JavaScript - v1.3.2
 * 
 * Handles user interaction and communicates with the backend API.
 */

// Game state
const gameState = {
    playerName: '',
    chaosLevel: 5,
    currentNarrative: '',
    choices: [],
    gameId: null,
    isGameActive: false,
    llmMode: 'mock', // 'mock', 'browser', or 'server'
    browserLlm: null
};

// DOM elements
const elements = {
    // Screens
    startScreen: document.getElementById('start-screen'),
    gameScreen: document.getElementById('game-screen'),
    summaryScreen: document.getElementById('summary-screen'),
    
    // Start screen elements
    playerNameInput: document.getElementById('player-name'),
    randomNameButton: document.getElementById('random-name'),
    chaosLevelInput: document.getElementById('chaos-level'),
    chaosValueDisplay: document.getElementById('chaos-value'),
    startGameButton: document.getElementById('start-game'),
    llmModeMock: document.getElementById('llm-mode-mock'),
    llmModeBrowser: document.getElementById('llm-mode-browser'),
    llmModeServer: document.getElementById('llm-mode-server'),
    llmLoading: document.getElementById('llm-loading'),
    loadProgress: document.getElementById('load-progress'),
    progressFill: document.querySelector('.progress-fill'),
    
    // Game screen elements
    narrativeText: document.getElementById('narrative-text'),
    choicesList: document.getElementById('choices-list'),
    saveGameButton: document.getElementById('save-game'),
    loadGameButton: document.getElementById('load-game'),
    endGameButton: document.getElementById('end-game'),
    
    // Summary screen elements
    summaryText: document.getElementById('summary-text'),
    newGameButton: document.getElementById('new-game')
};

/**
 * Generate a random player name
 */
function generateRandomName() {
    const prefixes = [
        "Adventurous", "Chaotic", "Curious", "Daring", "Eccentric", 
        "Fearless", "Goofy", "Heroic", "Intrepid", "Jovial"
    ];
    
    const names = [
        "Alex", "Bailey", "Casey", "Dana", "Ellis",
        "Finley", "Gray", "Harper", "Indigo", "Jordan"
    ];
    
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const name = names[Math.floor(Math.random() * names.length)];
    
    return prefix + " " + name;
}

/**
 * Show a specific screen - Completely redesigned for reliability
 * @param {string} screenName - The name of the screen to show ('start', 'game', or 'summary')
 */
function showScreen(screenName) {
    console.log("SCREEN TRANSITION: Changing to " + screenName + " screen");
    
    // STEP 1: Prepare all screens before transition
    // We'll first set display:none on ALL screens via direct style (not classes)
    // This ensures a clean slate regardless of CSS loading issues
    elements.startScreen.style.display = 'none';
    elements.gameScreen.style.display = 'none';
    elements.summaryScreen.style.display = 'none';
    
    // STEP 2: Remove all active classes (belt and suspenders approach)
    elements.startScreen.classList.remove('active');
    elements.gameScreen.classList.remove('active');
    elements.summaryScreen.classList.remove('active');
    
    // STEP 3: Special preparation for game screen BEFORE showing it
    if (screenName === 'game') {
        // Ensure the narrative exists and has content before showing
        const narrativeText = elements.narrativeText;
        const narrativeContainer = narrativeText ? narrativeText.parentElement : null;
        
        // Direct style application - no transitions, no !important, just direct DOM manipulation
        if (narrativeContainer) {
            // First remove any existing styles to prevent conflicts
            narrativeContainer.removeAttribute('style');
            // Then apply clean styles
            narrativeContainer.style.display = 'block';
            narrativeContainer.style.visibility = 'visible';
            narrativeContainer.style.opacity = '1';
            narrativeContainer.style.backgroundColor = 'rgba(106, 13, 173, 0.05)';
            narrativeContainer.style.padding = '1.5rem';
            narrativeContainer.style.borderRadius = '8px';
            narrativeContainer.style.marginBottom = '1.5rem';
            narrativeContainer.style.borderLeft = '4px solid #6a0dad';
        }
        
        if (narrativeText) {
            // First remove any existing styles to prevent conflicts
            narrativeText.removeAttribute('style');
            // Then apply clean styles
            narrativeText.style.display = 'block';
            narrativeText.style.visibility = 'visible';
            narrativeText.style.opacity = '1';
            narrativeText.style.fontSize = '1.1rem';
            narrativeText.style.lineHeight = '1.6';
        }
    }
    
    // STEP 4: Show the target screen with direct styles first (immediate, guaranteed visibility)
    let targetScreen = null;
    switch (screenName) {
        case 'start':
            targetScreen = elements.startScreen;
            break;
        case 'game':
            targetScreen = elements.gameScreen;
            break;
        case 'summary':
            targetScreen = elements.summaryScreen;
            break;
        default:
            console.error("Unknown screen name: " + screenName);
            return; // Exit if invalid screen
    }
    
    // Apply direct styles to ensure immediate visibility
    if (targetScreen) {
        // Direct style manipulation first
        targetScreen.style.display = 'block';
        targetScreen.style.visibility = 'visible';
        targetScreen.style.opacity = '1';
        
        // Then add the class for any additional styling
        targetScreen.classList.add('active');
        
        console.log("Screen " + screenName + " is now visible");
    }
}

/**
 * Start a new game
 */
function startGame() {
    console.log("GAME START: Begin Adventure button clicked");
    
    // Validate player name
    const playerName = elements.playerNameInput.value.trim();
    if (!playerName) {
        alert('Please enter your name to begin the adventure!');
        return;
    }
    
    // Update game state
    gameState.playerName = playerName;
    gameState.chaosLevel = parseInt(elements.chaosLevelInput.value);
    gameState.isGameActive = true;
    
    // Set up mock narrative
    const narrative = "Welcome, " + playerName + ", to the Whimsical Woods, a place where logic takes a backseat and chaos reigns supreme! As you step into the forest, the trees seem to whisper your name, occasionally mispronouncing it in increasingly ridiculous ways. The path ahead splits in three directions, and you notice a squirrel wearing tiny spectacles studying a miniature map nearby.";
    gameState.currentNarrative = narrative;
    elements.narrativeText.textContent = narrative;
    
    // Ensure narrative container is visible
    if (elements.narrativeText.parentElement) {
        elements.narrativeText.parentElement.style.display = 'block';
        elements.narrativeText.parentElement.style.visibility = 'visible';
        elements.narrativeText.parentElement.style.opacity = '1';
    }
    
    // Set up choices
    const choices = [
        "Follow the glowing mushrooms deeper into the woods",
        "Climb the nearest tree to get a better view",
        "Strike up a conversation with the bespectacled squirrel"
    ];
    gameState.choices = choices;
    renderChoices(choices);
    
    // Show game screen
    showScreen('game');
}

/**
 * Render choices on the game screen
 */
function renderChoices(choices) {
    // Clear existing choices
    elements.choicesList.innerHTML = '';
    
    // Create and add choice elements
    choices.forEach(choice => {
        const li = document.createElement('li');
        li.textContent = choice;
        li.classList.add('choice-item');
        li.style.margin = '1rem 0';
        li.style.padding = '1rem';
        li.style.backgroundColor = 'rgba(142, 68, 173, 0.1)';
        li.style.borderRadius = '8px';
        li.style.cursor = 'pointer';
        li.style.transition = 'all 0.3s ease';
        
        li.addEventListener('click', () => {
            alert('You chose: ' + choice + '\\nThis is a mock implementation!');
        });
        
        elements.choicesList.appendChild(li);
    });
}

// Initialize the game
function init() {
    // Set up event listeners
    elements.randomNameButton.addEventListener('click', () => {
        elements.playerNameInput.value = generateRandomName();
    });
    
    elements.chaosLevelInput.addEventListener('input', () => {
        elements.chaosValueDisplay.textContent = elements.chaosLevelInput.value;
    });
    
    elements.startGameButton.addEventListener('click', startGame);
    
    // Initialize with a random name
    if (!elements.playerNameInput.value) {
        elements.playerNameInput.value = generateRandomName();
    }
    
    // Make sure chaos level display is updated
    elements.chaosValueDisplay.textContent = elements.chaosLevelInput.value;
    
    console.log("Game initialization completed");
}

// Run initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
      `,
      {
        headers: {
          "content-type": "application/javascript",
          "cache-control": "no-cache, no-store, must-revalidate"
        }
      }
    );
  }

  // Handle style.css requests
  if (path === "/style.css") {
    return new Response(
      // CSS content (insert the entire style.css file here)
      `
/* Chaotic Adventures Stylesheet */

/* Global Styles */
:root {
    --primary-color: #6a0dad;
    --secondary-color: #8e44ad;
    --background-color: #f9f9f9;
    --text-color: #333;
    --border-color: #ddd;
}

* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    color: var(--text-color);
    background-color: var(--background-color);
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

.container {
    width: 100%;
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
    flex: 1;
}

/* Header Styles */
header {
    text-align: center;
    margin-bottom: 2rem;
}

h1 {
    color: var(--primary-color);
    margin-bottom: 0.5rem;
    font-size: 2.5rem;
}

.tagline {
    color: var(--secondary-color);
    font-style: italic;
}

/* Screen Transitions */
.game-screen {
    display: none;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.3s ease, visibility 0.3s ease;
}

.game-screen.active {
    display: block;
    opacity: 1;
    visibility: visible;
}

/* Start Screen Styles */
.form-group {
    margin-bottom: 1.5rem;
}

label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: bold;
}

.input-row {
    display: flex;
    gap: 0.5rem;
}

input[type="text"] {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    font-size: 1rem;
}

button {
    background-color: var(--primary-color);
    color: white;
    border: none;
    border-radius: 4px;
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.3s ease;
}

button:hover {
    background-color: var(--secondary-color);
}

#random-name {
    padding: 0.75rem;
}

input[type="range"] {
    width: 100%;
    margin-bottom: 0.5rem;
}

#chaos-value {
    font-weight: bold;
    float: right;
}

.begin-adventure-button {
    display: block;
    width: 100%;
    max-width: 300px;
    margin: 2rem auto 0;
    padding: 1rem;
    font-size: 1.2rem;
    text-align: center;
}

/* Game Screen Styles */
#narrative-container {
    background-color: rgba(106, 13, 173, 0.05);
    padding: 1.5rem;
    border-radius: 8px;
    margin-bottom: 1.5rem;
    border-left: 4px solid var(--primary-color);
}

#narrative-text {
    font-size: 1.1rem;
    line-height: 1.6;
}

#choices-container h3 {
    margin-bottom: 1rem;
    color: var(--primary-color);
}

#choices-list {
    list-style: none;
}

#choices-list li {
    margin: 1rem 0;
    padding: 1rem;
    background-color: rgba(142, 68, 173, 0.1);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
}

#choices-list li:hover {
    background-color: rgba(142, 68, 173, 0.2);
    transform: translateX(10px);
}

.game-controls {
    margin-top: 2rem;
    display: flex;
    justify-content: space-between;
}

.game-controls button {
    flex: 1;
    margin: 0 0.5rem;
}

/* Summary Screen Styles */
#summary-container {
    background-color: rgba(106, 13, 173, 0.05);
    padding: 1.5rem;
    border-radius: 8px;
    margin-bottom: 1.5rem;
    border-left: 4px solid var(--primary-color);
}

#new-game {
    display: block;
    width: 100%;
    max-width: 300px;
    margin: 2rem auto 0;
}

/* Footer Styles */
footer {
    text-align: center;
    margin-top: 2rem;
    padding: 1rem;
    color: #777;
    font-size: 0.9rem;
    border-top: 1px solid var(--border-color);
}

/* LLM Options */
.llm-options {
    background-color: rgba(106, 13, 173, 0.05);
    padding: 1rem;
    border-radius: 8px;
}

.radio-group {
    margin: 0.5rem 0;
}

/* Loading Indicator */
#llm-loading {
    margin-top: 1rem;
}

.hidden {
    display: none;
}

.progress-bar {
    height: 10px;
    background-color: #eee;
    border-radius: 5px;
    margin: 0.5rem 0;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background-color: var(--primary-color);
    transition: width 0.3s ease;
}

.model-info {
    margin-top: 0.5rem;
}

.small-text {
    font-size: 0.8rem;
    color: #777;
}

/* Responsive Styles */
@media (max-width: 600px) {
    .container {
        padding: 1rem;
    }
    
    h1 {
        font-size: 2rem;
    }
    
    .game-controls {
        flex-direction: column;
    }
    
    .game-controls button {
        margin: 0.5rem 0;
    }
}
      `,
      {
        headers: {
          "content-type": "text/css",
          "cache-control": "no-cache, no-store, must-revalidate"
        }
      }
    );
  }

  // For all other routes, serve the main HTML
  return new Response(
    // HTML content (here, we reference the getHtmlContent function directly for simplicity)
    `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chaotic Adventures - 404</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            text-align: center;
            margin: 3rem;
            color: #333;
        }
        h1 {
            color: #6a0dad;
        }
        a {
            color: #6a0dad;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <h1>404 - Adventure Not Found</h1>
    <p>Oops! It seems you've wandered off the path.</p>
    <p>Your adventure awaits at the <a href="/">main entrance</a>.</p>
</body>
</html>`,
    {
      headers: {
        "content-type": "text/html;charset=UTF-8",
        "status": 404,
        "cache-control": "no-cache, no-store, must-revalidate"
      }
    }
  );
}