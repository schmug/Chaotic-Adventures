#!/usr/bin/env python3
"""
Tests for the game engine module.
"""

import os
import pytest
from unittest.mock import patch, MagicMock

from src.backend.game_engine import GameEngine


class TestGameEngine:
    """Test suite for the GameEngine class."""
    
    @pytest.fixture
    def engine(self):
        """Create a GameEngine instance for testing."""
        # Set mock LLM environment variable for testing
        os.environ["MOCK_LLM"] = "true"
        
        # Mock the memory directory and loading to avoid file system access in tests
        with patch('os.makedirs'), patch('os.path.dirname', return_value='/mock/path'), \
             patch('os.listdir', return_value=[]), patch.object(GameEngine, '_load_past_memories'):
            engine = GameEngine()
            # Mock memory methods to avoid file operations during tests
            engine._extract_memorable_elements = MagicMock()
            engine._save_adventure_memory = MagicMock(return_value=True)
            yield engine
        
        # Cleanup
        if "MOCK_LLM" in os.environ:
            del os.environ["MOCK_LLM"]
    
    def test_init(self, engine):
        """Test the initialization of the game engine."""
        assert engine.state["player_name"] == ""
        assert engine.state["story_events"] == []
        assert engine.state["chaos_level"] == 5
        assert isinstance(engine.choices, list)
    
    def test_start_game(self, engine):
        """Test starting a new game."""
        intro = engine.start_game("TestPlayer")
        
        assert engine.state["player_name"] == "TestPlayer"
        assert len(engine.state["story_events"]) == 1
        assert engine.state["story_events"][0]["type"] == "intro"
        assert isinstance(intro, str)
        assert len(intro) > 0
        assert len(engine.choices) > 0
    
    def test_make_choice_valid(self, engine):
        """Test making a valid choice."""
        engine.start_game("TestPlayer")
        initial_event_count = len(engine.state["story_events"])
        
        # Force some choices for testing
        engine.choices = ["Option A", "Option B", "Option C"]
        
        response = engine.make_choice(1)  # Choose "Option B"
        
        assert len(engine.state["story_events"]) > initial_event_count
        
        # Get the event directly after the intro
        player_choice_event = None
        for event in engine.state["story_events"]:
            if event.get("type") == "player_choice":
                player_choice_event = event
                break
        
        assert player_choice_event is not None
        assert player_choice_event["type"] == "player_choice"
        assert player_choice_event["choice"] == "Option B"
        assert isinstance(response, str)
        assert len(response) > 0
    
    def test_make_choice_invalid(self, engine):
        """Test making an invalid choice."""
        engine.start_game("TestPlayer")
        initial_event_count = len(engine.state["story_events"])
        
        # Force some choices for testing
        engine.choices = ["Option A", "Option B", "Option C"]
        
        response = engine.make_choice(5)  # Invalid index
        
        assert len(engine.state["story_events"]) == initial_event_count
        assert response == "Invalid choice. Please try again."
    
    def test_get_choices(self, engine):
        """Test getting available choices."""
        engine.start_game("TestPlayer")
        
        # Force choices for testing
        test_choices = ["Option A", "Option B", "Option C"]
        engine.choices = test_choices.copy()
        
        choices = engine.get_choices()
        
        assert choices == test_choices
    
    def test_generate_summary(self, engine):
        """Test generating an adventure summary."""
        engine.start_game("TestPlayer")
        
        # Add some events to the story
        engine.state["story_events"].append({
            "type": "player_choice",
            "choice": "Test choice",
            "response": "Test response"
        })
        
        summary = engine.generate_summary()
        
        assert isinstance(summary, str)
        assert len(summary) > 0
    
    @patch("builtins.open", new_callable=MagicMock)
    @patch("json.dump")
    def test_save_game(self, mock_json_dump, mock_open, engine):
        """Test saving a game."""
        # Reset mock to clear any previous calls
        mock_open.reset_mock()
        mock_json_dump.reset_mock()
        
        engine.start_game("TestPlayer")
        
        result = engine.save_game("test_save.json")
        
        assert result is True
        # Check that the file was opened with the correct path and mode
        mock_open.assert_called_with("test_save.json", "w")
        # Check that json.dump was called
        assert mock_json_dump.called
    
    @patch("builtins.open", new_callable=MagicMock)
    @patch("json.load")
    def test_load_game(self, mock_json_load, mock_open, engine):
        """Test loading a game."""
        # Reset mocks to clear any previous calls
        mock_open.reset_mock()
        mock_json_load.reset_mock()
        
        # Setup mock to return a valid state with new fields
        mock_json_load.return_value = {
            "player_name": "LoadedPlayer",
            "current_location": "TestLocation",
            "inventory": ["item1"],
            "story_events": [{"type": "intro", "text": "Test intro"}],
            "chaos_level": 7,
            "buffs": [],
            "memorable_elements": [],
            "past_memories": [],
            "game_id": "test_game_id",
            "start_time": "2025-03-02T12:00:00"
        }
        
        result = engine.load_game("test_save.json")
        
        assert result is True
        assert engine.state["player_name"] == "LoadedPlayer"
        assert engine.state["chaos_level"] == 7
        # Check that the file was opened with the correct path and mode
        mock_open.assert_called_with("test_save.json", "r")
        # Check that json.load was called
        assert mock_json_load.called


    def test_adventure_memory_extraction(self, engine):
        """Test extracting memorable elements from an adventure."""
        engine.start_game("TestPlayer")
        
        # Add some events to the story
        engine.state["story_events"].append({
            "type": "player_choice",
            "choice": "Test choice",
            "response": "Test response with memorable elements"
        })
        
        # Since we mocked the _extract_memorable_elements method in the fixture,
        # we'll temporarily restore it for this test
        original_extract_method = engine._extract_memorable_elements
        
        # Create a mock LLM response for memory extraction
        with patch.object(engine.llm, 'generate', return_value="1. A talking squirrel with a monocle\n2. A floating castle made of cheese"):
            # Restore the method for testing
            engine._extract_memorable_elements = GameEngine._extract_memorable_elements.__get__(engine)
            
            # Call the method
            engine._extract_memorable_elements()
            
            # Check that memories were extracted
            assert len(engine.state["memorable_elements"]) > 0
            
            # Check that the format is correct
            assert "text" in engine.state["memorable_elements"][0]
            assert "type" in engine.state["memorable_elements"][0]
            
            # Restore the mock for other tests
            engine._extract_memorable_elements = original_extract_method

    @patch('os.path.join', return_value='/mock/memory/path.json')
    @patch('builtins.open', new_callable=MagicMock)
    @patch('json.dump')
    def test_save_adventure_memory(self, mock_json_dump, mock_open, mock_path_join, engine):
        """Test saving adventure memories."""
        engine.start_game("TestPlayer")
        
        # Add some memorable elements
        engine.state["memorable_elements"] = [
            {"text": "A talking squirrel with a monocle", "type": "memory"},
            {"text": "A floating castle made of cheese", "type": "memory"}
        ]
        
        # Since we mocked the method in the fixture, restore it for this test
        original_save_method = engine._save_adventure_memory
        engine._save_adventure_memory = GameEngine._save_adventure_memory.__get__(engine)
        
        # Reset mocks
        mock_open.reset_mock()
        mock_json_dump.reset_mock()
        
        # Call the method
        result = engine._save_adventure_memory()
        
        # Check the result
        assert result is True
        assert mock_open.called
        assert mock_json_dump.called
        
        # Restore the mock
        engine._save_adventure_memory = original_save_method


if __name__ == "__main__":
    pytest.main(["-v", "test_game_engine.py"])