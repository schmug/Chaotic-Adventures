# Chaotic Adventures (v1.3.2)

An open-source, choose-your-own-adventure style text-based game leveraging LLMs for generating chaotic, humorous narratives dynamically.

## Features

- Dynamic narrative generation using LLMs (browser-based or server)
- Unpredictable and chaotic storylines with adjustable chaos level
- Humorous game summary upon completion
- Simple, engaging web interface
- Save/load functionality to continue your adventure

### Gameplay Enhancements
- **Narrative Effects System** - Special buffs/debuffs that transform writing style
- **Memory Continuity** - Elements from past adventures appear in new ones
- **Model Upgrade System** - Progress from basic to master storytelling quality
- **Chaotic Events** - Random interruptions that add unpredictability

### Technical Features
- **Offline Play Mode** - Run the LLM directly in your browser
- **Tiered Model Quality** - Four levels of increasingly sophisticated narratives
- **Cross-Adventure Memory** - Persistent storage of memorable elements
- **Comprehensive Testing** - Full test suite for all components
- **Semantic Versioning** - Consistent version tracking across all components

## Quick Start

Visit our [live demo](https://chaotic-adventures.cory7593.workers.dev/) to try it out!

## Local Setup

### Prerequisites

- Python 3.8+
- [Ollama](https://ollama.ai/) for local LLM inference (optional)

### Installation

1. Clone the repository:
   ```
   git clone https://gitlab.com/crash_gaming/CYOLLM.git
   cd CYOLLM
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Run the application:
   ```
   export FLASK_ENV=development
   python -m src.app
   ```

4. Open your browser and navigate to `http://localhost:5000`

### LLM Modes

The application offers three modes for narrative generation:

#### 1. Mock Mode (Default)
- Uses pre-defined responses for instant gameplay
- No LLM required
- Great for testing or quick gameplay
- Supports the new model tier system with four quality levels:
  - Basic: Simple, direct storytelling
  - Enhanced: More detailed narratives with improved creativity
  - Advanced: Complex storytelling with vivid imagery
  - Master: Exceptional quality with philosophical depth

#### 2. Browser-Based LLM Mode
- Runs a smaller LLM directly in your browser
- Works completely offline
- First load downloads model files (~150-600MB depending on model)
- Files are cached for future use
- Requires a modern browser with WebGL support
- Includes narrative memory system for continuity between adventures

#### 3. Server LLM Mode
- Uses Ollama for high-quality responses
- Install and start Ollama
- Pull the LLama3 model: `ollama pull llama3`
- Set the environment variable: `export MOCK_LLM=false`
- Restart the application
- Full support for narrative effects and model upgrades

## Development

### Technology Stack
- **Backend**: Python with Flask for the API server
- **Frontend**: Vanilla JavaScript, HTML, and CSS
- **LLM Integration**: Ollama API, Browser-based simulator
- **Data Storage**: JSON-based file storage for game state and memories

### Development Commands
- **Testing**: 
  - Run unit tests: `pytest tests/`
  - Run integration tests: `python -m src.test_integration -v`
  - Run dependency-free tests: `python mock_llm_test.py`
- **Linting**: Run linter with `flake8 src/ tests/`
- **Type checking**: Run mypy with `mypy src/ tests/`
- **Version management**: Update version in `src/version.py`

### Core Components
- **Game Engine**: Manages game state, narrative flow, and player choices
- **LLM Interface**: Provides consistent communication with LLM backends
- **Memory System**: Stores and retrieves elements from past adventures
- **Narrative Effects**: Applies temporary modifiers to writing style
- **Model Tier System**: Manages progression through quality levels

See [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for the initial roadmap, [PROJECT_REQUIREMENTS.md](./PROJECT_REQUIREMENTS.md) for project goals, and [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md) for the current development plan.

## Deployment

This project is configured for automatic deployment to Cloudflare Workers via GitLab CI/CD. Simply push your changes to the main branch, and the pipeline will handle testing, building, and deployment.

For detailed deployment instructions and troubleshooting, see the [DEPLOYMENT.md](./DEPLOYMENT.md) guide, which includes:
- Cloudflare Workers compatibility issues
- How to update the worker script
- Deployment process and prerequisites
- Troubleshooting common issues
- Using the emergency debug tools

### Technical Details

#### Browser LLM Implementation
- Uses [Transformers.js](https://huggingface.co/docs/transformers.js) from Hugging Face
- Models run entirely in the browser using WebGL acceleration
- Default model is TinyLlama (1.1B parameters) for fast loading
- Model files are downloaded once and cached in IndexedDB
- Generation runs at about 2-5 tokens per second depending on device
- Mobile devices may experience slower performance

#### Narrative Effects System
- Temporary modifiers that change writing style
- Each effect has a limited duration (measured in turns)
- Random chance to acquire new effects during gameplay
- Effects stack and can create unique narrative combinations

#### Memory System Architecture
- Persistent JSON storage of memorable elements from adventures
- Automatic extraction of key narrative components
- Cross-game referencing with attribution to original adventures 
- Random inclusion of past memories in new game sessions

#### Model Tier Progression
- Four quality tiers with increasing narrative sophistication
- Points earned through gameplay unlock better narrative capabilities
- Each tier uses different generation parameters
- Visual upgrade notifications guide players through progression

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT