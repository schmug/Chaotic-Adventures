#!/usr/bin/env python3
"""
Enhanced LLM Interface for Chaotic Adventures.
Supports multiple providers including OpenRouter, Ollama, and Mock responses.
"""

import os
import logging
from typing import Dict, Any, List, Optional, Union
from enum import Enum
from .llm_interface import LLMInterface, NARRATIVE_MODIFIERS
from .openrouter_provider import OpenRouterProvider
from .validation import sanitize_llm_input

logger = logging.getLogger(__name__)


class LLMProviderType(Enum):
    """Supported LLM provider types."""
    OPENROUTER = "openrouter"
    OLLAMA = "ollama" 
    MOCK = "mock"
    BROWSER = "browser"


class EnhancedLLMInterface:
    """Enhanced LLM interface supporting multiple providers."""
    
    def __init__(self, 
                 provider_type: Union[str, LLMProviderType] = LLMProviderType.OPENROUTER,
                 model_name: Optional[str] = None,
                 tier: str = "enhanced",
                 api_key: Optional[str] = None,
                 **kwargs):
        """
        Initialize enhanced LLM interface.
        
        Args:
            provider_type: Type of provider to use
            model_name: Specific model name (provider-dependent)
            tier: Quality tier (basic, enhanced, advanced, master)
            api_key: API key for cloud providers
            **kwargs: Additional provider-specific arguments
        """
        # Convert string to enum if needed
        if isinstance(provider_type, str):
            try:
                provider_type = LLMProviderType(provider_type)
            except ValueError:
                logger.warning(f"Unknown provider type: {provider_type}, defaulting to mock")
                provider_type = LLMProviderType.MOCK
        
        self.provider_type = provider_type
        self.tier = tier
        self.chaos_level = 5
        self.active_modifiers = []
        
        # Initialize the appropriate provider
        self.provider = self._create_provider(provider_type, model_name, api_key, **kwargs)
        
        # Fallback providers in order of preference
        self.fallback_providers = []
        self._setup_fallback_providers()
        
        logger.info(f"Enhanced LLM interface initialized with provider: {provider_type.value}")
    
    def _create_provider(self, 
                        provider_type: LLMProviderType, 
                        model_name: Optional[str],
                        api_key: Optional[str],
                        **kwargs) -> Any:
        """Create and return appropriate provider instance."""
        
        if provider_type == LLMProviderType.OPENROUTER:
            # Default to Claude 3.5 Sonnet for best quality
            default_model = "anthropic/claude-3.5-sonnet"
            if model_name:
                default_model = model_name
            elif self.tier == "basic":
                default_model = "anthropic/claude-3-haiku"  # Cheaper for basic tier
            elif self.tier == "enhanced":
                default_model = "openai/gpt-4o-mini"  # Good balance
            elif self.tier == "advanced":
                default_model = "openai/gpt-4o"  # High quality
            elif self.tier == "master":
                default_model = "anthropic/claude-3.5-sonnet"  # Best quality
            
            return OpenRouterProvider(api_key=api_key, default_model=default_model)
        
        elif provider_type == LLMProviderType.OLLAMA:
            # Use original LLM interface for Ollama
            return LLMInterface(model_name=model_name or "llama3", tier=self.tier)
        
        elif provider_type == LLMProviderType.MOCK:
            # Return mock provider
            return MockLLMProvider(tier=self.tier)
        
        else:
            # Default to mock
            logger.warning(f"Provider {provider_type} not implemented, using mock")
            return MockLLMProvider(tier=self.tier)
    
    def _setup_fallback_providers(self):
        """Set up fallback providers for reliability."""
        # Always have mock as final fallback
        self.fallback_providers.append(MockLLMProvider(tier=self.tier))
        
        # Add Ollama as fallback if not primary provider
        if self.provider_type != LLMProviderType.OLLAMA:
            try:
                self.fallback_providers.insert(0, LLMInterface(tier=self.tier))
            except Exception:
                pass  # Ollama might not be available
    
    def generate(self, prompt: str, **kwargs) -> str:
        """
        Generate text using the configured provider with fallback.
        
        Args:
            prompt: Input prompt
            **kwargs: Additional generation parameters
            
        Returns:
            Generated text
        """
        # Sanitize input
        prompt = sanitize_llm_input(prompt)
        
        # Apply narrative modifiers
        modified_prompt = self._apply_modifiers_to_prompt(prompt)
        
        # Try primary provider
        try:
            if hasattr(self.provider, 'generate'):
                return self.provider.generate(modified_prompt, **kwargs)
            else:
                # For LLMInterface compatibility
                return self.provider.generate(modified_prompt)
        except Exception as e:
            logger.warning(f"Primary provider failed: {e}")
            
            # Try fallback providers
            for fallback in self.fallback_providers:
                try:
                    if hasattr(fallback, 'generate'):
                        return fallback.generate(modified_prompt, **kwargs)
                    else:
                        return fallback.generate(modified_prompt)
                except Exception as fe:
                    logger.warning(f"Fallback provider failed: {fe}")
                    continue
            
            # If all providers fail, return a safe fallback
            return "The narrator pauses, gathering their thoughts before continuing this chaotic tale..."
    
    def get_available_models(self) -> List[Dict[str, Any]]:
        """Get available models from current provider."""
        if hasattr(self.provider, 'get_available_models'):
            models = self.provider.get_available_models()
            # Convert to dict format
            return [
                {
                    'id': model.id,
                    'name': model.name,
                    'description': model.description,
                    'tier': model.tier,
                    'cost_per_1k': model.cost_per_1k_tokens,
                    'quality': model.quality_rating
                }
                for model in models
            ]
        return []
    
    def switch_model(self, model_id: str) -> bool:
        """Switch to a different model if supported."""
        if hasattr(self.provider, 'switch_model'):
            return self.provider.switch_model(model_id)
        return False
    
    def get_usage_stats(self) -> Dict[str, Any]:
        """Get usage statistics if supported."""
        if hasattr(self.provider, 'get_usage_stats'):
            return self.provider.get_usage_stats()
        return {}
    
    def estimate_cost(self, prompt: str) -> float:
        """Estimate cost for generating response."""
        if hasattr(self.provider, 'estimate_cost'):
            return self.provider.estimate_cost(prompt)
        return 0.0
    
    def get_current_tier_info(self) -> Dict[str, Any]:
        """Get current tier information."""
        base_info = {
            'tier': self.tier,
            'provider': self.provider_type.value,
            'chaos_level': self.chaos_level,
            'active_modifiers': len(self.active_modifiers)
        }
        
        if hasattr(self.provider, 'get_tier_info'):
            provider_info = self.provider.get_tier_info()
            base_info.update(provider_info)
        
        return base_info
    
    def get_available_tiers(self) -> Dict[str, Any]:
        """Get information about available tiers."""
        return {
            'basic': {
                'description': 'Fast responses with good quality',
                'models': 'Budget-friendly options',
                'cost': 'Low cost per request'
            },
            'enhanced': {
                'description': 'Balanced performance and quality',
                'models': 'Mid-tier models with creativity',
                'cost': 'Moderate cost per request'
            },
            'advanced': {
                'description': 'High-quality narrative generation',
                'models': 'Premium models with excellent output',
                'cost': 'Higher cost per request'
            },
            'master': {
                'description': 'Best possible narrative quality',
                'models': 'Top-tier models with exceptional creativity',
                'cost': 'Premium cost per request'
            }
        }
    
    def set_chaos_level(self, level: int):
        """Set chaos level (affects narrative style)."""
        self.chaos_level = max(1, min(level, 10))
        if hasattr(self.provider, 'set_chaos_level'):
            self.provider.set_chaos_level(level)
    
    def add_modifier(self, modifier_key: str) -> bool:
        """Add narrative modifier."""
        if modifier_key in NARRATIVE_MODIFIERS:
            modifier = NARRATIVE_MODIFIERS[modifier_key]
            self.active_modifiers.append(modifier)
            return True
        return False
    
    def update_modifiers(self) -> tuple:
        """Update modifiers, removing expired ones."""
        expired = []
        remaining = []
        
        for modifier in self.active_modifiers:
            if modifier.decrement_duration():
                remaining.append(modifier)
            else:
                expired.append(modifier.name)
        
        self.active_modifiers = remaining
        return expired, [m.name for m in remaining]
    
    def _apply_modifiers_to_prompt(self, prompt: str) -> str:
        """Apply active modifiers to prompt."""
        modified_prompt = prompt
        for modifier in self.active_modifiers:
            modified_prompt = modifier.apply_to_prompt(modified_prompt)
        return modified_prompt
    
    def get_provider_info(self) -> Dict[str, Any]:
        """Get information about current provider."""
        return {
            'type': self.provider_type.value,
            'tier': self.tier,
            'has_fallback': len(self.fallback_providers) > 0,
            'supports_model_switching': hasattr(self.provider, 'switch_model'),
            'supports_cost_estimation': hasattr(self.provider, 'estimate_cost'),
            'supports_usage_tracking': hasattr(self.provider, 'get_usage_stats')
        }


class MockLLMProvider:
    """Mock LLM provider for testing and fallback."""
    
    def __init__(self, tier: str = "basic"):
        self.tier = tier
        self.request_count = 0
    
    def generate(self, prompt: str, **kwargs) -> str:
        """Generate mock response based on tier."""
        self.request_count += 1
        
        if "intro" in prompt.lower():
            if self.tier == "master":
                return "Welcome to the Whimsical Woods, where reality bends like a pretzel in a philosopher's hands! As you step into this realm of delightful absurdity, the ancient trees lean in to whisper secrets in languages that sound suspiciously like backwards grocery lists. The very air shimmers with the kind of chaos that makes quantum physicists weep tears of joy."
            else:
                return "Welcome to the Whimsical Woods! Strange things happen here, and your adventure is about to begin in the most unexpected ways."
        
        elif "choice" in prompt.lower() or "response" in prompt.lower():
            if self.tier == "master":
                return "Your decision ripples through the fabric of this peculiar reality like a pebble thrown into a pond of liquid starlight. The consequences unfold in ways that would make a chaos theorist applaud while simultaneously questioning their life choices."
            else:
                return "Your choice leads to unexpected consequences as the story takes another chaotic turn!"
        
        else:
            return f"The narrator ({self.tier} tier) continues the tale with creative flourish..."
    
    def get_usage_stats(self) -> Dict[str, Any]:
        return {
            'total_requests': self.request_count,
            'total_tokens': self.request_count * 100,
            'total_cost': 0.0,
            'provider': 'mock'
        }


# Convenience functions for easy integration
def create_openrouter_interface(api_key: Optional[str] = None, 
                              tier: str = "enhanced",
                              model: Optional[str] = None) -> EnhancedLLMInterface:
    """Create OpenRouter-based LLM interface."""
    return EnhancedLLMInterface(
        provider_type=LLMProviderType.OPENROUTER,
        tier=tier,
        model_name=model,
        api_key=api_key
    )


def create_mock_interface(tier: str = "basic") -> EnhancedLLMInterface:
    """Create mock LLM interface for testing."""
    return EnhancedLLMInterface(
        provider_type=LLMProviderType.MOCK,
        tier=tier
    )


def create_ollama_interface(model: str = "llama3", tier: str = "basic") -> EnhancedLLMInterface:
    """Create Ollama-based LLM interface."""
    return EnhancedLLMInterface(
        provider_type=LLMProviderType.OLLAMA,
        model_name=model,
        tier=tier
    )


if __name__ == "__main__":
    # Test the enhanced interface
    print("Testing Enhanced LLM Interface...")
    
    # Test mock provider
    mock_interface = create_mock_interface("master")
    response = mock_interface.generate("Create an introduction for a chaotic adventure")
    print(f"Mock response: {response[:100]}...")
    
    # Test OpenRouter if API key available
    if os.getenv('OPENROUTER_API_KEY'):
        try:
            or_interface = create_openrouter_interface(tier="enhanced")
            models = or_interface.get_available_models()
            print(f"OpenRouter models available: {len(models)}")
            print(f"Provider info: {or_interface.get_provider_info()}")
        except Exception as e:
            print(f"OpenRouter test failed: {e}")
    else:
        print("OPENROUTER_API_KEY not set, skipping OpenRouter test")
    
    print("Enhanced LLM Interface tests completed!")