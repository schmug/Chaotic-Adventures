# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🎲 Project Overview
**Project Name:** Chaotic Adventures

**Description:**  
An open-source, choose-your-own-adventure style text-based game leveraging a local LLM for generating chaotic, humorous narratives dynamically.

## 🚀 Development Commands
- **Setup:** `pip install -r requirements.txt`
- **Run CLI version:** `python -m src.backend.game_engine`
- **Run web server:** `python -m src.app`
- **Run tests without dependencies:** `python mock_llm_test.py`
- **Run integration tests:** `python -m src.test_integration -v`
- **Lint:** `flake8 src/ tests/`
- **Type check:** `mypy src/ tests/`
- **Test all:** `pytest tests/`
- **Test single file:** `pytest tests/test_file.py`
- **Test specific function:** `pytest tests/test_file.py::test_function`

## 📊 Git Workflow
- **Commit:** For each completed change or bugfix
- **Commit message format:** Short, descriptive title followed by bullet points for details
- **Branch model:** Feature branches from main, merge via PRs
- **Pre-commit:** Run linting and tests before committing
- **Testing:** Use browser tool to verify UI changes work before committing
- **Push:** Automatically after each commit
- **Deployment:** Changes pushed to main are automatically deployed to Cloudflare Pages

## 🛠️ Technology Stack
- **Language:** Python (primary backend logic), JavaScript/HTML/CSS for frontend
- **Framework:** Flask API server, Cloudflare Workers
- **Local LLM:** Multiple options supported:
  - Ollama API integration
  - Browser-based LLM simulator for offline play
  - Mock responses for fast development
- **Version Management:** Semantic versioning (major.minor.patch)
- **Deployment:** GitLab CI/CD, Cloudflare Pages 
  - using the Cloudflare Web GUI, this repo is connected and deploys automatically from the /public folder using wrangler.
  - Claude should use the browser tool to check that the updates work as expected at https://chaotic-adventures.cory7593.workers.dev
  - **IMPORTANT:** Cloudflare Workers do not support ES6 template literals (`${variable}`). When working with _worker.js, always use string concatenation ("text " + variable + " more text") instead. See DEPLOYMENT.md for more details.

## ✅ Coding Guidelines
- **Python style:** Follow PEP 8, use type hints
- **JS style:** ES6+, 2-space indentation
- **Imports:** Group standard lib, third-party, local; alphabetical within groups
- **Naming:** snake_case for Python, camelCase for JavaScript
- **Error handling:** Use specific exceptions, log errors properly
- **Documentation:** Docstrings for all functions (Google style)
- **Testing:** Write unit tests for all new functionality

## 📌 AI Code Assistant Guidelines (Claude)
- **Style:** Clear, concise, and highly readable Python and JavaScript code.
- **Tone:** Light-hearted and humorous in code comments and scenario generation prompts.
- **Complexity:** Prioritize simplicity and ease of maintainability over cleverness.

### 🚩 Important:
- **Avoid** overly complex structures unless clearly justified.
- **Provide** clear rationale in comments when making unconventional coding decisions.
- **Ensure** generated code integrates easily with GitLab's automated CI/CD pipeline.

## 📝 Version History
- **v1.3.3**:
  - **SECURITY UPDATE**: Add comprehensive input validation with length limits
  - **SECURITY UPDATE**: Implement rate limiting on all API endpoints
  - **SECURITY UPDATE**: Update critical dependencies (cryptography, urllib3, certifi)
  - Add LLM input sanitization to prevent injection attacks
  - Add structured error handling for validation failures

- **v1.3.2**:
  - Fix browser LLM mode screen transition issues
  - Add enhanced error handling for LLM initialization
  - Implement graceful fallback to mock mode
  - Add timeout handling for LLM operations

- **v1.3.1**:
  - Fix JavaScript syntax errors in _worker.js
  - Replace template literals with string concatenation
  - Remove special characters causing syntax errors
  - Fix string formatting in game prompts and event handlers

- **v1.3.0**:
  - Implement LLM buffs/debuffs system for narrative variation
  - Fix UI issues in the begin adventure button
  - Improve error handling for browser LLM
  - Enhance loading feedback for better UX

- **v1.2.2**: 
  - Fix browser LLM integration issues
  - Add game over functionality
  - Improve template handling

- **v1.0.6**: 
  - Add comprehensive LLM testing
  - Implement version tracking system
  - Fix browser LLM integration issues
  - Update documentation to match implementation

## 📋 Current File Structure
```
chaotic-adventures/
├── src/
│   ├── app.py                 # Main Flask application
│   ├── version.py             # Version tracking module
│   ├── backend/
│   │   ├── game_engine.py     # Core game logic
│   │   ├── llm_interface.py   # LLM integration
│   │   └── prompts/
│   │       └── templates.py   # Narrative templates
│   └── frontend/
│       ├── index.html         # Web interface
│       ├── app.js             # Frontend logic
│       └── style.css          # Styling
├── public/                    # Cloudflare Pages deployment
│   ├── _worker.js             # Edge worker for Cloudflare
│   ├── _routes.json           # URL routing
│   ├── app.js                 # Bundled frontend logic
│   ├── index.html             # Bundled HTML
│   └── style.css              # Bundled CSS
├── tests/
│   ├── test_game_engine.py    # Game logic tests
│   ├── test_llm_interface.py  # LLM interface tests
│   └── test_browser_llm.py    # Browser LLM simulator tests
├── mock_llm_test.py           # Dependency-free tests
├── DEVELOPMENT_PLAN.md        # Future development roadmap
├── IMPLEMENTATION_PLAN.md     # Implementation checklist
├── PHASE1_TESTING_RESULTS.md  # Testing results
├── PROJECT_REQUIREMENTS.md    # Project specifications
├── CLAUDE.md                  # Project documentation
├── README.md                  # Project overview
└── requirements.txt           # Python dependencies
```