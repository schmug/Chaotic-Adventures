/**
 * Chaotic Adventures - Frontend JavaScript
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

// Global constants
const MOCK_MODE = false; // Set to true to use mock data for save/load

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

// API endpoints
const API = {
    baseUrl: '/api',
    startGame: '/start',
    makeChoice: '/choice',
    getChoices: '/choices',
    getSummary: '/summary',
    saveGame: '/save',
    loadGame: '/load'
};

// WebLLM config
const WEBLLM_CONFIG = {
    // Use smaller models for better performance in browsers
    // Options for various sizes (smaller = faster, less accurate)
    models: {
        tiny: "Xenova/TinyLlama-1.1B-Chat-v1.0",
        small: "Xenova/Llama-2-7b-chat-hf",
        medium: "Xenova/Llama-2-13b-chat-hf"
    },
    // Default to the smallest model for faster loading
    modelId: "Xenova/TinyLlama-1.1B-Chat-v1.0",
    // Callback for loading progress
    progress_callback: (progress) => {
        const percent = Math.round(progress * 100);
        if (elements.loadProgress) {
            elements.loadProgress.textContent = `${percent}%`;
        }
        if (elements.progressFill) {
            elements.progressFill.style.width = `${percent}%`;
        }
        // Additional loading step messages
        if (percent < 20) {
            elements.llmLoading.querySelector('p').textContent = 
                `Preparing model resources... ${percent}%`;
        } else if (percent < 60) {
            elements.llmLoading.querySelector('p').textContent = 
                `Downloading model files... ${percent}%`;
        } else if (percent < 90) {
            elements.llmLoading.querySelector('p').textContent = 
                `Initializing language model... ${percent}%`;
        } else {
            elements.llmLoading.querySelector('p').textContent = 
                `Almost ready... ${percent}%`;
        }
    }
};

/**
 * Generate a random player name
 */
function generateRandomName() {
    const prefixes = [
        "Adventurous", "Chaotic", "Curious", "Daring", "Eccentric", 
        "Fearless", "Goofy", "Heroic", "Intrepid", "Jovial",
        "Kooky", "Lucky", "Mysterious", "Nimble", "Odd", 
        "Peculiar", "Quirky", "Reckless", "Silly", "Tenacious",
        "Unpredictable", "Valiant", "Wacky", "Zealous"
    ];
    
    const names = [
        "Alex", "Bailey", "Casey", "Dana", "Ellis",
        "Finley", "Gray", "Harper", "Indigo", "Jordan",
        "Kelly", "Logan", "Morgan", "Noel", "Parker",
        "Quinn", "Riley", "Sam", "Taylor", "Val",
        "Wren", "Yuri", "Zephyr"
    ];
    
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const name = names[Math.floor(Math.random() * names.length)];
    
    return `${prefix} ${name}`;
}

function init() {
    // Set up event listeners
    elements.startGameButton.addEventListener('click', startGame);
    elements.randomNameButton.addEventListener('click', () => {
        elements.playerNameInput.value = generateRandomName();
    });
    elements.chaosLevelInput.addEventListener('input', updateChaosDisplay);
    elements.saveGameButton.addEventListener('click', saveGame);
    elements.loadGameButton.addEventListener('click', loadGame);
    elements.endGameButton.addEventListener('click', endGame);
    elements.newGameButton.addEventListener('click', resetGame);
    
    // LLM mode selection
    elements.llmModeMock.addEventListener('change', updateLlmMode);
    elements.llmModeBrowser.addEventListener('change', updateLlmMode);
    elements.llmModeServer.addEventListener('change', updateLlmMode);
    
    // Initial chaos level display
    updateChaosDisplay();
}

/**
 * Update the chaos level display
 */
function updateChaosDisplay() {
    elements.chaosValueDisplay.textContent = elements.chaosLevelInput.value;
}

/**
 * Update the LLM mode based on radio selection
 */
function updateLlmMode() {
    if (elements.llmModeMock.checked) {
        gameState.llmMode = 'mock';
        elements.llmLoading.classList.add('hidden');
    } else if (elements.llmModeBrowser.checked) {
        gameState.llmMode = 'browser';
        initBrowserLlm();
    } else if (elements.llmModeServer.checked) {
        gameState.llmMode = 'server';
        elements.llmLoading.classList.add('hidden');
    }
}

/**
 * Initialize the browser-based LLM
 */
async function initBrowserLlm() {
    if (!window.webllm) {
        console.warn('WebLLM library not available.');
        alert('WebLLM library not available. Using mock mode instead.');
        elements.llmModeMock.checked = true;
        gameState.llmMode = 'mock';
        return;
    }
    
    try {
        if (elements.llmLoading) {
            elements.llmLoading.classList.remove('hidden');
        }
        if (elements.startGameButton) {
            elements.startGameButton.disabled = true;
        }
        
        // Initialize WebLLM with Transformers.js from Hugging Face
        if (!gameState.browserLlm) {
            // Create pipeline for text generation
            const { pipeline } = window.webllm;
            gameState.browserLlm = await pipeline('text-generation', WEBLLM_CONFIG.modelId, {
                progress_callback: WEBLLM_CONFIG.progress_callback
            });
        }
        
        if (elements.llmLoading) {
            elements.llmLoading.classList.add('hidden');
        }
        if (elements.startGameButton) {
            elements.startGameButton.disabled = false;
        }
    } catch (error) {
        console.error('Error initializing browser LLM:', error);
        alert('Failed to load the LLM model. Using mock mode instead.');
        if (elements.llmModeMock) {
            elements.llmModeMock.checked = true;
        }
        gameState.llmMode = 'mock';
        if (elements.llmLoading) {
            elements.llmLoading.classList.add('hidden');
        }
        if (elements.startGameButton) {
            elements.startGameButton.disabled = false;
        }
    }
}

/**
 * Generate text using browser-based LLM
 */
async function generateWithBrowserLlm(prompt, maxTokens = 500) {
    if (!gameState.browserLlm) {
        console.error('Browser LLM not initialized');
        return getMockResponse('fallback');
    }
    
    // Create a loading indicator for the narrative text area if passed
    let loadingIndicator = null;
    const narrativeEl = document.getElementById('narrative-text');
    
    if (narrativeEl) {
        // Save existing content
        const originalContent = narrativeEl.textContent;
        
        // Clear current content and create loading animation
        narrativeEl.innerHTML = '';
        narrativeEl.style.display = 'block';
        narrativeEl.style.visibility = 'visible';
        
        // Create loading indicator with animated dots
        loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'generating-indicator';
        
        const textSpan = document.createElement('span');
        textSpan.textContent = 'The LLM is crafting your chaotic adventure';
        loadingIndicator.appendChild(textSpan);
        
        const dotsContainer = document.createElement('span');
        dotsContainer.className = 'loading-dots';
        dotsContainer.textContent = '...';
        loadingIndicator.appendChild(dotsContainer);
        
        narrativeEl.appendChild(loadingIndicator);
        
        // Make sure parent container is visible 
        if (narrativeEl.parentElement) {
            narrativeEl.parentElement.style.display = 'block';
            narrativeEl.parentElement.style.visibility = 'visible';
        }
        
        // Force layout recalculation
        const forceRedraw = narrativeEl.offsetHeight;
        
        // Animate the dots
        let dots = 0;
        const dotsInterval = setInterval(() => {
            dots = (dots + 1) % 4;
            dotsContainer.textContent = '.'.repeat(dots);
        }, 300);
        
        // Store the interval ID to clear it later
        loadingIndicator.dotsInterval = dotsInterval;
    }
    
    try {
        // Log that generation is starting
        console.log(`Generating with Browser LLM: ${prompt.slice(0, 50)}...`);
        
        // Set reasonable parameters for interactive story generation
        const parameters = {
            max_new_tokens: maxTokens,
            temperature: 0.8,
            top_p: 0.95,
            repetition_penalty: 1.1
        };
        
        // Run the model
        console.time('LLM Generation Time');
        const result = await gameState.browserLlm(prompt, parameters);
        console.timeEnd('LLM Generation Time');
        
        // Extract generated text and clean it up
        let generatedText = result[0].generated_text;
        console.log(`Raw LLM output (${generatedText.length} chars): ${generatedText.slice(0, 50)}...`);
        
        // Remove the original prompt from the response
        if (generatedText.startsWith(prompt)) {
            generatedText = generatedText.substring(prompt.length).trim();
            console.log(`Trimmed LLM output (${generatedText.length} chars): ${generatedText.slice(0, 50)}...`);
        }
        
        // Clean up loading indicator if it exists
        if (loadingIndicator && loadingIndicator.parentNode) {
            // Clear the animation interval
            if (loadingIndicator.dotsInterval) {
                clearInterval(loadingIndicator.dotsInterval);
            }
            
            // Remove the loading indicator
            loadingIndicator.parentNode.removeChild(loadingIndicator);
        }
        
        // Ensure narrative element is still visible and properly populated
        if (narrativeEl) {
            console.log("Ensuring narrative element visibility after generation");
            window.setTimeout(() => {
                narrativeEl.style.display = 'block';
                narrativeEl.style.visibility = 'visible';
                if (narrativeEl.parentElement) {
                    narrativeEl.parentElement.style.display = 'block';
                }
                // Force layout recalculation
                const forceRedraw = narrativeEl.offsetHeight;
            }, 0);
        }
        
        return generatedText;
    } catch (error) {
        console.error('Error generating with browser LLM:', error);
        
        // Clean up loading indicator if it exists
        if (loadingIndicator && loadingIndicator.parentNode) {
            // Clear the animation interval
            if (loadingIndicator.dotsInterval) {
                clearInterval(loadingIndicator.dotsInterval);
            }
            
            // Remove the loading indicator
            loadingIndicator.parentNode.removeChild(loadingIndicator);
        }
        
        return getMockResponse('fallback');
    }
}

/**
 * Start a new game
 */
async function startGame() {
    // Get player name and validate
    const playerName = elements.playerNameInput.value.trim();
    if (!playerName) {
        alert('Please enter your name to begin the adventure!');
        return;
    }
    
    // Update game state
    gameState.playerName = playerName;
    gameState.chaosLevel = parseInt(elements.chaosLevelInput.value);
    gameState.isGameActive = true;
    
    // Disable start button and show loading indicator
    elements.startGameButton.disabled = true;
    elements.startGameButton.textContent = 'Loading...';
    
    try {
        if (gameState.llmMode === 'mock') {
            // Mock start game response
            const mockIntro = getMockResponse('intro');
            gameState.currentNarrative = mockIntro;
            elements.narrativeText.textContent = mockIntro;
            
            // Get mock choices
            const mockChoices = getMockChoices();
            gameState.choices = mockChoices;
            renderChoices(mockChoices);
            
            // Show game screen
            showScreen('game');
        } 
        else if (gameState.llmMode === 'browser') {
            // Generate intro with browser LLM
            const prompt = `You are creating a chaotic and humorous adventure game introduction. 
            The player's name is ${playerName}. Create an introduction (150-200 words) for a
            whimsical, slightly absurd scenario. Make it first-person narrative and end at a
            decision point. Chaos level is ${gameState.chaosLevel}/10.`;
            
            console.log("Generating intro text with browser LLM");
            const introText = await generateWithBrowserLlm(prompt);
            gameState.currentNarrative = introText;
            console.log("Browser LLM returned intro text: " + introText.slice(0, 50) + "...");
            
            // Prepare the game screen before showing it
            // Pre-set the narrative text to ensure it exists when we switch screens
            console.log("Setting narrative text to: " + introText.slice(0, 50) + "...");
            
            // First make sure the game screen is accessible
            elements.gameScreen.style.display = 'block';
            elements.gameScreen.style.opacity = '0'; // Invisible but accessible in DOM
            
            // Set the narrative text and ensure the container is visible WITH OBVIOUS MARKERS
            // Clear any existing content
            elements.narrativeText.innerHTML = '';
            
            // Add a visible start marker
            const startMarker = document.createElement('strong');
            startMarker.textContent = "[NARRATIVE START] ";
            startMarker.style.color = 'red';
            elements.narrativeText.appendChild(startMarker);
            
            // Add the actual narrative content
            const textNode = document.createTextNode(introText);
            elements.narrativeText.appendChild(textNode);
            
            // Add a visible end marker
            const endMarker = document.createElement('strong');
            endMarker.textContent = " [NARRATIVE END]";
            endMarker.style.color = 'red';
            elements.narrativeText.appendChild(endMarker);
            
            // Set critical visibility properties
            elements.narrativeText.style.display = 'block';
            elements.narrativeText.style.visibility = 'visible';
            elements.narrativeText.style.opacity = '1';
            
            // Make sure container is visible
            if (elements.narrativeText.parentElement) {
                elements.narrativeText.parentElement.style.display = 'block';
                elements.narrativeText.parentElement.style.visibility = 'visible';
                elements.narrativeText.parentElement.style.opacity = '1';
            }
            
            // Force a layout recalculation to ensure browser has processed these changes
            const forceLayout = elements.narrativeText.offsetHeight;
            
            // Set text also as direct attribute to maximize compatibility
            elements.narrativeText.setAttribute('data-content', introText);
            
            // Create a direct fixed position backup element that will always be visible
            const backupElement = document.createElement('div');
            backupElement.id = 'backup-narrative';
            backupElement.innerHTML = `<strong style="color:red">BACKUP NARRATIVE:</strong> ${introText}`;
            backupElement.style.cssText = 'position: fixed; top: 10px; left: 10px; background: white; color: black; z-index: 9999; padding: 5px; border: 2px solid red; max-width: 80%; max-height: 30%; overflow: auto;';
            document.body.appendChild(backupElement);
            
            // Debug info
            console.log(`Narrative element after update: ${elements.narrativeText.textContent.slice(0, 50)}... Element has children: ${elements.narrativeText.children.length} Element visible: ${elements.narrativeText.offsetParent !== null}`);
            console.log("Updated UI with narrative text");
            
            // Generate choices with browser LLM
            const choicesPrompt = `Based on this introduction: "${introText}", 
            generate 3-4 possible choices for the player. Make them concise (max 15 words each)
            and include at least one unexpected or absurd option. Format as a numbered list.`;
            
            const choicesText = await generateWithBrowserLlm(choicesPrompt, 200);
            
            // Parse choices from the text
            const choices = parseChoicesFromText(choicesText);
            gameState.choices = choices;
            
            // Important: Apply direct inline styles with !important before showing the screen
            elements.narrativeText.setAttribute('style', 
                'display: block !important; ' +
                'visibility: visible !important; ' +
                'opacity: 1 !important; ' +
                'font-size: 1.1rem !important; ' +
                'line-height: 1.6 !important;'
            );
            
            // Now render choices and show the game screen
            renderChoices(choices);
            
            // Reset game screen display before showing it properly
            elements.gameScreen.style.display = '';
            elements.gameScreen.style.opacity = '';
            
            // Finally show the game screen
            showScreen('game');
        }
        else if (gameState.llmMode === 'openrouter') {
            try {
                // Check API availability first
                const checkResponse = await fetch(`${API.baseUrl}/version`, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json'
                    }
                });
                
                if (!checkResponse.ok) {
                    throw new Error(`API server not available (Status: ${checkResponse.status})`);
                }
                
                if (!gameState.openrouterModel) {
                    throw new Error('No OpenRouter model selected');
                }
                
                // Start game with OpenRouter
                const response = await fetch(`${API.baseUrl}${API.startGame}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        playerName: gameState.playerName,
                        chaosLevel: gameState.chaosLevel,
                        llmProvider: 'openrouter',
                        llmModel: gameState.openrouterModel
                    })
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('OpenRouter API error:', errorText);
                    throw new Error(`OpenRouter API error (${response.status}): ${response.statusText}`);
                }
                
                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    const responseText = await response.text();
                    console.error('Unexpected response format:', responseText);
                    throw new Error('Server returned non-JSON response');
                }
                
                const data = await response.json();
                
                if (!data.gameId || !data.narrative || !data.choices) {
                    console.error('Invalid API response structure:', data);
                    throw new Error('Server returned invalid data structure');
                }
                
                gameState.gameId = data.gameId;
                gameState.currentNarrative = data.narrative;
                gameState.choices = data.choices;
                
                elements.narrativeText.textContent = data.narrative;
                renderChoices(data.choices);
                
                // Show game screen
                showScreen('game');
            } catch (apiError) {
                console.error('OpenRouter Mode Error:', apiError);
                alert(`OpenRouter not available: ${apiError.message}\n\nSwitching to Mock mode for now.`);
                
                // Switch to mock mode automatically
                gameState.llmMode = 'mock';
                elements.llmModeMock.checked = true;
                
                // Load the game in mock mode
                const mockIntro = getMockResponse('intro');
                gameState.currentNarrative = mockIntro;
                elements.narrativeText.textContent = mockIntro;
                
                // Get mock choices
                const mockChoices = getMockChoices();
                gameState.choices = mockChoices;
                renderChoices(mockChoices);
                
                // Show game screen
                showScreen('game');
            }
        } 
        else if (gameState.llmMode === 'server') {
            try {
                // Check API availability first
                const checkResponse = await fetch(`${API.baseUrl}/version`, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json'
                    }
                });
                
                if (!checkResponse.ok) {
                    throw new Error(`API server not available (Status: ${checkResponse.status})`);
                }
                
                // API server is available, make the actual request
                const response = await fetch(`${API.baseUrl}${API.startGame}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        playerName: gameState.playerName,
                        chaosLevel: gameState.chaosLevel
                    })
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Server API error:', errorText);
                    throw new Error(`Server API error (${response.status}): ${response.statusText}`);
                }
                
                // Try to parse the response as JSON
                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    const responseText = await response.text();
                    console.error('Unexpected response format:', responseText);
                    throw new Error('Server returned non-JSON response');
                }
                
                const data = await response.json();
                
                if (!data.gameId || !data.narrative || !data.choices) {
                    console.error('Invalid API response structure:', data);
                    throw new Error('Server returned invalid data structure');
                }
                
                gameState.gameId = data.gameId;
                gameState.currentNarrative = data.narrative;
                gameState.choices = data.choices;
                
                elements.narrativeText.textContent = data.narrative;
                renderChoices(data.choices);
                
                // Show game screen
                showScreen('game');
            } catch (apiError) {
                console.error('Server API Mode Error:', apiError);
                alert(`Server API not available: ${apiError.message}\n\nSwitching to Mock mode for now.`);
                
                // Switch to mock mode automatically
                gameState.llmMode = 'mock';
                elements.llmModeMock.checked = true;
                
                // Load the game in mock mode
                const mockIntro = getMockResponse('intro');
                gameState.currentNarrative = mockIntro;
                elements.narrativeText.textContent = mockIntro;
                
                // Get mock choices
                const mockChoices = getMockChoices();
                gameState.choices = mockChoices;
                renderChoices(mockChoices);
                
                // Show game screen
                showScreen('game');
            }
        }
    } catch (error) {
        console.error('Error starting game:', error);
        alert('Failed to start the game. Please try again.');
    } finally {
        // Re-enable start button
        elements.startGameButton.disabled = false;
        elements.startGameButton.textContent = 'Begin Adventure';
    }
}

/**
 * Parse choices from LLM-generated text
 */
function parseChoicesFromText(text) {
    console.log("Parsing choices from text: " + text.slice(0, 100));
    
    // Try to extract numbered list items
    const numberPattern = /^\s*\d+\.\s*(.+)$/gm;
    const matches = [...text.matchAll(numberPattern)];
    
    console.log("Found numbered choices: " + matches.length);
    
    if (matches.length >= 2) {
        return matches.map(match => match[1].trim());
    }
    
    // Fallback: split by lines and filter
    const lines = text.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && line.length < 100)
        .filter(line => !line.startsWith("Choices:") && !line.includes("Option"));
    
    console.log("Line-based parsing found: " + lines.length + " potential choices");
    
    if (lines.length >= 2) {
        return lines.slice(0, 4); // Limit to 4 choices
    }
    
    console.log("Could not parse choices from text, using fallback");
    
    // Dynamic fallback - generate choices based on the narrative content
    const dynamicChoices = generateDynamicChoices(gameState.currentNarrative);
    if (dynamicChoices.length >= 2) {
        return dynamicChoices;
    }
    
    // Last resort static fallback
    return [
        "Continue the adventure", 
        "Try something else", 
        "Do something unexpected"
    ];
}

/**
 * Generate dynamic fallback choices based on narrative content
 */
function generateDynamicChoices(narrativeText) {
    console.log("Generating dynamic fallback choices based on narrative: " + narrativeText.slice(0, 50) + "...");
    
    // Extract keywords from narrative to create thematic choices
    const keywordSets = [
        { words: ['forest', 'woods', 'trees', 'jungle'], theme: 'forest' },
        { words: ['castle', 'tower', 'dungeon', 'fortress'], theme: 'castle' },
        { words: ['city', 'town', 'village', 'street'], theme: 'urban' },
        { words: ['ocean', 'sea', 'beach', 'water', 'ship'], theme: 'water' },
        { words: ['cave', 'mountain', 'tunnel', 'underground'], theme: 'cave' },
        { words: ['magic', 'spell', 'wizard', 'witch', 'potion'], theme: 'magic' },
        { words: ['tavern', 'inn', 'pub', 'bar', 'drink'], theme: 'tavern' }
    ];
    
    // Identify themes in the narrative
    const matchingThemes = [];
    const narrativeLower = narrativeText.toLowerCase();
    
    keywordSets.forEach(set => {
        for (const word of set.words) {
            if (narrativeLower.includes(word)) {
                matchingThemes.push(set.theme);
                break;
            }
        }
    });
    
    console.log("Matching themes found:", matchingThemes);
    
    // Generic choices that work for any scenario
    const genericChoices = [
        "Investigate further",
        "Try something unexpected",
        "Look for a way out",
        "Ask for more information"
    ];
    
    // Theme-specific choices
    const themeChoices = {
        forest: [
            "Explore deeper into the mysterious woods",
            "Climb a tall tree to get a better view",
            "Follow the animal tracks",
            "Look for edible berries or plants"
        ],
        castle: [
            "Search for secret passages",
            "Climb to the highest tower",
            "Look for the dungeon entrance",
            "Try to find the royal chambers"
        ],
        urban: [
            "Visit the local marketplace",
            "Find a place to rest and gather information",
            "Look for authorities or guards",
            "Explore the back alleys"
        ],
        water: [
            "Wade into the water carefully",
            "Look for a boat or vessel",
            "Search along the shoreline",
            "Try to catch a fish"
        ],
        cave: [
            "Venture deeper into the darkness",
            "Look for an alternative passage",
            "Examine the strange formations",
            "Test the stability of the rocks"
        ],
        magic: [
            "Attempt to cast a spell",
            "Examine the magical artifacts",
            "Look for a spell book or instructions",
            "Try to communicate with magical entities"
        ],
        tavern: [
            "Strike up a conversation with the bartender",
            "Challenge someone to a game of chance",
            "Order an unusual drink",
            "Listen for interesting rumors"
        ]
    };
    
    // Build a set of choices based on matched themes
    let choices = [];
    
    // Add theme-specific choices
    matchingThemes.forEach(theme => {
        if (themeChoices[theme]) {
            choices.push(...themeChoices[theme]);
        }
    });
    
    // If we don't have enough theme-specific choices, add some generic ones
    if (choices.length < 2) {
        choices = [...genericChoices];
    } else {
        // Mix in 1-2 generic choices for variety
        choices.push(genericChoices[Math.floor(Math.random() * genericChoices.length)]);
    }
    
    // Add a character-specific option if we can extract a name
    const playerName = gameState.playerName;
    if (playerName) {
        choices.push(`Ask about the strange events unfolding around ${playerName}`);
    }
    
    // Randomize and limit to 4 choices
    choices = choices
        .sort(() => Math.random() - 0.5)
        .slice(0, 4);
    
    console.log("Generated dynamic fallback choices:", choices);
    return choices;
}

/**
 * Make a choice in the game
 * @param {number} choiceIndex - The index of the chosen option
 */
async function makeChoice(choiceIndex) {
    const selectedChoice = gameState.choices[choiceIndex];
    
    // Disable choices during processing
    const choiceItems = elements.choicesList.querySelectorAll('li');
    choiceItems.forEach(item => {
        item.style.pointerEvents = 'none';
        item.style.opacity = '0.5';
    });
    
    try {
        if (gameState.llmMode === 'mock') {
            // Mock choice response
            const mockResponse = getMockResponse('choice');
            gameState.currentNarrative = mockResponse;
            elements.narrativeText.textContent = mockResponse;
            
            // Get new mock choices
            const mockChoices = getMockChoices();
            gameState.choices = mockChoices;
            renderChoices(mockChoices);
        } 
        else if (gameState.llmMode === 'browser') {
            // Generate response with browser LLM
            const prompt = `The player has chosen: "${selectedChoice}".
            Current narrative: "${gameState.currentNarrative}".
            Write a response (100-150 words) that advances the story in an unexpected 
            way with humor and surprises. Chaos level: ${gameState.chaosLevel}/10.`;
            
            const responseText = await generateWithBrowserLlm(prompt);
            gameState.currentNarrative = responseText;
            elements.narrativeText.textContent = responseText;
            
            // Maybe add a chaotic event (30% chance)
            if (Math.random() < 0.3) {
                const chaoticPrompt = `Generate a brief chaotic event (50-75 words)
                that unexpectedly disrupts the current situation. Make it surreal and humorous.
                Current narrative: "${responseText}".`;
                
                const chaoticEvent = await generateWithBrowserLlm(chaoticPrompt, 150);
                elements.narrativeText.textContent += "\n\n" + chaoticEvent;
                gameState.currentNarrative += "\n\n" + chaoticEvent;
            }
            
            // Generate new choices
            const choicesPrompt = `Based on this narrative: "${gameState.currentNarrative}",
            generate 3-4 possible choices for the player. Make them concise (max 15 words each)
            and include at least one unexpected or absurd option. Format as a numbered list.`;
            
            const choicesText = await generateWithBrowserLlm(choicesPrompt, 200);
            
            // Parse choices from the text
            const choices = parseChoicesFromText(choicesText);
            gameState.choices = choices;
            renderChoices(choices);
        }
        else if (gameState.llmMode === 'openrouter') {
            try {
                // OpenRouter choice response
                const response = await fetch(`${API.baseUrl}${API.makeChoice}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        gameId: gameState.gameId,
                        choiceIndex: choiceIndex
                    })
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('OpenRouter API choice error:', errorText);
                    throw new Error(`OpenRouter API error (${response.status}): ${response.statusText}`);
                }
                
                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    const responseText = await response.text();
                    console.error('Unexpected response format:', responseText);
                    throw new Error('Server returned non-JSON response');
                }
                
                const data = await response.json();
                
                if (!data.narrative || !data.choices) {
                    console.error('Invalid API response structure:', data);
                    throw new Error('Server returned invalid data structure');
                }
                
                // Handle game over
                if (data.narrative.game_over) {
                    gameState.currentNarrative = data.narrative.text;
                    elements.narrativeText.textContent = data.narrative.text;
                    
                    // Show game over message and summary option
                    setTimeout(() => {
                        endGame();
                    }, 2000);
                    return;
                }
                
                gameState.currentNarrative = data.narrative.text || data.narrative;
                gameState.choices = data.choices;
                
                elements.narrativeText.textContent = gameState.currentNarrative;
                renderChoices(data.choices);
                
            } catch (apiError) {
                console.error('OpenRouter choice error:', apiError);
                
                // Fallback to mock response
                const mockResponse = getMockResponse('choice');
                gameState.currentNarrative = mockResponse;
                elements.narrativeText.textContent = mockResponse;
                
                // Get new mock choices
                const mockChoices = getMockChoices();
                gameState.choices = mockChoices;
                renderChoices(mockChoices);
                
                // Notify user but allow continuing with mock data
                alert(`OpenRouter error: ${apiError.message}\nContinuing with mock responses.`);
            }
        } 
        else if (gameState.llmMode === 'server') {
            try {
                // Server API call with better error handling
                const response = await fetch(`${API.baseUrl}${API.makeChoice}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        gameId: gameState.gameId,
                        choiceIndex: choiceIndex
                    })
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Server API choice error:', errorText);
                    throw new Error(`Server API error (${response.status}): ${response.statusText}`);
                }
                
                // Check content type before parsing JSON
                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    const responseText = await response.text();
                    console.error('Unexpected response format:', responseText);
                    throw new Error('Server returned non-JSON response');
                }
                
                const data = await response.json();
                
                if (!data.narrative || !data.choices) {
                    console.error('Invalid API response structure:', data);
                    throw new Error('Server returned invalid data structure');
                }
                
                gameState.currentNarrative = data.narrative;
                gameState.choices = data.choices;
                
                elements.narrativeText.textContent = data.narrative;
                renderChoices(data.choices);
            } catch (apiError) {
                console.error('Server API choice error:', apiError);
                
                // Fallback to mock response
                const mockResponse = getMockResponse('choice');
                gameState.currentNarrative = mockResponse;
                elements.narrativeText.textContent = mockResponse;
                
                // Get new mock choices
                const mockChoices = getMockChoices();
                gameState.choices = mockChoices;
                renderChoices(mockChoices);
                
                // Notify user but allow continuing with mock data
                alert(`Server API error: ${apiError.message}\nContinuing with mock responses.`);
            }
        }
    } catch (error) {
        console.error('Error making choice:', error);
        alert('Failed to process your choice. Please try again.');
        
        // Re-enable choices
        choiceItems.forEach(item => {
            item.style.pointerEvents = 'auto';
            item.style.opacity = '1';
        });
    }
}

/**
 * Render the current choices
 * @param {Array} choices - The choices to render
 */
function renderChoices(choices) {
    console.log("Rendering choices:", choices);
    
    // Clear existing choices
    elements.choicesList.innerHTML = '';
    
    // Create and add the new choice elements
    choices.forEach((choice, index) => {
        const li = document.createElement('li');
        li.textContent = choice;
        li.addEventListener('click', () => makeChoice(index));
        elements.choicesList.appendChild(li);
    });
    
    // CRITICAL: Ensure narrative text is properly displayed
    // This uses a direct DOM method for maximum reliability
    const setupNarrativeContainer = () => {
        console.log("Ensuring narrative visibility in renderChoices");
        const narrativeText = document.getElementById('narrative-text');
        const narrativeContainer = document.getElementById('narrative-container');
        
        if (!narrativeText || !narrativeContainer) {
            console.error("Could not find narrative elements!");
            return;
        }
        
        // Explicitly make sure narrative text has content
        if ((!narrativeText.textContent || narrativeText.textContent.trim() === '') && gameState.currentNarrative) {
            console.log("Narrative text was empty! Restoring from gameState");
            // Insert the content twice - once as textContent and once as innerHTML for maximum compatibility
            narrativeText.textContent = gameState.currentNarrative;
            narrativeText.innerHTML = gameState.currentNarrative;
            
            // Create a bold marker text to make sure the text is visible
            const marker = document.createElement('strong');
            marker.textContent = "[START OF NARRATIVE] ";
            narrativeText.insertBefore(marker, narrativeText.firstChild);
            
            // Append another marker at the end
            const endMarker = document.createElement('strong');
            endMarker.textContent = " [END OF NARRATIVE]";
            narrativeText.appendChild(endMarker);
        } else {
            console.log("Current narrative content:", narrativeText.textContent || "EMPTY");
        }
        
        // Force all visibility properties 
        const cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important;';
        narrativeContainer.style.cssText += cssText;
        narrativeText.style.cssText += cssText;
        
        // Force layout recalculation 
        narrativeContainer.offsetHeight;
        narrativeText.offsetHeight;
        
        console.log("Narrative content after fixes:", narrativeText.textContent.slice(0, 50));
    };
    
    // Apply fixes immediately and after a short delay for reliability
    setupNarrativeContainer();
    setTimeout(setupNarrativeContainer, 50);
}

/**
 * Save the current game state
 */
function saveGame() {
    if (!gameState.isGameActive) return;
    
    // Save to localStorage regardless of mode - simplified for browser-based playing
    try {
        const saveData = {
            playerName: gameState.playerName,
            chaosLevel: gameState.chaosLevel,
            currentNarrative: gameState.currentNarrative,
            choices: gameState.choices,
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('chaotic_adventure_save', JSON.stringify(saveData));
        
        // Generate a save code for sharing
        const saveCode = btoa(JSON.stringify(saveData)).substring(0, 20);
        alert(`Game saved successfully!\nYour save code is: ${saveCode}`);
    } catch (error) {
        console.error('Error saving game:', error);
        alert('Failed to save the game. Please try again.');
    }
}

/**
 * Load a saved game
 */
function loadGame() {
    // First try loading from localStorage
    const savedGame = localStorage.getItem('chaotic_adventure_save');
    
    if (savedGame) {
        try {
            const savedState = JSON.parse(savedGame);
            gameState.playerName = savedState.playerName;
            gameState.chaosLevel = savedState.chaosLevel;
            gameState.currentNarrative = savedState.currentNarrative;
            gameState.choices = savedState.choices;
            gameState.isGameActive = true;
            
            elements.narrativeText.textContent = gameState.currentNarrative;
            renderChoices(gameState.choices);
            
            showScreen('game');
            alert('Game loaded successfully!');
            return;
        } catch (error) {
            console.error('Error parsing saved game:', error);
            alert('Failed to load the saved game. The save file might be corrupted.');
        }
    }
    
    // If local storage failed or was empty, try using a save code
    try {
        const loadCode = prompt('Enter your save code or paste a saved game JSON:');
        if (!loadCode) return;
        
        // Check if it's a JSON string
        if (loadCode.startsWith('{')) {
            try {
                const savedState = JSON.parse(loadCode);
                if (savedState.playerName && savedState.currentNarrative) {
                    gameState.playerName = savedState.playerName;
                    gameState.chaosLevel = savedState.chaosLevel || 5;
                    gameState.currentNarrative = savedState.currentNarrative;
                    gameState.choices = savedState.choices || [];
                    gameState.isGameActive = true;
                    
                    elements.narrativeText.textContent = gameState.currentNarrative;
                    renderChoices(gameState.choices);
                    
                    showScreen('game');
                    alert('Game loaded successfully!');
                } else {
                    throw new Error('Invalid save data format');
                }
            } catch (e) {
                alert('Invalid JSON format. Please check your save data.');
            }
            return;
        }
        
        // Try to decode the save code
        try {
            const decodedData = JSON.parse(atob(loadCode + '====')); // Add padding
            if (decodedData.playerName && decodedData.currentNarrative) {
                gameState.playerName = decodedData.playerName;
                gameState.chaosLevel = decodedData.chaosLevel || 5;
                gameState.currentNarrative = decodedData.currentNarrative;
                gameState.choices = decodedData.choices || [];
                gameState.isGameActive = true;
                
                elements.narrativeText.textContent = gameState.currentNarrative;
                renderChoices(gameState.choices);
                
                showScreen('game');
                alert('Game loaded successfully!');
            } else {
                throw new Error('Invalid save code format');
            }
        } catch (e) {
            alert('Invalid save code. Please check your code and try again.');
        }
    } catch (error) {
        console.error('Error loading game:', error);
        alert('Failed to load the game. Please try again.');
    }
}

/**
 * End the current game and show the summary
 */
async function endGame() {
    if (!gameState.isGameActive) return;
    
    // Disable end game button
    elements.endGameButton.disabled = true;
    elements.endGameButton.textContent = 'Generating Summary...';
    
    try {
        if (gameState.llmMode === 'mock') {
            // Mock game summary
            const mockSummary = getMockResponse('summary');
            elements.summaryText.textContent = mockSummary;
            showScreen('summary');
        } 
        else if (gameState.llmMode === 'browser') {
            // Generate summary with browser LLM
            const prompt = `Create a humorous summary (100-200 words) of this adventure:
            Player name: ${gameState.playerName}
            Current narrative: ${gameState.currentNarrative}
            
            Create a summary that recaps the adventure, highlights absurd moments,
            pokes gentle fun at the player's journey, and has a satisfying conclusion.
            Make it funny and self-aware. Chaos level: ${gameState.chaosLevel}/10.`;
            
            const summary = await generateWithBrowserLlm(prompt, 500);
            elements.summaryText.textContent = summary;
            showScreen('summary');
        }
        else if (gameState.llmMode === 'openrouter') {
            try {
                // OpenRouter summary
                const response = await fetch(`${API.baseUrl}${API.getSummary}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        gameId: gameState.gameId
                    })
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('OpenRouter API summary error:', errorText);
                    throw new Error(`OpenRouter API error (${response.status}): ${response.statusText}`);
                }
                
                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    const responseText = await response.text();
                    console.error('Unexpected response format:', responseText);
                    throw new Error('Server returned non-JSON response');
                }
                
                const data = await response.json();
                
                if (!data.summary) {
                    console.error('Invalid API response structure:', data);
                    throw new Error('Server returned invalid data structure');
                }
                
                elements.summaryText.textContent = data.summary;
                showScreen('summary');
            } catch (apiError) {
                console.error('OpenRouter summary error:', apiError);
                
                // Fallback to mock summary
                const mockSummary = getMockResponse('summary');
                elements.summaryText.textContent = mockSummary;
                showScreen('summary');
                
                // Notify user but continue with mock data
                alert(`OpenRouter error: ${apiError.message}\nUsing a mock summary instead.`);
            }
        } 
        else if (gameState.llmMode === 'server') {
            try {
                // Server API call with improved error handling
                const response = await fetch(`${API.baseUrl}${API.getSummary}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        gameId: gameState.gameId
                    })
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Server API summary error:', errorText);
                    throw new Error(`Server API error (${response.status}): ${response.statusText}`);
                }
                
                // Check content type before parsing JSON
                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    const responseText = await response.text();
                    console.error('Unexpected response format:', responseText);
                    throw new Error('Server returned non-JSON response');
                }
                
                const data = await response.json();
                
                if (!data.summary) {
                    console.error('Invalid API response structure:', data);
                    throw new Error('Server returned invalid data structure');
                }
                
                elements.summaryText.textContent = data.summary;
                showScreen('summary');
            } catch (apiError) {
                console.error('Server API summary error:', apiError);
                
                // Fallback to mock summary
                const mockSummary = getMockResponse('summary');
                elements.summaryText.textContent = mockSummary;
                showScreen('summary');
                
                // Notify user but continue with mock data
                alert(`Server API error: ${apiError.message}\nUsing a mock summary instead.`);
            }
        }
    } catch (error) {
        console.error('Error getting summary:', error);
        alert('Failed to generate adventure summary. Please try again.');
    } finally {
        // Re-enable end game button
        elements.endGameButton.disabled = false;
        elements.endGameButton.textContent = 'End Adventure';
    }
}

/**
 * Reset the game to the start screen
 */
function resetGame() {
    // Reset game state
    gameState.playerName = '';
    gameState.currentNarrative = '';
    gameState.choices = [];
    gameState.gameId = null;
    gameState.isGameActive = false;
    
    // Reset inputs
    elements.playerNameInput.value = '';
    elements.chaosLevelInput.value = 5;
    updateChaosDisplay();
    
    // Show start screen
    showScreen('start');
}

/**
 * Show a specific screen
 * @param {string} screenName - The name of the screen to show
 */
function showScreen(screenName) {
    console.log(`Changing screen to: ${screenName}`);
    
    // First ensure game screen elements are properly initialized
    if (screenName === 'game') {
        const narrativeText = elements.narrativeText;
        const narrativeContainer = elements.narrativeText.parentElement;
        
        // Force full visibility of narrative elements before changing screens
        if (narrativeContainer) {
            narrativeContainer.style.display = 'block';
            narrativeContainer.style.visibility = 'visible';
            narrativeContainer.style.opacity = '1';
        }
        
        narrativeText.style.display = 'block';
        narrativeText.style.visibility = 'visible';
        narrativeText.style.opacity = '1';
        
        console.log(`Before screen change - narrative content: ${narrativeText.textContent.slice(0, 20)}...`);
        console.log(`Narrative element visibility: display=${window.getComputedStyle(narrativeText).display}, visibility=${window.getComputedStyle(narrativeText).visibility}, opacity=${window.getComputedStyle(narrativeText).opacity}`);
    }
    
    // Hide all screens
    elements.startScreen.classList.remove('active');
    elements.gameScreen.classList.remove('active');
    elements.summaryScreen.classList.remove('active');
    
    // Show the requested screen
    switch (screenName) {
        case 'start':
            elements.startScreen.classList.add('active');
            break;
        case 'game':
            // Add the active class and force a reflow to ensure CSS applies
            elements.gameScreen.classList.add('active');
            const forceReflow = elements.gameScreen.offsetHeight;
            
            // Wait for next frame to ensure CSS transitions complete
            window.setTimeout(() => {
                // Force narrative container to be visible again after transition
                const narrativeText = elements.narrativeText;
                const narrativeContainer = narrativeText.parentElement;
                
                if (narrativeContainer) {
                    narrativeContainer.style.display = 'block';
                    narrativeContainer.style.visibility = 'visible';
                    narrativeContainer.style.opacity = '1';
                }
                
                narrativeText.style.display = 'block';
                narrativeText.style.visibility = 'visible';
                narrativeText.style.opacity = '1';
                
                // Add direct inline CSS to ensure text is visible
                narrativeText.setAttribute('style', 'display: block !important; visibility: visible !important; opacity: 1 !important;');
                
                console.log(`After screen change - narrative element: ${narrativeText.outerHTML.slice(0, 100)}...`);
                console.log(`Computed style: ${JSON.stringify({
                    display: window.getComputedStyle(narrativeText).display,
                    visibility: window.getComputedStyle(narrativeText).visibility,
                    opacity: window.getComputedStyle(narrativeText).opacity
                })}`);
            }, 50);
            break;
        case 'summary':
            elements.summaryScreen.classList.add('active');
            break;
    }
}

/**
 * Get mock responses for testing without a backend
 * @param {string} type - The type of response to get
 * @returns {string} The mock response text
 */
function getMockResponse(type) {
    switch (type) {
        case 'intro':
            return `Welcome, ${gameState.playerName}, to the Whimsical Woods, a place where logic takes a backseat and chaos reigns supreme! As you step into the forest, the trees seem to whisper your name, occasionally mispronouncing it in increasingly ridiculous ways. The path ahead splits in three directions, and you notice a squirrel wearing tiny spectacles studying a miniature map nearby.`;
        
        case 'choice':
            return `As you decide to follow the glowing mushrooms, they suddenly uproot themselves and begin to dance in formation, leading you deeper into the forest. The mushrooms perform an impressive choreographed routine complete with jazz hands. You soon arrive at a clearing where a tea party is in progress. The guests—an assortment of woodland creatures wearing formal attire—all turn to look at you expectantly.`;
        
        case 'chaotic_event':
            return `Suddenly, the sky turns neon purple and it begins to rain tiny rubber ducks. One lands on your shoulder and whispers stock tips into your ear before dissolving into maple syrup.`;
        
        case 'summary':
            return `In what can only be described as the most peculiar Tuesday afternoon of ${gameState.playerName}'s life, they journeyed through the Whimsical Woods, befriended sentient mushrooms, received financial advice from rubber ducks, and somehow ended up with maple syrup in their hair. The local wildlife rated their adventure ${gameState.chaosLevel}/5 stars, "Would watch this human get confused again."`;
            
        case 'game_over':
            return `Oh no! ${gameState.playerName}'s adventure came to an unexpected end! After bravely venturing through the Whimsical Woods and encountering dancing mushrooms, our protagonist made the fateful decision to challenge the tea party guests to a riddle contest. Unfortunately, the creatures took this as a grave insult to their intelligence and promptly turned ${gameState.playerName} into a teapot. (Chaos level: ${gameState.chaosLevel}/10)\n\nTheir brief career as a tea-serving vessel was reportedly "quite steamy" before the spell wore off three days later. Better luck next time! Remember: in chaotic adventures, sometimes the absurd choices are the safest ones.`;
        
        case 'fallback':
            return `Something strange happened and the narrator momentarily lost their train of thought. They clear their throat and continue with the story...`;
            
        default:
            return `Something strange happened and the narrator momentarily lost their train of thought. They clear their throat and continue with the story...`;
    }
}

/**
 * Get mock choices for testing without a backend
 * @returns {Array} An array of mock choices
 */
function getMockChoices() {
    const choiceSets = [
        [
            "Follow the glowing mushrooms deeper into the woods",
            "Climb the nearest tree to get a better view",
            "Strike up a conversation with the bespectacled squirrel"
        ],
        [
            "Join the tea party and introduce yourself",
            "Slowly back away from the clearing",
            "Ask if they have any non-tea beverages available",
            "Compliment the nearest creature on their formal attire"
        ],
        [
            "Try to decipher the map on the table",
            "Ask about the strange weather patterns",
            "Propose a toast to new friendships"
        ]
    ];
    
    // Return a random set of choices
    return choiceSets[Math.floor(Math.random() * choiceSets.length)];
}

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    init();
    
    // Create a direct debug display that's always visible regardless of game state
    const createDebugDisplay = () => {
        // Create a completely new container with text and buttons for direct user testing
        const debugContainer = document.createElement('div');
        debugContainer.id = 'direct-debug-container';
        debugContainer.style.cssText = 
            'position: fixed; top: 20px; right: 20px; ' + 
            'background: white; color: black; ' +
            'z-index: 99999; padding: 15px; ' + 
            'border: 3px solid red; ' +
            'max-width: 400px; box-shadow: 0 0 20px rgba(0,0,0,0.5);';
        
        // Add header
        const header = document.createElement('h3');
        header.textContent = 'DEBUG CONSOLE v1.0.10-DEBUG';
        header.style.color = 'red';
        header.style.marginTop = '0';
        debugContainer.appendChild(header);
        
        // Add explanatory text
        const info = document.createElement('p');
        info.textContent = 'If you can see this but not the narrative text, use this debug panel:';
        debugContainer.appendChild(info);
        
        // Add a test button to insert debug text directly
        const insertButton = document.createElement('button');
        insertButton.textContent = 'INSERT TEST NARRATIVE';
        insertButton.style.cssText = 'padding: 8px; margin: 5px; background: #6a0dad; color: white; cursor: pointer;';
        insertButton.onclick = function() {
            const narrativeElement = document.getElementById('narrative-text');
            if (narrativeElement) {
                narrativeElement.innerHTML = '<strong style="color:red">TEST NARRATIVE INSERTED DIRECTLY VIA DEBUG PANEL:</strong><br><br>' +
                    'Welcome adventurer! This is a test narrative inserted directly by the debug panel. ' +
                    'If you can see this text, it means direct DOM manipulation works, but the LLM narrative ' +
                    'is not being displayed correctly.';
                
                // Force visibility on all parent elements
                let element = narrativeElement;
                while (element) {
                    element.style.display = 'block';
                    element.style.visibility = 'visible';
                    element.style.opacity = '1';
                    element = element.parentElement;
                }
                
                alert('Test narrative inserted! Check if you can see it in the game area.');
            } else {
                alert('Error: Could not find narrative-text element!');
            }
        };
        debugContainer.appendChild(insertButton);
        
        // Add a button to check narrative content
        const checkButton = document.createElement('button');
        checkButton.textContent = 'CHECK NARRATIVE CONTENT';
        checkButton.style.cssText = 'padding: 8px; margin: 5px; background: #333; color: white; cursor: pointer;';
        checkButton.onclick = function() {
            const narrativeElement = document.getElementById('narrative-text');
            if (narrativeElement) {
                alert('Current narrative content: ' + 
                    (narrativeElement.textContent || 'EMPTY') + 
                    '\nChildren: ' + narrativeElement.children.length +
                    '\nStyles: ' + 
                    '\nDisplay: ' + window.getComputedStyle(narrativeElement).display +
                    '\nVisibility: ' + window.getComputedStyle(narrativeElement).visibility +
                    '\nOpacity: ' + window.getComputedStyle(narrativeElement).opacity);
            } else {
                alert('Error: Could not find narrative-text element!');
            }
        };
        debugContainer.appendChild(checkButton);
        
        // Add close button
        const closeButton = document.createElement('button');
        closeButton.textContent = 'CLOSE DEBUG PANEL';
        closeButton.style.cssText = 'padding: 8px; margin: 5px; background: #f44336; color: white; cursor: pointer;';
        closeButton.onclick = function() {
            debugContainer.style.display = 'none';
        };
        debugContainer.appendChild(closeButton);
        
        // Add to document
        document.body.appendChild(debugContainer);
    };
    
    // Create the debug display
    createDebugDisplay();
    
    // Apply hardcoded styles to the narrative container and text elements
    const forceBasicStyles = () => {
        // Get elements again to ensure they're available
        const narrativeContainer = document.getElementById('narrative-container');
        const narrativeText = document.getElementById('narrative-text');
        
        // Apply important styles to the container
        if (narrativeContainer) {
            narrativeContainer.setAttribute('style', 
                'background-color: rgba(106, 13, 173, 0.05); ' +
                'padding: 1.5rem; ' +
                'border-radius: 8px; ' +
                'margin-bottom: 1.5rem; ' +
                'border-left: 4px solid #6a0dad; ' +
                'display: block !important; ' +
                'visibility: visible !important; ' +
                'opacity: 1 !important;'
            );
        }
        
        // Apply important styles to the text element
        if (narrativeText) {
            narrativeText.setAttribute('style',
                'font-size: 1.1rem; ' +
                'line-height: 1.6; ' +
                'display: block !important; ' +
                'visibility: visible !important; ' +
                'opacity: 1 !important;'
            );
            
            // Insert a permanent test marker to make sure the element works
            if (!narrativeText.querySelector('#permanent-debug-marker')) {
                const marker = document.createElement('div');
                marker.id = 'permanent-debug-marker';
                marker.innerHTML = '<strong style="color:red; display:block !important;">[DEBUG MARKER v1.0.10-DEBUG]</strong>';
                narrativeText.appendChild(marker);
            }
        }
        
        console.log('Applied direct styles to narrative elements');
    };
    
    // Apply styles immediately
    forceBasicStyles();
    
    // Also apply them after delays to ensure they're not overridden
    setTimeout(forceBasicStyles, 100);
    setTimeout(forceBasicStyles, 500);
    setTimeout(forceBasicStyles, 1000);
    setTimeout(forceBasicStyles, 2000);
});