#!/usr/bin/env python3
"""
Tests for the browser LLM simulator interface.
"""

import pytest
import os
import json
from unittest.mock import patch, MagicMock

# Create a simple test helper for frontend/browser LLM simulation
class BrowserLLMTester:
    """Helper class to test browser LLM simulation logic."""
    
    def __init__(self, model_config=None):
        """Initialize the browser LLM tester with configuration."""
        self.model_config = model_config or {
            "modelId": "Xenova/TinyLlama-1.1B-Chat-v1.0",
            "maxTokens": 500,
            "temperature": 0.8
        }
        self.generate_called = False
        self.last_prompt = None
        self.last_parameters = None
    
    async def generate(self, prompt, parameters=None):
        """Simulate generating text from a local browser LLM."""
        self.generate_called = True
        self.last_prompt = prompt
        self.last_parameters = parameters or {}
        
        # Return a mock response similar to what the browser LLM would return
        generated_text = self._mock_response(prompt)
        return [{"generated_text": prompt + "\n\n" + generated_text}]
    
    def _mock_response(self, prompt):
        """Generate a mock response based on the prompt content."""
        if "intro" in prompt.lower():
            return "Welcome to the Whimsical Woods, where reality takes a vacation!"
        elif "choices" in prompt.lower():
            return "1. Follow the glowing path\n2. Talk to the strange creature\n3. Investigate the unusual sounds"
        elif "chaotic" in prompt.lower():
            return "Suddenly, gravity reverses and you find yourself walking on the ceiling!"
        elif "summary" in prompt.lower():
            return "Your adventure was filled with impossible physics and strange encounters."
        else:
            return "The story continues with unexpected twists and turns."


class TestBrowserLLM:
    """Test suite for browser LLM functionality."""
    
    @pytest.fixture
    def llm_tester(self):
        """Create a BrowserLLMTester instance for testing."""
        return BrowserLLMTester()
    
    @pytest.mark.asyncio
    async def test_basic_generation(self, llm_tester):
        """Test that basic text generation works."""
        prompt = "Create an intro for a chaotic adventure."
        result = await llm_tester.generate(prompt)
        
        assert llm_tester.generate_called
        assert llm_tester.last_prompt == prompt
        assert "Whimsical Woods" in result[0]["generated_text"]
    
    @pytest.mark.asyncio
    async def test_generation_with_parameters(self, llm_tester):
        """Test generation with custom parameters."""
        prompt = "Generate some choices for the player."
        params = {"max_new_tokens": 200, "temperature": 0.9}
        
        result = await llm_tester.generate(prompt, params)
        
        assert llm_tester.generate_called
        assert llm_tester.last_prompt == prompt
        assert llm_tester.last_parameters == params
        assert "1. Follow" in result[0]["generated_text"]
    
    @pytest.mark.asyncio
    async def test_different_prompt_types(self, llm_tester):
        """Test generating different types of content."""
        # Test intro generation
        intro_result = await llm_tester.generate("Create an intro for a chaotic adventure.")
        assert "Whimsical Woods" in intro_result[0]["generated_text"]
        
        # Test choices generation
        choices_result = await llm_tester.generate("Generate some choices for the player.")
        assert "1. Follow" in choices_result[0]["generated_text"]
        
        # Test chaotic event generation
        event_result = await llm_tester.generate("Generate a chaotic event.")
        assert "gravity reverses" in event_result[0]["generated_text"]
        
        # Test summary generation
        summary_result = await llm_tester.generate("Create a summary of this adventure.")
        assert "adventure was filled" in summary_result[0]["generated_text"]
    
    def test_parse_choices_basic(self):
        """Test parsing choices from formatted text."""
        # This simulates the parseChoicesFromText function in app.js
        text = "1. Follow the glowing path\n2. Talk to the strange creature\n3. Investigate the unusual sounds"
        
        # Simple regex-based parsing similar to the frontend code
        number_pattern = r'^\s*\d+\.\s*(.+)$'
        import re
        matches = re.findall(number_pattern, text, re.MULTILINE)
        
        assert len(matches) == 3
        assert matches[0] == "Follow the glowing path"
        assert matches[1] == "Talk to the strange creature"
        assert matches[2] == "Investigate the unusual sounds"
    
    def test_parse_choices_messy(self):
        """Test parsing choices from less structured text."""
        # Simulate messier LLM output
        text = """
        Here are some possible choices:
        
        1. Follow the mysterious lights
        2. Climb the talking tree for a better view
        Option 3: Run away screaming
        4) Ask the nearest rock for advice
        
        Choose wisely!
        """
        
        # Simple regex-based parsing similar to the frontend code
        number_pattern = r'^\s*\d+[\.\)]?\s*(.+)$'
        import re
        matches = re.findall(number_pattern, text, re.MULTILINE)
        
        assert len(matches) >= 3
        assert "Follow the mysterious lights" in matches
        assert any("Climb the talking tree" in match for match in matches)
    
    def test_fallback_parsing(self):
        """Test fallback parsing when the format is unexpected."""
        # Simulate completely unstructured output
        text = """
        You could follow the path that leads deeper into the forest.
        Alternatively, you might want to examine the strange glowing mushrooms.
        Perhaps talking to the ghostly figure would yield interesting results.
        """
        
        # Fallback: split by lines and filter
        lines = [line.strip() for line in text.split('\n')]
        lines = [line for line in lines if line and len(line) < 100]
        
        assert len(lines) >= 3
        assert any("path" in line for line in lines)
        assert any("mushrooms" in line for line in lines)
        assert any("ghostly figure" in line for line in lines)


if __name__ == "__main__":
    pytest.main(["-v", "test_browser_llm.py"])