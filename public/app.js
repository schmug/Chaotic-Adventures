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
    // Make sure all DOM elements are properly found
    if (!elements.startGameButton) {
        console.error("Start game button not found in DOM!");
        // Try to find it directly
        elements.startGameButton = document.getElementById('start-game');
    }
    
    // Set up event listeners with error handling
    if (elements.startGameButton) {
        console.log("Adding click event listener to Start Game button");
        
        // Remove any existing event listeners
        elements.startGameButton.removeEventListener('click', startGame);
        
        // Add the event listener
        elements.startGameButton.addEventListener('click', startGame);
        
        // Also add a direct onclick attribute as a fallback
        elements.startGameButton.onclick = startGame;
        
        // Log confirmation
        console.log("Start Game button event listener added successfully");
    }
    
    if (elements.randomNameButton) {
        elements.randomNameButton.addEventListener('click', () => {
            elements.playerNameInput.value = generateRandomName();
        });
    }
    
    if (elements.chaosLevelInput) {
        elements.chaosLevelInput.addEventListener('input', updateChaosDisplay);
    }
    
    if (elements.saveGameButton) {
        elements.saveGameButton.addEventListener('click', saveGame);
    }
    
    if (elements.loadGameButton) {
        elements.loadGameButton.addEventListener('click', loadGame);
    }
    
    if (elements.endGameButton) {
        elements.endGameButton.addEventListener('click', endGame);
    }
    
    if (elements.newGameButton) {
        elements.newGameButton.addEventListener('click', resetGame);
    }
    
    // LLM mode selection
    if (elements.llmModeMock) {
        elements.llmModeMock.addEventListener('change', updateLlmMode);
    }
    
    if (elements.llmModeBrowser) {
        elements.llmModeBrowser.addEventListener('change', updateLlmMode);
    }
    
    if (elements.llmModeServer) {
        elements.llmModeServer.addEventListener('change', updateLlmMode);
    }
    
    // Initial chaos level display
    updateChaosDisplay();
    
    // Log initialization completion
    console.log("Game initialization completed successfully");
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
 * Initialize the browser-based LLM - Enhanced with better error handling
 */
async function initBrowserLlm() {
    // First, extensive check and reporting for transformers.js availability
    console.log('Browser LLM initialization start - Environment check:',
        {
            'window.webllm exists': !!window.webllm,
            'window.Xenova exists': !!window.Xenova,
            'typeof window.Xenova': typeof window.Xenova,
            'window.Xenova properties': window.Xenova ? Object.keys(window.Xenova).join(', ') : 'none'
        }
    );
    
    if (!window.webllm) {
        console.warn('WebLLM library not available - Missing window.webllm global variable.');
        
        // Try to load transformers library directly as a last resort
        try {
            console.log("Attempting to directly check/access Transformers via window.Xenova");
            if (window.Xenova && window.Xenova.transformers) {
                console.log("Found Transformers.js via direct window.Xenova.transformers access");
                window.webllm = window.Xenova.transformers;
            } else if (window.Xenova) {
                console.log("Found window.Xenova but missing transformers property:", window.Xenova);
            } else {
                console.error("Both window.webllm and window.Xenova are unavailable");
                throw new Error("Transformers.js library completely unavailable");
            }
        } catch (directError) {
            console.error("Direct transformers.js access failed:", directError);
            alert('WebLLM library not available. Using mock mode instead.');
            elements.llmModeMock.checked = true;
            gameState.llmMode = 'mock';
            return;
        }
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
            console.log("Creating text-generation pipeline for browser LLM");
            
            try {
                // Verify pipeline function exists
                if (!window.webllm.pipeline) {
                    console.error("window.webllm exists but pipeline function is missing!");
                    console.log("Available methods on webllm:", Object.keys(window.webllm).join(", "));
                    throw new Error("Pipeline function not found in transformers.js");
                }
                
                // Create pipeline for text generation
                const { pipeline } = window.webllm;
                console.log("Pipeline function found, attempting to create pipeline");
                
                try {
                    // Log model config for debugging
                    console.log("Pipeline configuration:", {
                        task: 'text-generation',
                        modelId: WEBLLM_CONFIG.modelId,
                        progress_callback: 'function provided'
                    });
                    
                    // Create the pipeline with timeout
                    const pipelinePromise = pipeline('text-generation', WEBLLM_CONFIG.modelId, {
                        progress_callback: WEBLLM_CONFIG.progress_callback
                    });
                    
                    // Create a timeout of 30 seconds
                    const timeoutPromise = new Promise((_, reject) => {
                        setTimeout(() => reject(new Error("Pipeline initialization timed out after 30 seconds")), 30000);
                    });
                    
                    // Race between pipeline creation and timeout
                    gameState.browserLlm = await Promise.race([pipelinePromise, timeoutPromise]);
                    console.log("Browser LLM pipeline created successfully");
                } catch (pipelineError) {
                    console.error("Primary pipeline initialization failed:", pipelineError);
                    
                    // Detailed error logging
                    console.log("Pipeline error details:", {
                        name: pipelineError.name,
                        message: pipelineError.message,
                        stack: pipelineError.stack
                    });
                    
                    // Fallback to mock mode after pipeline failure
                    console.log("Falling back to mock mode due to pipeline initialization failure");
                    elements.llmModeMock.checked = true;
                    gameState.llmMode = 'mock';
                    alert("Unable to initialize the browser-based LLM. Falling back to mock mode for a better experience.");
                    throw new Error("Pipeline initialization failed");
                }
            } catch (initError) {
                console.error("LLM initialization error:", initError);
                throw initError; // Propagate to outer catch
            }
        }
        
        if (elements.llmLoading) {
            elements.llmLoading.classList.add('hidden');
        }
        if (elements.startGameButton) {
            elements.startGameButton.disabled = false;
        }
        
        console.log("Browser LLM initialization completed successfully");
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
    console.log("Browser LLM generation requested");
    
    // Check if browser LLM is initialized - if not, fall back to mock mode
    if (!gameState.browserLlm) {
        console.error('Browser LLM not initialized');
        
        // Automatically switch to mock mode for reliability
        console.log("Switching to mock mode due to uninitialized LLM");
        if (elements.llmModeMock) {
            elements.llmModeMock.checked = true;
        }
        gameState.llmMode = 'mock';
        
        // Return mock response instead
        const mockResponse = getMockResponse('fallback');
        console.log(`Using mock response: ${mockResponse.slice(0, 50)}...`);
        return mockResponse;
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
    
    // Set a timeout to ensure we don't wait forever
    let generationTimeout;
    const timeoutPromise = new Promise((_, reject) => {
        generationTimeout = setTimeout(() => {
            reject(new Error("Browser LLM generation timed out after 15 seconds"));
        }, 15000);
    });
    
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
        
        // Run the model with a timeout
        console.time('LLM Generation Time');
        const result = await Promise.race([
            gameState.browserLlm(prompt, parameters),
            timeoutPromise
        ]);
        console.timeEnd('LLM Generation Time');
        
        // Clear the timeout since generation completed
        clearTimeout(generationTimeout);
        
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
        
        // Clear timeout if it exists
        if (generationTimeout) {
            clearTimeout(generationTimeout);
        }
        
        // Switch to mock mode automatically for reliability
        console.log("Switching to mock mode after LLM generation error");
        if (elements.llmModeMock) {
            elements.llmModeMock.checked = true;
        }
        gameState.llmMode = 'mock';
        
        // Clean up loading indicator if it exists
        if (loadingIndicator && loadingIndicator.parentNode) {
            // Clear the animation interval
            if (loadingIndicator.dotsInterval) {
                clearInterval(loadingIndicator.dotsInterval);
            }
            
            // Remove the loading indicator
            loadingIndicator.parentNode.removeChild(loadingIndicator);
        }
        
        // Get mock response as fallback
        const mockResponse = getMockResponse('fallback');
        console.log(`Using mock response after error: ${mockResponse.slice(0, 50)}...`);
        return mockResponse;
    }
}

/**
 * Start a new game - Completely revamped for reliability
 */
async function startGame() {
    console.log("GAME START: Begin Adventure button clicked");
    
    // STEP 1: Get player name and validate
    const playerName = elements.playerNameInput.value.trim();
    if (!playerName) {
        alert('Please enter your name to begin the adventure!');
        return;
    }
    
    // STEP 2: Update game state
    gameState.playerName = playerName;
    gameState.chaosLevel = parseInt(elements.chaosLevelInput.value);
    gameState.isGameActive = true;
    
    // STEP 3: Provide immediate feedback - disable button and show loading state
    elements.startGameButton.disabled = true;
    elements.startGameButton.textContent = 'Preparing Adventure...';
    console.log(`Starting game for player: ${playerName}, chaos level: ${gameState.chaosLevel}`);
    
    try {
        // STEP 4: Different content generation based on mode
        if (gameState.llmMode === 'mock') {
            // MOCK MODE: Simplest path - reliable text generation
            console.log("Using mock mode for content generation");
            
            // Get mock narrative content
            const mockIntro = getMockResponse('intro');
            gameState.currentNarrative = mockIntro;
            
            // Get mock choices 
            const mockChoices = getMockChoices();
            gameState.choices = mockChoices;
            
            // IMPORTANT: First, ensure narrative content exists in game state
            console.log("Setting narrative content in the game state");
            
            // STEP 5: Prepare UI BEFORE switching screens
            // Pre-populate narrative text container with content
            elements.narrativeText.textContent = mockIntro;
            
            // Ensure narrative container is set to visible with basic styles
            if (elements.narrativeText.parentElement) {
                elements.narrativeText.parentElement.style.display = 'block';
                elements.narrativeText.parentElement.style.visibility = 'visible';
                elements.narrativeText.parentElement.style.opacity = '1';
            }
            
            // Make sure narrative text itself is visible
            elements.narrativeText.style.display = 'block';
            elements.narrativeText.style.visibility = 'visible';
            elements.narrativeText.style.opacity = '1';
            
            // Render the choices to prepare that container too
            renderChoices(mockChoices);
            
            // STEP 6: Now that content is ready, trigger screen transition
            console.log("Mock content ready, showing game screen");
            showScreen('game');
        } 
        else if (gameState.llmMode === 'browser') {
            // BROWSER LLM MODE: More complex path with async content generation
            console.log("Using browser LLM mode for content generation");
            
            // Check browser LLM initialization status first
            if (!gameState.browserLlm) {
                console.warn("Browser LLM not initialized yet - attempting initialization now");
                
                try {
                    // Show special loading state during initialization attempt
                    elements.startGameButton.disabled = true;
                    elements.startGameButton.textContent = 'Initializing Browser LLM...';
                    
                    // Last attempt to initialize LLM
                    await initBrowserLlm();
                    
                    // Verify initialization worked
                    if (!gameState.browserLlm) {
                        throw new Error("Browser LLM could not be initialized");
                    }
                    
                    console.log("Late browser LLM initialization succeeded");
                } catch (initError) {
                    console.error("Failed to initialize browser LLM:", initError);
                    
                    // Fall back to mock mode on initialization failure
                    alert("Browser LLM could not be initialized. Falling back to mock mode.");
                    gameState.llmMode = 'mock';
                    if (elements.llmModeMock) {
                        elements.llmModeMock.checked = true;
                    }
                    
                    // Load the game in mock mode instead
                    const mockIntro = getMockResponse('intro');
                    gameState.currentNarrative = mockIntro;
                    elements.narrativeText.textContent = mockIntro;
                    
                    // Get mock choices
                    const mockChoices = getMockChoices();
                    gameState.choices = mockChoices;
                    renderChoices(mockChoices);
                    
                    // Show game screen and exit this code path
                    showScreen('game');
                    return;
                } finally {
                    // Restore button state
                    elements.startGameButton.disabled = false;
                    elements.startGameButton.textContent = 'Begin Adventure';
                }
            }
            
            // First, create a loading message to display while LLM generates content
            elements.narrativeText.innerHTML = '<div style="text-align:center; padding:20px;">' +
                '<p style="font-style:italic; color:#6a0dad;">Generating your chaotic adventure...</p>' +
                '<div style="width:40px; height:40px; border:3px solid #f3f3f3; ' + 
                'border-top:3px solid #6a0dad; border-radius:50%; margin:20px auto; ' +
                'animation:spin 1s linear infinite;"></div></div>' +
                '<style>@keyframes spin {0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)}}</style>';
                
            // Step 5a: Show game screen with loading state BEFORE content is ready
            // This provides better UX than a frozen start screen
            console.log("Showing game screen with loading state");
            showScreen('game');
            
            // Explicitly make sure narrative container is visible during loading
            if (elements.narrativeText.parentElement) {
                elements.narrativeText.parentElement.style.display = 'block';
                elements.narrativeText.parentElement.style.visibility = 'visible';
                elements.narrativeText.parentElement.style.opacity = '1';
            }
            
            // Generate intro content with browser LLM
            const prompt = `You are creating a chaotic and humorous adventure game introduction. 
            The player's name is ${playerName}. Create an introduction (150-200 words) for a
            whimsical, slightly absurd scenario. Make it first-person narrative and end at a
            decision point. Chaos level is ${gameState.chaosLevel}/10.`;
            
            console.log("Generating intro text with browser LLM");
            const introText = await generateWithBrowserLlm(prompt);
            
            // Check if we got a proper response or if we were switched to mock mode
            if (gameState.llmMode !== 'browser') {
                console.log("LLM mode was switched to mock during generation - continuing with mock mode flow");
                // Note: At this point, generateWithBrowserLlm would have already returned a mock response
                // and updated the game state, so we can just continue
                gameState.currentNarrative = introText;
                
                // Get mock choices to match our mock narrative
                const mockChoices = getMockChoices();
                gameState.choices = mockChoices;
                
                // Update UI
                elements.narrativeText.textContent = introText;
                renderChoices(mockChoices);
                
                // Ensure visibility
                showScreen('game');
                return;
            }
            
            // Normal flow continues if we're still in browser LLM mode
            gameState.currentNarrative = introText;
            console.log("Browser LLM returned intro text of length:", introText ? introText.length : 0);
            
            // Generate choices with browser LLM
            const choicesPrompt = `Based on this introduction: "${introText}", 
            generate 3-4 possible choices for the player. Make them concise (max 15 words each)
            and include at least one unexpected or absurd option. Format as a numbered list.`;
            
            const choicesText = await generateWithBrowserLlm(choicesPrompt, 200);
            
            // Check again if we were switched to mock mode during choices generation
            if (gameState.llmMode !== 'browser') {
                console.log("LLM mode was switched to mock during choices generation");
                // We'll use the mock choices but keep our real narrative
                const mockChoices = getMockChoices();
                gameState.choices = mockChoices;
                
                // Update UI
                elements.narrativeText.textContent = introText;
                renderChoices(mockChoices);
                
                // Ensure visibility
                showScreen('game');
                return;
            }
            
            // Parse choices from the text
            const choices = parseChoicesFromText(choicesText);
            gameState.choices = choices;
            
            // STEP 5b: Now that we have content, update the UI directly
            console.log("Updating game screen with generated content");
            
            // Keep it simple - just set textContent 
            elements.narrativeText.textContent = introText;
            
            // Render choices
            renderChoices(choices);
            
            // Double check visibility - most important part!
            if (elements.narrativeText.parentElement) {
                elements.narrativeText.parentElement.style.display = 'block';
                elements.narrativeText.parentElement.style.visibility = 'visible';
                elements.narrativeText.parentElement.style.opacity = '1';
            }
            
            elements.narrativeText.style.display = 'block';
            elements.narrativeText.style.visibility = 'visible';
            elements.narrativeText.style.opacity = '1';
            
            // Force a refresh of the game screen to ensure content is visible
            showScreen('game');
        } 
        else if (gameState.llmMode === 'server') {
            try {
                // SERVER MODE: API-based content generation
                console.log("Using server API mode for content generation");
                
                // Create loading indicator in narrative area while waiting for API
                elements.narrativeText.innerHTML = '<div style="text-align:center; padding:20px;">' +
                    '<p style="font-style:italic; color:#6a0dad;">Contacting server...</p>' +
                    '<div style="width:40px; height:40px; border:3px solid #f3f3f3; ' + 
                    'border-top:3px solid #6a0dad; border-radius:50%; margin:20px auto; ' +
                    'animation:spin 1s linear infinite;"></div></div>' +
                    '<style>@keyframes spin {0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)}}</style>';
                
                // Show game screen with loading state
                showScreen('game');
                
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
                
                // Store data in game state
                gameState.gameId = data.gameId;
                gameState.currentNarrative = data.narrative;
                gameState.choices = data.choices;
                
                // Update UI with received content
                elements.narrativeText.textContent = data.narrative;
                renderChoices(data.choices);
                
                // Refresh the game screen to ensure content is visible
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
        
        // STEP 7: Final visibility check with setTimeout for reliability
        setTimeout(() => {
            console.log("Final visibility check for game screen");
            // Verify game screen is visible
            if (!elements.gameScreen.classList.contains('active') || 
                window.getComputedStyle(elements.gameScreen).display !== 'block') {
                console.log("Emergency game screen visibility fix");
                elements.gameScreen.style.display = 'block';
                elements.gameScreen.style.visibility = 'visible';
                elements.gameScreen.style.opacity = '1';
                elements.gameScreen.classList.add('active');
                
                // Verify start screen is hidden
                elements.startScreen.style.display = 'none';
                elements.startScreen.classList.remove('active');
            }
            
            // Verify narrative is visible and has content
            if (elements.narrativeText) {
                // If narrative text is empty but we have content in game state, restore it
                if ((!elements.narrativeText.textContent || elements.narrativeText.textContent.trim() === '') && 
                    gameState.currentNarrative && gameState.currentNarrative.trim() !== '') {
                    console.log("Emergency narrative content restoration");
                    elements.narrativeText.textContent = gameState.currentNarrative;
                }
                
                // Make absolutely sure it's visible
                elements.narrativeText.style.display = 'block';
                elements.narrativeText.style.visibility = 'visible';
                elements.narrativeText.style.opacity = '1';
                
                // Also make parent container visible
                if (elements.narrativeText.parentElement) {
                    elements.narrativeText.parentElement.style.display = 'block';
                    elements.narrativeText.parentElement.style.visibility = 'visible';
                    elements.narrativeText.parentElement.style.opacity = '1';
                }
            }
        }, 300);
    } catch (error) {
        console.error('Error starting game:', error);
        alert('Failed to start the game. Please try again.');
        
        // Fallback to mock mode for maximum reliability
        console.log("Falling back to mock mode after error");
        gameState.llmMode = 'mock';
        if (elements.llmModeMock) {
            elements.llmModeMock.checked = true;
        }
        
        // Load the game in mock mode as last resort
        const mockIntro = getMockResponse('intro');
        gameState.currentNarrative = mockIntro;
        elements.narrativeText.textContent = mockIntro;
        
        // Get mock choices
        const mockChoices = getMockChoices();
        gameState.choices = mockChoices;
        renderChoices(mockChoices);
        
        // Show game screen
        showScreen('game');
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
 * Render the current choices - Simplified for reliability
 * @param {Array} choices - The choices to render
 */
function renderChoices(choices) {
    console.log("Rendering choices:", choices);
    
    // Safety check for choices - use fallback if needed
    if (!choices || !Array.isArray(choices) || choices.length === 0) {
        console.warn("No valid choices provided to renderChoices, using fallback");
        choices = ["Continue the adventure", "Try something else", "Do something unexpected"];
    }
    
    // Safety check for choices list element
    if (!elements.choicesList) {
        console.error("Choices list element not found!");
        return;
    }
    
    // Clear existing choices with a reliable method
    while (elements.choicesList.firstChild) {
        elements.choicesList.removeChild(elements.choicesList.firstChild);
    }
    
    // Make sure choices container is visible
    elements.choicesList.style.display = 'block';
    elements.choicesList.style.visibility = 'visible';
    elements.choicesList.style.opacity = '1';
    
    // Create and add the new choice elements
    choices.forEach((choice, index) => {
        // Create a new list item
        const li = document.createElement('li');
        
        // Safety check for choice text
        const choiceText = choice || `Option ${index + 1}`;
        
        // Set text content directly
        li.textContent = choiceText;
        
        // Apply basic styling directly
        li.style.margin = '1rem 0';
        li.style.padding = '1rem';
        li.style.backgroundColor = 'rgba(142, 68, 173, 0.1)';
        li.style.borderRadius = '8px';
        li.style.cursor = 'pointer';
        li.style.transition = 'all 0.3s ease';
        
        // Add hover effects via a class
        li.classList.add('choice-item');
        
        // Use standard click handler
        li.addEventListener('click', () => makeChoice(index));
        
        // Add to the choices list
        elements.choicesList.appendChild(li);
    });
    
    // Ensure choice container is visible with direct styles
    const choicesContainer = elements.choicesList.parentElement;
    if (choicesContainer) {
        choicesContainer.style.display = 'block';
        choicesContainer.style.visibility = 'visible';
        choicesContainer.style.opacity = '1';
    }
    
    // Create a simple hover effect style if it doesn't exist
    if (!document.getElementById('choice-hover-style')) {
        const style = document.createElement('style');
        style.id = 'choice-hover-style';
        style.textContent = `
            .choice-item:hover {
                background-color: rgba(142, 68, 173, 0.2) !important;
                transform: translateX(10px) !important;
            }
        `;
        document.head.appendChild(style);
    }
    
    // BONUS RELIABILITY: Ensure narrative text is still properly displayed
    // This provides a safety check in case rendering choices affects narrative visibility
    if (elements.narrativeText) {
        // Make sure narrative text is visible
        elements.narrativeText.style.display = 'block';
        elements.narrativeText.style.visibility = 'visible';
        elements.narrativeText.style.opacity = '1';
        
        // Verify content is still there
        if ((!elements.narrativeText.textContent || elements.narrativeText.textContent.trim() === '') && 
            gameState.currentNarrative && gameState.currentNarrative.trim() !== '') {
            console.log("Narrative text was empty during choice rendering - restoring content");
            elements.narrativeText.textContent = gameState.currentNarrative;
        }
        
        // Make the narrative container visible too
        if (elements.narrativeText.parentElement) {
            elements.narrativeText.parentElement.style.display = 'block';
            elements.narrativeText.parentElement.style.visibility = 'visible';
            elements.narrativeText.parentElement.style.opacity = '1';
        }
    }
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
 * Show a specific screen - Completely redesigned for reliability
 * @param {string} screenName - The name of the screen to show ('start', 'game', or 'summary')
 */
function showScreen(screenName) {
    console.log(`SCREEN TRANSITION: Changing to ${screenName} screen`);
    
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
        
        // Check if we need to restore the narrative text from gameState
        if (narrativeText && (!narrativeText.textContent || narrativeText.textContent.trim() === '') && 
            gameState.currentNarrative && gameState.currentNarrative.trim() !== '') {
            console.log("Restoring narrative content from gameState");
            narrativeText.innerHTML = gameState.currentNarrative;
        }
        
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
        
        // Apply these basic styles to choices container too
        if (elements.choicesList) {
            elements.choicesList.style.display = 'block';
            elements.choicesList.style.visibility = 'visible';
            elements.choicesList.style.opacity = '1';
        }
        
        console.log("Game screen elements prepared with direct styles");
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
            console.error(`Unknown screen name: ${screenName}`);
            return; // Exit if invalid screen
    }
    
    // Apply direct styles to ensure immediate visibility
    if (targetScreen) {
        // Direct style manipulation first
        targetScreen.style.display = 'block';
        targetScreen.style.visibility = 'visible';
        targetScreen.style.opacity = '1';
        
        // Force a reflow before adding class
        const forceReflow = targetScreen.offsetHeight;
        
        // Then add the class for any additional styling
        targetScreen.classList.add('active');
        
        console.log(`Screen ${screenName} is now visible`);
    }
    
    // STEP 5: Verification - double check visibility with setTimeout 
    setTimeout(() => {
        // Verify that the screen is still visible
        if (targetScreen && (targetScreen.style.display !== 'block' || 
            !targetScreen.classList.contains('active'))) {
            console.log("Emergency visibility fix applied");
            targetScreen.style.display = 'block';
            targetScreen.style.visibility = 'visible';
            targetScreen.style.opacity = '1';
            targetScreen.classList.add('active');
        }
        
        // For game screen, also verify narrative visibility again
        if (screenName === 'game') {
            const narrativeText = elements.narrativeText;
            const narrativeContainer = narrativeText ? narrativeText.parentElement : null;
            
            // If narrative still not visible, try more aggressive approach
            if (narrativeContainer && window.getComputedStyle(narrativeContainer).display !== 'block') {
                narrativeContainer.style.cssText = 'display:block !important; visibility:visible !important; opacity:1 !important;';
            }
            
            if (narrativeText && window.getComputedStyle(narrativeText).display !== 'block') {
                narrativeText.style.cssText = 'display:block !important; visibility:visible !important; opacity:1 !important;';
            }
            
            // Verify content is still there
            if (narrativeText && (!narrativeText.textContent || narrativeText.textContent.trim() === '') && 
                gameState.currentNarrative && gameState.currentNarrative.trim() !== '') {
                narrativeText.innerHTML = gameState.currentNarrative;
            }
        }
    }, 100);
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

// Complete game initialization rewritten for maximum reliability
// This method uses multiple approaches to guarantee initialization
(function() {
    // IMMEDIATE SELF-EXECUTING CODE: Runs as soon as the script loads
    console.log("INITIALIZATION: Script-level initialization running");
    
    // Create global initialization function
    window.initializeChaosGame = function() {
        console.log("INITIALIZATION: Direct initializeChaosGame function called");
        
        // PHASE 1: Ensure elements object has all required references
        // This function makes sure that all UI element references are valid
        function ensureElementReferences() {
            console.log("Ensuring all element references are valid");
            
            // First save any existing valid references
            const workingElements = {};
            if (window.elements) {
                Object.keys(window.elements).forEach(key => {
                    if (window.elements[key] && window.elements[key] instanceof Element) {
                        workingElements[key] = window.elements[key];
                    }
                });
            }
            
            // Create fresh elements object with direct getElementById calls
            window.elements = {
                // Screens
                startScreen: document.getElementById('start-screen') || workingElements.startScreen,
                gameScreen: document.getElementById('game-screen') || workingElements.gameScreen,
                summaryScreen: document.getElementById('summary-screen') || workingElements.summaryScreen,
                
                // Start screen elements
                playerNameInput: document.getElementById('player-name') || workingElements.playerNameInput,
                randomNameButton: document.getElementById('random-name') || workingElements.randomNameButton,
                chaosLevelInput: document.getElementById('chaos-level') || workingElements.chaosLevelInput,
                chaosValueDisplay: document.getElementById('chaos-value') || workingElements.chaosValueDisplay,
                startGameButton: document.getElementById('start-game') || workingElements.startGameButton,
                llmModeMock: document.getElementById('llm-mode-mock') || workingElements.llmModeMock,
                llmModeBrowser: document.getElementById('llm-mode-browser') || workingElements.llmModeBrowser,
                llmModeServer: document.getElementById('llm-mode-server') || workingElements.llmModeServer,
                llmLoading: document.getElementById('llm-loading') || workingElements.llmLoading,
                loadProgress: document.getElementById('load-progress') || workingElements.loadProgress,
                progressFill: document.querySelector('.progress-fill') || workingElements.progressFill,
                
                // Game screen elements
                narrativeText: document.getElementById('narrative-text') || workingElements.narrativeText,
                choicesList: document.getElementById('choices-list') || workingElements.choicesList,
                saveGameButton: document.getElementById('save-game') || workingElements.saveGameButton,
                loadGameButton: document.getElementById('load-game') || workingElements.loadGameButton,
                endGameButton: document.getElementById('end-game') || workingElements.endGameButton,
                
                // Summary screen elements
                summaryText: document.getElementById('summary-text') || workingElements.summaryText,
                newGameButton: document.getElementById('new-game') || workingElements.newGameButton
            };
            
            // Log a summary of which elements were found
            console.log("Element references refreshed:", 
                Object.keys(window.elements).map(key => 
                    `${key}: ${window.elements[key] ? '✓' : '✗'}`
                ).join(', ')
            );
            
            return window.elements;
        }
        
        // PHASE 2: Set up all event handlers
        // This function sets up all event handlers for the game
        function setupEventHandlers() {
            console.log("Setting up all event handlers");
            
            // Start screen event handlers
            if (elements.startGameButton) {
                // Clean start: Remove any existing handlers first
                const button = elements.startGameButton;
                const newButton = button.cloneNode(true);
                if (button.parentNode) {
                    button.parentNode.replaceChild(newButton, button);
                }
                elements.startGameButton = newButton;
                
                // Add multiple redundant event handlers
                elements.startGameButton.addEventListener('click', startGame);
                elements.startGameButton.onclick = startGame;
                elements.startGameButton.setAttribute('onclick', 'startGame()');
                console.log("Start Game button event handlers set up");
            }
            
            // Setup random name button
            if (elements.randomNameButton) {
                elements.randomNameButton.addEventListener('click', () => {
                    if (elements.playerNameInput) {
                        elements.playerNameInput.value = generateRandomName();
                    }
                });
            }
            
            // Setup chaos level input
            if (elements.chaosLevelInput) {
                elements.chaosLevelInput.addEventListener('input', updateChaosDisplay);
                updateChaosDisplay(); // Set initial display
            }
            
            // Game screen event handlers
            if (elements.saveGameButton) {
                elements.saveGameButton.addEventListener('click', saveGame);
            }
            
            if (elements.loadGameButton) {
                elements.loadGameButton.addEventListener('click', loadGame);
            }
            
            if (elements.endGameButton) {
                elements.endGameButton.addEventListener('click', endGame);
            }
            
            // Summary screen event handlers
            if (elements.newGameButton) {
                elements.newGameButton.addEventListener('click', resetGame);
            }
            
            // LLM mode selection handlers
            [
                { element: elements.llmModeMock, mode: 'mock' },
                { element: elements.llmModeBrowser, mode: 'browser' },
                { element: elements.llmModeServer, mode: 'server' }
            ].forEach(item => {
                if (item.element) {
                    item.element.addEventListener('change', () => {
                        if (item.element.checked) {
                            gameState.llmMode = item.mode;
                            if (item.mode === 'browser') {
                                initBrowserLlm();
                            } else if (elements.llmLoading) {
                                elements.llmLoading.classList.add('hidden');
                            }
                        }
                    });
                }
            });
            
            console.log("All event handlers set up successfully");
        }
        
        // PHASE 3: Create debug panel for emergency diagnostics & fixes
        function createDebugPanel() {
            // Remove any existing debug panel
            const existingPanel = document.getElementById('direct-debug-container');
            if (existingPanel) {
                existingPanel.parentNode.removeChild(existingPanel);
            }
            
            // Create debug container
            const debugContainer = document.createElement('div');
            debugContainer.id = 'direct-debug-container';
            debugContainer.style.cssText = 
                'position: fixed; top: 20px; right: 20px; ' + 
                'background: white; color: black; ' +
                'z-index: 99999; padding: 15px; ' + 
                'border: 3px solid red; ' +
                'max-width: 400px; box-shadow: 0 0 20px rgba(0,0,0,0.5);';
            
            // Version header
            const header = document.createElement('h3');
            header.textContent = 'DEBUG CONSOLE v1.3.2-RESCUE';
            header.style.color = 'red';
            header.style.marginTop = '0';
            debugContainer.appendChild(header);
            
            // Create button function
            const addButton = (text, style, onClick) => {
                const button = document.createElement('button');
                button.textContent = text;
                button.style.cssText = `padding: 8px; margin: 5px; ${style}; cursor: pointer;`;
                button.onclick = onClick;
                debugContainer.appendChild(button);
                return button;
            };
            
            // Emergency Mode button
            addButton('☢️ EMERGENCY GAME MODE', 'background: red; color: white; font-weight: bold;', function() {
                // This is a last-resort function that bypasses all regular code
                // and directly manipulates the DOM to make the game work
                
                // 1. Hide all screens and show game screen
                document.querySelectorAll('.game-screen').forEach(screen => {
                    screen.style.display = 'none';
                    screen.classList.remove('active');
                });
                
                const gameScreen = document.getElementById('game-screen');
                if (gameScreen) {
                    gameScreen.style.display = 'block';
                    gameScreen.style.visibility = 'visible';
                    gameScreen.style.opacity = '1';
                    gameScreen.classList.add('active');
                }
                
                // 2. Create emergency narrative and choices
                const narrativeText = document.getElementById('narrative-text');
                const narrativeContainer = document.getElementById('narrative-container');
                const playerName = document.getElementById('player-name')?.value || 'Adventurer';
                
                if (narrativeContainer) {
                    narrativeContainer.style.cssText = 'display:block !important; visibility:visible !important; background-color:rgba(106,13,173,0.05); padding:1.5rem; border-radius:8px; margin-bottom:1.5rem; border-left:4px solid #6a0dad;';
                }
                
                if (narrativeText) {
                    narrativeText.innerHTML = `
                        <strong style="color:red">[EMERGENCY MODE ACTIVATED]</strong><br><br>
                        Welcome, ${playerName}, to the Whimsical Woods, a place where logic takes a backseat and chaos reigns supreme! 
                        As you step into the forest, the trees seem to whisper your name, occasionally mispronouncing it in increasingly 
                        ridiculous ways. The path ahead splits in three directions, and you notice a squirrel wearing tiny spectacles 
                        studying a miniature map nearby.
                    `;
                    narrativeText.style.cssText = 'display:block !important; visibility:visible !important; font-size:1.1rem; line-height:1.6;';
                }
                
                // 3. Set up emergency choices
                const choicesList = document.getElementById('choices-list');
                if (choicesList) {
                    choicesList.innerHTML = '';
                    
                    const choices = [
                        "Follow the glowing mushrooms deeper into the woods",
                        "Climb the nearest tree to get a better view",
                        "Strike up a conversation with the bespectacled squirrel"
                    ];
                    
                    choices.forEach((choice, index) => {
                        const li = document.createElement('li');
                        li.textContent = choice;
                        li.style.cssText = 'margin:1rem 0; padding:1rem; background-color:rgba(142,68,173,0.1); border-radius:8px; cursor:pointer;';
                        li.onclick = function() {
                            alert(`You chose: ${choice}\n\nThis is emergency mode, so the game cannot progress further. The UI is working though!`);
                        };
                        choicesList.appendChild(li);
                    });
                }
                
                alert('Emergency Game Mode activated! The game screen should now be visible with basic content.');
            });
            
            // Test narrative button
            addButton('TEST NARRATIVE', 'background: #6a0dad; color: white;', function() {
                const narrativeEl = document.getElementById('narrative-text');
                if (narrativeEl) {
                    narrativeEl.innerHTML = '<strong style="color:red">TEST NARRATIVE:</strong><br><br>' +
                        'This is a test narrative inserted by the debug panel. ' +
                        'If you can see this text, direct DOM manipulation works.';
                    
                    // Force visibility
                    narrativeEl.style.display = 'block';
                    narrativeEl.style.visibility = 'visible';
                    narrativeEl.style.opacity = '1';
                    
                    if (narrativeEl.parentElement) {
                        narrativeEl.parentElement.style.display = 'block';
                        narrativeEl.parentElement.style.visibility = 'visible';
                        narrativeEl.parentElement.style.opacity = '1';
                    }
                    
                    alert('Test narrative inserted - check game screen.');
                } else {
                    alert('Error: Could not find narrative-text element!');
                }
            });
            
            // Check DOM button
            addButton('INSPECT DOM STATE', 'background: #333; color: white;', function() {
                const narrativeEl = document.getElementById('narrative-text');
                const gameScreen = document.getElementById('game-screen');
                
                // Build status report
                let status = 'DOM STATUS REPORT:\n\n';
                
                if (narrativeEl) {
                    status += `Narrative Element: FOUND\n` +
                        `Content: ${narrativeEl.textContent ? 'YES (' + narrativeEl.textContent.length + ' chars)' : 'EMPTY'}\n` +
                        `Display: ${window.getComputedStyle(narrativeEl).display}\n` +
                        `Visibility: ${window.getComputedStyle(narrativeEl).visibility}\n` +
                        `Opacity: ${window.getComputedStyle(narrativeEl).opacity}\n\n`;
                } else {
                    status += 'Narrative Element: NOT FOUND\n\n';
                }
                
                if (gameScreen) {
                    status += `Game Screen: FOUND\n` +
                        `Active Class: ${gameScreen.classList.contains('active') ? 'YES' : 'NO'}\n` +
                        `Display: ${window.getComputedStyle(gameScreen).display}\n` +
                        `Visibility: ${window.getComputedStyle(gameScreen).visibility}\n` +
                        `Opacity: ${window.getComputedStyle(gameScreen).opacity}\n\n`;
                } else {
                    status += 'Game Screen: NOT FOUND\n\n';
                }
                
                status += `Elements object has: ${window.elements ? Object.keys(window.elements).length : 0} references\n`;
                status += `gameState object has: ${window.gameState ? Object.keys(window.gameState).length : 0} properties\n`;
                status += `Event handlers active: ${typeof window.startGame === 'function' ? 'YES' : 'NO'}\n`;
                
                alert(status);
            });
            
            // Add info about current script version
            const versionInfo = document.createElement('div');
            versionInfo.style.marginTop = '10px';
            versionInfo.style.fontSize = '12px';
            versionInfo.style.color = '#666';
            versionInfo.innerHTML = `<strong>Version:</strong> v1.3.1<br>` +
                `<strong>Init Time:</strong> ${new Date().toLocaleTimeString()}<br>` +
                `<strong>Mode:</strong> Comprehensive Overhaul`;
            debugContainer.appendChild(versionInfo);
            
            // Add close button
            addButton('CLOSE', 'background: #f44336; color: white;', function() {
                debugContainer.style.display = 'none';
            });
            
            // Add to document
            document.body.appendChild(debugContainer);
            
            console.log("Debug panel created");
        }
        
        // PHASE 4: Apply direct styles to ensure narrative visibility
        function applyDirectStyles() {
            console.log("Applying direct styles to critical elements");
            
            const narrativeContainer = document.getElementById('narrative-container');
            const narrativeText = document.getElementById('narrative-text');
            
            if (narrativeContainer) {
                narrativeContainer.style.backgroundColor = 'rgba(106, 13, 173, 0.05)';
                narrativeContainer.style.padding = '1.5rem';
                narrativeContainer.style.borderRadius = '8px';
                narrativeContainer.style.marginBottom = '1.5rem';
                narrativeContainer.style.borderLeft = '4px solid #6a0dad';
                narrativeContainer.style.display = 'block';
                narrativeContainer.style.visibility = 'visible';
                narrativeContainer.style.opacity = '1';
            }
            
            if (narrativeText) {
                narrativeText.style.fontSize = '1.1rem';
                narrativeText.style.lineHeight = '1.6';
                narrativeText.style.display = 'block';
                narrativeText.style.visibility = 'visible';
                narrativeText.style.opacity = '1';
                
                // Add version marker
                if (!narrativeText.querySelector('#version-marker')) {
                    const marker = document.createElement('span');
                    marker.id = 'version-marker';
                    marker.style.display = 'none';
                    marker.textContent = 'v1.3.1-enhanced';
                    narrativeText.appendChild(marker);
                }
            }
            
            // Make sure the initial screen is visible
            if (elements.startScreen) {
                elements.startScreen.style.display = 'block';
                elements.startScreen.style.visibility = 'visible';
                elements.startScreen.style.opacity = '1';
                elements.startScreen.classList.add('active');
            }
            
            // Make sure other screens are hidden
            [elements.gameScreen, elements.summaryScreen].forEach(screen => {
                if (screen) {
                    screen.style.display = 'none';
                    screen.classList.remove('active');
                }
            });
            
            console.log("Direct styles applied to critical elements");
        }
        
        // Execute all initialization phases
        ensureElementReferences();
        setupEventHandlers();
        createDebugPanel();
        applyDirectStyles();
        
        // Execute standard init if it exists
        if (typeof init === 'function') {
            try {
                init();
                console.log("Standard init() function executed successfully");
            } catch (err) {
                console.error("Error in standard init() function:", err);
            }
        }
        
        console.log("Game initialization completed successfully");
        return true; // Indicate successful initialization
    };
    
    // Multiple initialization triggers for maximum reliability
    
    // 1. DOM Content Loaded event
    document.addEventListener('DOMContentLoaded', function() {
        console.log("DOMContentLoaded event fired");
        window.initializeChaosGame();
    });
    
    // 2. Window load event (backup)
    window.addEventListener('load', function() {
        console.log("Window load event fired");
        // Only re-initialize if main init hasn't run or failed
        if (!window.chaosGameInitialized) {
            window.initializeChaosGame();
        }
    });
    
    // 3. Immediate initialization attempt if DOM is already ready
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        console.log("Document already ready, initializing immediately");
        setTimeout(window.initializeChaosGame, 0);
    }
    
    // 4. Delayed initialization as last resort
    setTimeout(function() {
        console.log("Delayed initialization check running");
        // Only re-initialize if specific elements are missing
        if (!document.getElementById('direct-debug-container') || 
            (window.elements && window.elements.startGameButton && 
             (!window.elements.startGameButton.onclick || !window.elements.startGameButton.onclick.toString().includes('startGame')))) {
            console.log("Delayed initialization triggered - critical elements not set up properly");
            window.initializeChaosGame();
        } else {
            console.log("Delayed initialization check - no action needed");
        }
    }, 1000);
    
    // Set a flag to indicate that initialization process has started
    window.chaosGameInitStarted = true;
    
    // Track initialization status for debugging
    console.log("Initialization system loaded successfully");
})();