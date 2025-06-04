#!/usr/bin/env python3
"""
Main application entry point for Chaotic Adventures.
Serves the frontend and provides API endpoints for the game.
"""

import os
import json
import uuid
from flask import Flask, request, jsonify, send_from_directory
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from typing import Dict, Any

from src.backend.game_engine import GameEngine
from src.backend.validation import (
    validate_player_name, validate_chaos_level, validate_choice_index,
    validate_game_id, validate_load_code, validate_request_json,
    ValidationError, handle_validation_error
)
from src.version import get_version, get_version_info

app = Flask(__name__, static_folder='frontend')

# Initialize rate limiter
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://"
)

# In-memory store for active games
# In production, this would be a database
active_games = {}

# Save games directory
SAVE_DIR = os.path.join(os.path.dirname(__file__), '..', 'saved_games')
os.makedirs(SAVE_DIR, exist_ok=True)


# Global error handler for validation errors
@app.errorhandler(ValidationError)
def handle_validation_exception(error):
    """Handle validation errors globally."""
    response, status_code = handle_validation_error(error)
    return jsonify(response), status_code


@app.route('/')
def index():
    """Serve the main application HTML."""
    return send_from_directory(app.static_folder, 'index.html')


@app.route('/<path:path>')
def static_files(path):
    """Serve static files from the frontend directory."""
    return send_from_directory(app.static_folder, path)


@app.route('/api/start', methods=['POST'])
@limiter.limit("10 per minute")  # Specific rate limit for game starts
def start_game():
    """
    Start a new game with the given player name and chaos level.
    
    Request body:
    {
        "playerName": "string",
        "chaosLevel": number (1-10)
    }
    
    Response:
    {
        "gameId": "string",
        "narrative": "string",
        "choices": ["string"]
    }
    """
    # Validate request data
    data = validate_request_json(['playerName'], ['chaosLevel'])
    
    # Validate and sanitize inputs
    player_name = validate_player_name(data.get('playerName', 'Anonymous'))
    chaos_level = validate_chaos_level(data.get('chaosLevel', 5))
    
    # Create a new game
    game_engine = GameEngine()
    
    # Start the game with provided chaos level
    intro_text = game_engine.start_game(player_name, chaos_level=int(chaos_level))
    
    # Generate a unique ID for this game
    game_id = str(uuid.uuid4())
    
    # Store the game engine
    active_games[game_id] = game_engine
    
    # Get model tier information
    model_info = {
        'tier': game_engine.state.get('model_tier', 'basic'),
        'upgrade_points': game_engine.state.get('model_upgrade_points', 0),
        'upgrades_available': game_engine.state.get('upgrades_available', 0),
        'points_needed': game_engine._get_points_needed_for_upgrade()
    }
    
    return jsonify({
        'gameId': game_id,
        'narrative': intro_text,
        'choices': game_engine.get_choices(),
        'modelInfo': model_info
    })


@app.route('/api/choice', methods=['POST'])
@limiter.limit("30 per minute")  # Higher limit for choices
def make_choice():
    """
    Make a choice in the game.
    
    Request body:
    {
        "gameId": "string",
        "choiceIndex": number
    }
    
    Response:
    {
        "narrative": {"text": "string", "game_over": boolean},
        "choices": ["string"]
    }
    """
    # Validate request data
    data = validate_request_json(['gameId', 'choiceIndex'])
    
    # Validate inputs
    game_id = validate_game_id(data.get('gameId'))
    
    # Get the game engine first to check available choices
    game_engine = active_games.get(game_id)
    if not game_engine:
        return jsonify({'error': 'Game not found'}), 404
    
    # Validate choice index against available choices
    max_choices = len(game_engine.get_choices())
    choice_index = validate_choice_index(data.get('choiceIndex'), max_choices)
    
    # Check for any buffs that might be active before making choice
    active_buffs_before = [buff.copy() for buff in game_engine.state.get('buffs', [])]
    
    # Make the choice - note that this now returns a dict with text and game_over flag
    response = game_engine.make_choice(int(choice_index))
    response_text = response.get('text', '')
    is_game_over = response.get('game_over', False)
    
    # Store the selected choice in case it's needed for game over summary
    selected_choice = game_engine.choices[int(choice_index)] if 0 <= int(choice_index) < len(game_engine.choices) else "Unknown choice"
    
    # Check for new or expired buffs
    active_buffs_after = game_engine.state.get('buffs', [])
    
    # Find new buffs (in after but not in before)
    new_buffs = []
    for buff in active_buffs_after:
        found = False
        for old_buff in active_buffs_before:
            if buff.get('name') == old_buff.get('name'):
                found = True
                break
        if not found:
            new_buffs.append(buff)
    
    # Find expired buffs (in before but not in after)
    expired_buffs = []
    for old_buff in active_buffs_before:
        found = False
        for buff in active_buffs_after:
            if buff.get('name') == old_buff.get('name'):
                found = True
                break
        if not found:
            expired_buffs.append(old_buff)
    
    # Check if a memory was used in this response
    memory_used = None
    if hasattr(game_engine, 'last_used_memory') and game_engine.last_used_memory:
        memory_used = game_engine.last_used_memory
    
    # Get model tier information
    model_info = {
        'tier': game_engine.state.get('model_tier', 'basic'),
        'upgrade_points': game_engine.state.get('model_upgrade_points', 0),
        'upgrades_available': game_engine.state.get('upgrades_available', 0),
        'points_needed': game_engine._get_points_needed_for_upgrade()
    }
    
    # Store the selected choice for game over summary if needed
    if is_game_over:
        game_engine.state['final_choice'] = selected_choice
    
    return jsonify({
        'narrative': {
            'text': response_text,
            'game_over': is_game_over
        },
        'choices': game_engine.get_choices() if not is_game_over else [],
        'newBuffs': new_buffs,
        'expiredBuffs': expired_buffs,
        'activeBuffs': active_buffs_after,
        'memoryUsed': memory_used,
        'activeMemories': game_engine.state.get('past_memories', []),
        'modelInfo': model_info
    })


@app.route('/api/summary', methods=['POST'])
@limiter.limit("5 per minute")  # Lower limit for summaries (more resource intensive)
def get_summary():
    """
    Get a summary of the game.
    
    Request body:
    {
        "gameId": "string",
        "gameOver": boolean (optional),
        "finalChoice": string (optional, for game over summary)
    }
    
    Response:
    {
        "summary": "string"
    }
    """
    # Validate request data
    data = validate_request_json(['gameId'], ['gameOver', 'finalChoice'])
    
    # Validate inputs
    game_id = validate_game_id(data.get('gameId'))
    game_over = data.get('gameOver', False)
    final_choice = data.get('finalChoice')
    
    # Get the game engine
    game_engine = active_games.get(game_id)
    if not game_engine:
        return jsonify({'error': 'Game not found'}), 404
    
    # Generate summary based on whether it's a game over or normal ending
    if game_over:
        # Use final choice from request or from stored state
        if not final_choice and 'final_choice' in game_engine.state:
            final_choice = game_engine.state.get('final_choice')
            
        summary = game_engine.generate_summary(game_over=True, final_choice=final_choice)
    else:
        summary = game_engine.generate_summary()
    
    return jsonify({
        'summary': summary
    })


@app.route('/api/save', methods=['POST'])
@limiter.limit("10 per minute")  # Moderate limit for saves
def save_game():
    """
    Save the current game state.
    
    Request body:
    {
        "gameId": "string"
    }
    
    Response:
    {
        "success": boolean,
        "saveCode": "string"
    }
    """
    # Validate request data
    data = validate_request_json(['gameId'])
    
    # Validate inputs
    game_id = validate_game_id(data.get('gameId'))
    
    # Get the game engine
    game_engine = active_games.get(game_id)
    if not game_engine:
        return jsonify({'error': 'Game not found'}), 404
    
    # Generate a save code
    save_code = str(uuid.uuid4())[:8]
    
    # Save the game state to a file
    save_path = os.path.join(SAVE_DIR, f"{save_code}.json")
    success = game_engine.save_game(save_path)
    
    return jsonify({
        'success': success,
        'saveCode': save_code if success else None
    })


@app.route('/api/load', methods=['POST'])
@limiter.limit("10 per minute")  # Moderate limit for loads
def load_game():
    """
    Load a saved game.
    
    Request body:
    {
        "loadCode": "string"
    }
    
    Response:
    {
        "success": boolean,
        "gameId": "string",
        "playerName": "string",
        "chaosLevel": number,
        "narrative": "string",
        "choices": ["string"]
    }
    """
    # Validate request data
    data = validate_request_json(['loadCode'])
    
    # Validate inputs
    load_code = validate_load_code(data.get('loadCode'))
    
    # Check if the save file exists
    save_path = os.path.join(SAVE_DIR, f"{load_code}.json")
    if not os.path.exists(save_path):
        return jsonify({'error': 'Save file not found'}), 404
    
    # Create a new game engine
    game_engine = GameEngine()
    
    # Load the game state
    success = game_engine.load_game(save_path)
    if not success:
        return jsonify({'error': 'Failed to load game'}), 500
    
    # Generate a new game ID
    game_id = str(uuid.uuid4())
    
    # Store the game engine
    active_games[game_id] = game_engine
    
    return jsonify({
        'success': True,
        'gameId': game_id,
        'playerName': game_engine.state["player_name"],
        'chaosLevel': game_engine.state["chaos_level"],
        'narrative': game_engine.state["story_events"][-1].get("text", 
                                                             game_engine.state["story_events"][-1].get("response", "")),
        'choices': game_engine.get_choices()
    })


@app.route('/api/buffs', methods=['GET'])
def get_available_buffs():
    """
    Get a list of all available narrative buffs/debuffs.
    
    Response:
    {
        "buffs": [
            {
                "name": "string",
                "description": "string",
                "duration": number
            }
        ]
    }
    """
    # Create a sample game engine to get the available buffs
    game_engine = GameEngine()
    
    # Format buffs for the response
    buff_list = []
    for name, details in game_engine.available_buffs.items():
        buff_list.append({
            'name': name,
            'description': details['description'],
            'duration': details['duration']
        })
    
    return jsonify({
        'buffs': buff_list
    })


@app.route('/api/buffs/active', methods=['GET'])
def get_active_buffs():
    """
    Get a list of currently active buffs for a specific game.
    
    Query parameters:
    - gameId: string
    
    Response:
    {
        "buffs": [
            {
                "name": "string",
                "description": "string",
                "turnsRemaining": number
            }
        ]
    }
    """
    game_id = request.args.get('gameId')
    
    if not game_id:
        return jsonify({'error': 'Missing required parameters'}), 400
    
    # Get the game engine
    game_engine = active_games.get(game_id)
    if not game_engine:
        return jsonify({'error': 'Game not found'}), 404
    
    # Get active buffs
    active_buffs = game_engine.state.get('buffs', [])
    
    return jsonify({
        'buffs': active_buffs
    })


@app.route('/api/buffs/add', methods=['POST'])
@limiter.limit("20 per minute")  # Moderate limit for buff additions
def add_buff():
    """
    Add a narrative buff to a game.
    
    Request body:
    {
        "gameId": "string",
        "buffName": "string"
    }
    
    Response:
    {
        "success": boolean,
        "message": "string",
        "buff": {
            "name": "string",
            "description": "string",
            "turnsRemaining": number
        }
    }
    """
    # Validate request data
    data = validate_request_json(['gameId', 'buffName'])
    
    # Validate inputs
    game_id = validate_game_id(data.get('gameId'))
    buff_name = validate_player_name(data.get('buffName'))  # Reuse player name validation for buff names
    
    # Get the game engine
    game_engine = active_games.get(game_id)
    if not game_engine:
        return jsonify({'error': 'Game not found'}), 404
    
    # Add the buff
    success = game_engine.add_buff(buff_name)
    
    if not success:
        return jsonify({
            'success': False,
            'message': f'Buff "{buff_name}" not found'
        })
    
    # Find the added buff in the active buffs
    added_buff = None
    for buff in game_engine.state.get('buffs', []):
        if buff.get('name') == buff_name:
            added_buff = buff
            break
    
    return jsonify({
        'success': True,
        'message': f'Added "{buff_name}" effect to the narrative',
        'buff': added_buff
    })


@app.route('/api/memories', methods=['GET'])
def get_memories():
    """
    Get a list of memories from past adventures.
    
    Query parameters:
    - gameId: string (optional, to get memories loaded for a specific game)
    
    Response:
    {
        "memories": [
            {
                "text": "string",
                "type": "string",
                "attribution": {
                    "player_name": "string",
                    "adventure_id": "string",
                    "date": "string"
                }
            }
        ]
    }
    """
    game_id = request.args.get('gameId')
    
    if game_id:
        # Get memories for specific game
        game_engine = active_games.get(game_id)
        if not game_engine:
            return jsonify({'error': 'Game not found'}), 404
            
        return jsonify({
            'memories': game_engine.state.get('past_memories', [])
        })
    else:
        # Get all memory files
        memory_dir = os.path.join(os.path.dirname(__file__), '..', 'adventure_memories')
        
        if not os.path.exists(memory_dir):
            return jsonify({'memories': []})
            
        memory_files = [f for f in os.listdir(memory_dir) 
                       if f.endswith('.json') and os.path.isfile(os.path.join(memory_dir, f))]
        
        all_memories = []
        for filename in memory_files:
            try:
                with open(os.path.join(memory_dir, filename), 'r') as f:
                    memory_data = json.load(f)
                    
                    # Add basic info about this memory file
                    memory_summary = {
                        'game_id': memory_data.get('game_id', 'unknown'),
                        'player_name': memory_data.get('player_name', 'Unknown Adventurer'),
                        'date': memory_data.get('end_time', 'unknown time'),
                        'memory_count': len(memory_data.get('memorable_elements', [])),
                        'sample_memory': memory_data.get('memorable_elements', [{}])[0].get('text', '') if memory_data.get('memorable_elements') else ''
                    }
                    
                    all_memories.append(memory_summary)
            except Exception as e:
                continue
                
        return jsonify({
            'memories': all_memories
        })


@app.route('/api/memories/adventure', methods=['GET'])
def get_adventure_memories():
    """
    Get all memories for a specific past adventure.
    
    Query parameters:
    - adventureId: string
    
    Response:
    {
        "memories": [
            {
                "text": "string",
                "type": "string"
            }
        ],
        "adventureInfo": {
            "player_name": "string",
            "game_id": "string",
            "date": "string"
        }
    }
    """
    adventure_id = request.args.get('adventureId')
    
    if not adventure_id:
        return jsonify({'error': 'Missing required parameters'}), 400
        
    # Find the memory file
    memory_dir = os.path.join(os.path.dirname(__file__), '..', 'adventure_memories')
    memory_file = os.path.join(memory_dir, f"{adventure_id}.json")
    
    if not os.path.exists(memory_file):
        return jsonify({'error': 'Adventure memory not found'}), 404
        
    try:
        with open(memory_file, 'r') as f:
            memory_data = json.load(f)
            
        return jsonify({
            'memories': memory_data.get('memorable_elements', []),
            'adventureInfo': {
                'player_name': memory_data.get('player_name', 'Unknown Adventurer'),
                'game_id': memory_data.get('game_id', 'unknown'),
                'date': memory_data.get('end_time', 'unknown time'),
                'chaos_level': memory_data.get('chaos_level', 5)
            }
        })
    except Exception as e:
        return jsonify({'error': f'Failed to load adventure memory: {str(e)}'}), 500


@app.route('/api/model/info', methods=['GET'])
def get_model_info():
    """
    Get information about the narrative model tiers.
    
    Query parameters:
    - gameId: string (optional, to get info for a specific game)
    
    Response:
    {
        "tier": "string",
        "upgrade_points": number,
        "upgrades_available": number,
        "tier_info": {
            "description": "string",
            "model_name": "string",
            ...
        },
        "available_tiers": {
            "basic": {...},
            "enhanced": {...},
            ...
        }
    }
    """
    game_id = request.args.get('gameId')
    
    if game_id:
        # Get model info for specific game
        game_engine = active_games.get(game_id)
        if not game_engine:
            return jsonify({'error': 'Game not found'}), 404
            
        return jsonify(game_engine.get_model_tier_info())
    else:
        # Return general model tier information
        sample_engine = GameEngine()
        return jsonify({
            'available_tiers': sample_engine.llm.get_available_tiers()
        })


@app.route('/api/model/upgrade', methods=['POST'])
@limiter.limit("5 per minute")  # Lower limit for model upgrades
def upgrade_model():
    """
    Upgrade the narrative model for a game.
    
    Request body:
    {
        "gameId": "string"
    }
    
    Response:
    {
        "success": boolean,
        "message": "string",
        "old_tier": "string",
        "current_tier": "string",
        "tier_info": {...}
    }
    """
    # Validate request data
    data = validate_request_json(['gameId'])
    
    # Validate inputs
    game_id = validate_game_id(data.get('gameId'))
    
    # Get the game engine
    game_engine = active_games.get(game_id)
    if not game_engine:
        return jsonify({'error': 'Game not found'}), 404
    
    # Attempt the upgrade
    result = game_engine.upgrade_model()
    
    return jsonify(result)


@app.route('/api/model/add-points', methods=['POST'])
@limiter.limit("10 per minute")  # Moderate limit for adding points
def add_model_points():
    """
    Manually add upgrade points to a game.
    (Primarily for testing purposes)
    
    Request body:
    {
        "gameId": "string",
        "points": number
    }
    
    Response:
    {
        "success": boolean,
        "message": "string",
        "total_points": number,
        "upgrades_available": number
    }
    """
    # Validate request data
    data = validate_request_json(['gameId'], ['points'])
    
    # Validate inputs
    game_id = validate_game_id(data.get('gameId'))
    
    # Validate points (limit to reasonable range)
    points = data.get('points', 1)
    if not isinstance(points, int) or points < 1 or points > 100:
        raise ValidationError("Points must be an integer between 1 and 100", "points")
    
    # Get the game engine
    game_engine = active_games.get(game_id)
    if not game_engine:
        return jsonify({'error': 'Game not found'}), 404
    
    # Add the points
    total_points = game_engine.add_upgrade_points(points)
    
    return jsonify({
        'success': True,
        'message': f'Added {points} upgrade points',
        'total_points': total_points,
        'upgrades_available': game_engine.state['upgrades_available']
    })


@app.route('/api/version', methods=['GET'])
def version():
    """
    Get the current version of the application.
    
    Response:
    {
        "version": "string",
        "major": number,
        "minor": number,
        "patch": number
    }
    """
    return jsonify(get_version_info())


if __name__ == '__main__':
    # Get port from environment variable or use default
    port = int(os.environ.get('PORT', 5000))
    
    # Set environment variable for mock LLM responses during development
    if os.environ.get('FLASK_ENV') == 'development':
        os.environ['MOCK_LLM'] = 'true'
    
    app.run(host='0.0.0.0', port=port, debug=os.environ.get('FLASK_ENV') == 'development')