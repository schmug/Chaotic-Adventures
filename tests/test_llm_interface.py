#!/usr/bin/env python3
"""
Tests for the LLM interface module.
"""

import os
import pytest
import requests
from unittest.mock import patch, MagicMock

from src.backend.llm_interface import LLMInterface


class TestLLMInterface:
    """Test suite for the LLMInterface class."""
    
    @pytest.fixture
    def llm(self):
        """Create an LLMInterface instance for testing."""
        return LLMInterface()
    
    def test_init(self, llm):
        """Test initialization of the LLM interface."""
        assert llm.model_name == "llama3"
        assert "localhost" in llm.api_url
        assert llm.max_tokens == 1000
        assert 0 < llm.temperature < 1  # Should be between 0 and 1
    
    def test_mock_response(self, llm):
        """Test mock response generation."""
        # Enable mock mode
        os.environ["MOCK_LLM"] = "true"
        
        # Test different prompt types
        intro_response = llm.generate("intro test prompt")
        assert "Welcome to the Whimsical Woods" in intro_response
        
        choices_response = llm.generate("generate_choices test")
        assert "Follow the glowing mushrooms" in choices_response
        
        choice_response = llm.generate("choice_response test")
        assert "As you decide to follow the glowing mushrooms" in choice_response
        
        chaotic_response = llm.generate("chaotic_event test")
        assert "neon purple" in chaotic_response
        
        summary_response = llm.generate("adventure_summary test")
        assert "peculiar Tuesday afternoon" in summary_response
        
        # Test fallback for unknown prompt types
        fallback_response = llm.generate("unknown prompt type")
        assert "universe hiccups" in fallback_response
        
        # Cleanup
        del os.environ["MOCK_LLM"]
    
    @patch("requests.post")
    def test_real_llm_request_success(self, mock_post, llm):
        """Test successful API request to a real LLM."""
        # Ensure mock mode is disabled
        if "MOCK_LLM" in os.environ:
            del os.environ["MOCK_LLM"]
        
        # Mock a successful API response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"response": "This is a test response from the LLM."}
        mock_post.return_value = mock_response
        
        response = llm.generate("Test prompt")
        
        # Verify the response
        assert response == "This is a test response from the LLM."
        
        # Verify the API was called with the correct parameters
        mock_post.assert_called_once()
        args, kwargs = mock_post.call_args
        assert kwargs["json"]["model"] == "llama3"
        assert kwargs["json"]["prompt"] == "Test prompt"
        assert kwargs["json"]["options"]["temperature"] == llm.temperature
        assert kwargs["json"]["options"]["max_tokens"] == llm.max_tokens
    
    @patch("requests.post")
    def test_api_error_handling(self, mock_post, llm):
        """Test handling of API errors."""
        # Ensure mock mode is disabled
        if "MOCK_LLM" in os.environ:
            del os.environ["MOCK_LLM"]
        
        # Mock an API error response
        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_post.return_value = mock_response
        
        response = llm.generate("Test prompt")
        
        # Should return a fallback response
        assert "Something strange happened" in response
    
    @patch("requests.post")
    def test_connection_error_handling(self, mock_post, llm):
        """Test handling of connection errors."""
        # Ensure mock mode is disabled
        if "MOCK_LLM" in os.environ:
            del os.environ["MOCK_LLM"]
        
        # Mock a connection error
        mock_post.side_effect = requests.exceptions.ConnectionError("Connection refused")
        
        response = llm.generate("Test prompt")
        
        # Should return a fallback response
        assert "Something strange happened" in response
    
    @patch("requests.post")
    def test_timeout_handling(self, mock_post, llm):
        """Test handling of timeout errors."""
        # Ensure mock mode is disabled
        if "MOCK_LLM" in os.environ:
            del os.environ["MOCK_LLM"]
        
        # Mock a timeout error
        mock_post.side_effect = requests.exceptions.Timeout("Request timed out")
        
        response = llm.generate("Test prompt")
        
        # Should return a fallback response
        assert "Something strange happened" in response
    
    def test_fallback_response(self, llm):
        """Test the fallback response function directly."""
        fallback = llm._fallback_response("Test prompt")
        assert "Something strange happened" in fallback
    
    @patch.dict(os.environ, {"LLM_API_URL": "https://custom-llm-api.example.com/generate"})
    def test_custom_api_url(self):
        """Test using a custom API URL from environment."""
        custom_llm = LLMInterface()
        assert custom_llm.api_url == "https://custom-llm-api.example.com/generate"


if __name__ == "__main__":
    pytest.main(["-v", "test_llm_interface.py"])