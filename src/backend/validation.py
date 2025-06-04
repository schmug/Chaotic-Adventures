#!/usr/bin/env python3
"""
Input validation utilities for Chaotic Adventures.
Provides secure input validation with length limits and content filtering.
"""

import re
from typing import Optional, Dict, Any, List
from flask import abort


# Security constants
MAX_PLAYER_NAME_LENGTH = 50
MIN_PLAYER_NAME_LENGTH = 1
MAX_CHOICE_TEXT_LENGTH = 500
MAX_NARRATIVE_LENGTH = 5000
MIN_CHAOS_LEVEL = 1
MAX_CHAOS_LEVEL = 10

# Allowed characters in player names (alphanumeric, spaces, basic punctuation)
PLAYER_NAME_PATTERN = re.compile(r'^[a-zA-Z0-9\s\.\-_\']+$')

# Common XSS patterns to block
XSS_PATTERNS = [
    re.compile(r'<script[^>]*>', re.IGNORECASE),
    re.compile(r'javascript:', re.IGNORECASE),
    re.compile(r'on\w+\s*=', re.IGNORECASE),
    re.compile(r'<iframe[^>]*>', re.IGNORECASE),
    re.compile(r'<object[^>]*>', re.IGNORECASE),
    re.compile(r'<embed[^>]*>', re.IGNORECASE),
]


class ValidationError(Exception):
    """Custom exception for validation errors."""
    def __init__(self, message: str, field: str = None):
        self.message = message
        self.field = field
        super().__init__(self.message)


def validate_player_name(player_name: Any) -> str:
    """
    Validate and sanitize player name input.
    
    Args:
        player_name: Raw player name input
        
    Returns:
        Validated and sanitized player name
        
    Raises:
        ValidationError: If validation fails
    """
    if not isinstance(player_name, str):
        raise ValidationError("Player name must be a string", "playerName")
    
    # Strip whitespace
    player_name = player_name.strip()
    
    # Check length
    if len(player_name) < MIN_PLAYER_NAME_LENGTH:
        raise ValidationError(
            f"Player name must be at least {MIN_PLAYER_NAME_LENGTH} character(s)", 
            "playerName"
        )
    
    if len(player_name) > MAX_PLAYER_NAME_LENGTH:
        raise ValidationError(
            f"Player name must be no more than {MAX_PLAYER_NAME_LENGTH} characters", 
            "playerName"
        )
    
    # Check allowed characters
    if not PLAYER_NAME_PATTERN.match(player_name):
        raise ValidationError(
            "Player name contains invalid characters. Only letters, numbers, spaces, and basic punctuation are allowed", 
            "playerName"
        )
    
    # Check for XSS patterns
    for pattern in XSS_PATTERNS:
        if pattern.search(player_name):
            raise ValidationError(
                "Player name contains potentially unsafe content", 
                "playerName"
            )
    
    return player_name


def validate_chaos_level(chaos_level: Any) -> int:
    """
    Validate chaos level input.
    
    Args:
        chaos_level: Raw chaos level input
        
    Returns:
        Validated chaos level
        
    Raises:
        ValidationError: If validation fails
    """
    try:
        chaos_level = int(chaos_level)
    except (ValueError, TypeError):
        raise ValidationError("Chaos level must be a number", "chaosLevel")
    
    if chaos_level < MIN_CHAOS_LEVEL or chaos_level > MAX_CHAOS_LEVEL:
        raise ValidationError(
            f"Chaos level must be between {MIN_CHAOS_LEVEL} and {MAX_CHAOS_LEVEL}", 
            "chaosLevel"
        )
    
    return chaos_level


def validate_choice_index(choice_index: Any, max_choices: int) -> int:
    """
    Validate choice index input.
    
    Args:
        choice_index: Raw choice index input
        max_choices: Maximum number of available choices
        
    Returns:
        Validated choice index
        
    Raises:
        ValidationError: If validation fails
    """
    try:
        choice_index = int(choice_index)
    except (ValueError, TypeError):
        raise ValidationError("Choice index must be a number", "choiceIndex")
    
    if choice_index < 0 or choice_index >= max_choices:
        raise ValidationError(
            f"Choice index must be between 0 and {max_choices - 1}", 
            "choiceIndex"
        )
    
    return choice_index


def validate_game_id(game_id: Any) -> str:
    """
    Validate game ID input.
    
    Args:
        game_id: Raw game ID input
        
    Returns:
        Validated game ID
        
    Raises:
        ValidationError: If validation fails
    """
    if not isinstance(game_id, str):
        raise ValidationError("Game ID must be a string", "gameId")
    
    game_id = game_id.strip()
    
    if not game_id:
        raise ValidationError("Game ID cannot be empty", "gameId")
    
    # Basic UUID format validation (allows flexibility for different ID formats)
    if len(game_id) > 100:  # Reasonable upper limit
        raise ValidationError("Game ID is too long", "gameId")
    
    # Check for potentially dangerous characters
    if not re.match(r'^[a-zA-Z0-9\-_]+$', game_id):
        raise ValidationError("Game ID contains invalid characters", "gameId")
    
    return game_id


def validate_load_code(load_code: Any) -> str:
    """
    Validate load code input for saved games.
    
    Args:
        load_code: Raw load code input
        
    Returns:
        Validated load code
        
    Raises:
        ValidationError: If validation fails
    """
    if not isinstance(load_code, str):
        raise ValidationError("Load code must be a string", "loadCode")
    
    load_code = load_code.strip()
    
    if not load_code:
        raise ValidationError("Load code cannot be empty", "loadCode")
    
    if len(load_code) > 1000:  # Reasonable upper limit for encoded save data
        raise ValidationError("Load code is too long", "loadCode")
    
    return load_code


def sanitize_llm_input(text: str) -> str:
    """
    Sanitize text input before sending to LLM.
    
    Args:
        text: Raw text input
        
    Returns:
        Sanitized text
    """
    if not isinstance(text, str):
        return ""
    
    # Limit length
    if len(text) > MAX_NARRATIVE_LENGTH:
        text = text[:MAX_NARRATIVE_LENGTH]
    
    # Remove potential script injection attempts
    for pattern in XSS_PATTERNS:
        text = pattern.sub('', text)
    
    # Remove excessive whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    
    return text


def validate_request_json(required_fields: List[str], optional_fields: List[str] = None) -> Dict[str, Any]:
    """
    Validate JSON request body and extract required fields.
    
    Args:
        required_fields: List of required field names
        optional_fields: List of optional field names
        
    Returns:
        Validated request data
        
    Raises:
        ValidationError: If validation fails
    """
    from flask import request
    
    if not request.is_json:
        raise ValidationError("Request must be JSON")
    
    try:
        data = request.get_json()
    except Exception:
        raise ValidationError("Invalid JSON format")
    
    if not isinstance(data, dict):
        raise ValidationError("Request body must be a JSON object")
    
    # Check for required fields
    missing_fields = []
    for field in required_fields:
        if field not in data:
            missing_fields.append(field)
    
    if missing_fields:
        raise ValidationError(f"Missing required fields: {', '.join(missing_fields)}")
    
    # Extract only known fields to prevent injection
    validated_data = {}
    all_fields = required_fields + (optional_fields or [])
    
    for field in all_fields:
        if field in data:
            validated_data[field] = data[field]
    
    return validated_data


def handle_validation_error(error: ValidationError) -> tuple:
    """
    Convert ValidationError to Flask error response.
    
    Args:
        error: ValidationError instance
        
    Returns:
        Tuple of (response_dict, status_code)
    """
    response = {
        'error': error.message,
        'type': 'validation_error'
    }
    
    if error.field:
        response['field'] = error.field
    
    return response, 400