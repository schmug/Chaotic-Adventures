#!/usr/bin/env python3
"""
OpenRouter LLM Provider for Chaotic Adventures.
Provides access to multiple high-quality models through OpenRouter API.
"""

import os
import time
import logging
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from openai import OpenAI
from .validation import sanitize_llm_input

logger = logging.getLogger(__name__)


@dataclass
class ModelInfo:
    """Information about an available model."""
    id: str
    name: str
    description: str
    tier: str
    cost_per_1k_tokens: float
    max_tokens: int
    context_length: int
    quality_rating: int  # 1-5 stars


class OpenRouterProvider:
    """OpenRouter LLM provider with multiple model support."""
    
    # Available models with their configurations
    AVAILABLE_MODELS = {
        "anthropic/claude-3.5-sonnet": ModelInfo(
            id="anthropic/claude-3.5-sonnet",
            name="Claude 3.5 Sonnet",
            description="Anthropic's most intelligent model with excellent creative writing",
            tier="master",
            cost_per_1k_tokens=0.003,
            max_tokens=8192,
            context_length=200000,
            quality_rating=5
        ),
        "anthropic/claude-3-haiku": ModelInfo(
            id="anthropic/claude-3-haiku",
            name="Claude 3 Haiku",
            description="Fast, intelligent model perfect for interactive storytelling",
            tier="enhanced",
            cost_per_1k_tokens=0.00025,
            max_tokens=4096,
            context_length=200000,
            quality_rating=4
        ),
        "openai/gpt-4o": ModelInfo(
            id="openai/gpt-4o",
            name="GPT-4o",
            description="OpenAI's flagship model with excellent narrative capabilities",
            tier="master",
            cost_per_1k_tokens=0.005,
            max_tokens=4096,
            context_length=128000,
            quality_rating=5
        ),
        "openai/gpt-4o-mini": ModelInfo(
            id="openai/gpt-4o-mini",
            name="GPT-4o Mini",
            description="Fast and cost-effective with good story generation",
            tier="advanced",
            cost_per_1k_tokens=0.00015,
            max_tokens=16384,
            context_length=128000,
            quality_rating=4
        ),
        "meta-llama/llama-3.1-70b-instruct": ModelInfo(
            id="meta-llama/llama-3.1-70b-instruct",
            name="Llama 3.1 70B",
            description="Meta's powerful open-source model with creative storytelling",
            tier="advanced",
            cost_per_1k_tokens=0.0004,
            max_tokens=4096,
            context_length=131072,
            quality_rating=4
        ),
        "google/gemini-pro-1.5": ModelInfo(
            id="google/gemini-pro-1.5",
            name="Gemini Pro 1.5",
            description="Google's advanced model with strong creative capabilities",
            tier="advanced",
            cost_per_1k_tokens=0.00125,
            max_tokens=8192,
            context_length=1000000,
            quality_rating=4
        ),
        "mistralai/mixtral-8x7b-instruct": ModelInfo(
            id="mistralai/mixtral-8x7b-instruct",
            name="Mixtral 8x7B",
            description="Mistral's mixture-of-experts model with creative writing skills",
            tier="enhanced",
            cost_per_1k_tokens=0.00024,
            max_tokens=4096,
            context_length=32768,
            quality_rating=3
        ),
        "perplexity/llama-3.1-sonar-large-128k-online": ModelInfo(
            id="perplexity/llama-3.1-sonar-large-128k-online",
            name="Perplexity Sonar Large",
            description="Perplexity's model with real-time information access",
            tier="enhanced",
            cost_per_1k_tokens=0.001,
            max_tokens=4096,
            context_length=127072,
            quality_rating=3
        ),
        "qwen/qwen-2-72b-instruct": ModelInfo(
            id="qwen/qwen-2-72b-instruct",
            name="Qwen2 72B",
            description="Alibaba's large language model with multilingual capabilities",
            tier="advanced",
            cost_per_1k_tokens=0.0004,
            max_tokens=4096,
            context_length=131072,
            quality_rating=4
        ),
        "cohere/command-r-plus": ModelInfo(
            id="cohere/command-r-plus",
            name="Command R+",
            description="Cohere's enterprise model with strong reasoning capabilities",
            tier="advanced",
            cost_per_1k_tokens=0.003,
            max_tokens=4096,
            context_length=128000,
            quality_rating=4
        )
    }
    
    def __init__(self, api_key: Optional[str] = None, default_model: str = "anthropic/claude-3.5-sonnet"):
        """
        Initialize OpenRouter provider.
        
        Args:
            api_key: OpenRouter API key (if None, reads from environment)
            default_model: Default model to use
        """
        self.api_key = api_key or os.getenv('OPENROUTER_API_KEY')
        if not self.api_key:
            raise ValueError("OpenRouter API key is required. Set OPENROUTER_API_KEY environment variable or pass api_key parameter.")
        
        self.default_model = default_model
        self.site_url = os.getenv('OPENROUTER_SITE_URL', 'https://chaotic-adventures.cory7593.workers.dev')
        self.app_name = os.getenv('OPENROUTER_APP_NAME', 'Chaotic Adventures')
        
        # Initialize OpenAI client configured for OpenRouter
        self.client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=self.api_key,
            default_headers={
                "HTTP-Referer": self.site_url,
                "X-Title": self.app_name,
            }
        )
        
        # Usage tracking
        self.total_tokens_used = 0
        self.total_cost = 0.0
        self.request_count = 0
        self.model_usage = {}
        
        logger.info(f"OpenRouter provider initialized with default model: {default_model}")
    
    def get_available_models(self) -> List[ModelInfo]:
        """Get list of available models."""
        return list(self.AVAILABLE_MODELS.values())
    
    def get_model_info(self, model_id: str) -> Optional[ModelInfo]:
        """Get information about a specific model."""
        return self.AVAILABLE_MODELS.get(model_id)
    
    def get_models_by_tier(self, tier: str) -> List[ModelInfo]:
        """Get models filtered by tier."""
        return [model for model in self.AVAILABLE_MODELS.values() if model.tier == tier]
    
    def get_best_model_for_budget(self, max_cost_per_1k: float) -> Optional[ModelInfo]:
        """Get the best quality model within budget."""
        affordable_models = [
            model for model in self.AVAILABLE_MODELS.values() 
            if model.cost_per_1k_tokens <= max_cost_per_1k
        ]
        
        if not affordable_models:
            return None
        
        # Return highest quality model within budget
        return max(affordable_models, key=lambda m: m.quality_rating)
    
    def estimate_cost(self, prompt: str, model_id: Optional[str] = None) -> float:
        """Estimate cost for generating response to prompt."""
        model_info = self.get_model_info(model_id or self.default_model)
        if not model_info:
            return 0.0
        
        # Rough token estimation (actual usage may vary)
        estimated_prompt_tokens = len(prompt.split()) * 1.3  # Rough approximation
        estimated_response_tokens = 200  # Average response length
        total_tokens = estimated_prompt_tokens + estimated_response_tokens
        
        return (total_tokens / 1000) * model_info.cost_per_1k_tokens
    
    def generate(self, 
                prompt: str, 
                model: Optional[str] = None,
                max_tokens: Optional[int] = None,
                temperature: float = 0.8,
                top_p: float = 0.95,
                **kwargs) -> str:
        """
        Generate text using OpenRouter.
        
        Args:
            prompt: The input prompt
            model: Model to use (defaults to default_model)
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature
            top_p: Nucleus sampling parameter
            **kwargs: Additional parameters
            
        Returns:
            Generated text response
            
        Raises:
            Exception: If generation fails
        """
        # Sanitize input
        prompt = sanitize_llm_input(prompt)
        
        # Select model
        model_id = model or self.default_model
        model_info = self.get_model_info(model_id)
        
        if not model_info:
            raise ValueError(f"Unknown model: {model_id}")
        
        # Set max tokens if not provided
        if max_tokens is None:
            max_tokens = min(1000, model_info.max_tokens // 2)  # Conservative default
        
        try:
            start_time = time.time()
            
            # Make API request
            response = self.client.chat.completions.create(
                model=model_id,
                messages=[
                    {
                        "role": "system", 
                        "content": "You are a creative storyteller for 'Chaotic Adventures', a humorous text-based adventure game. Generate engaging, slightly absurd, and entertaining narrative responses that advance the story in unexpected ways."
                    },
                    {"role": "user", "content": prompt}
                ],
                max_tokens=max_tokens,
                temperature=temperature,
                top_p=top_p,
                **kwargs
            )
            
            # Extract response
            generated_text = response.choices[0].message.content.strip()
            
            # Update usage statistics
            usage = response.usage
            if usage:
                tokens_used = usage.total_tokens
                cost = (tokens_used / 1000) * model_info.cost_per_1k_tokens
                
                self.total_tokens_used += tokens_used
                self.total_cost += cost
                self.request_count += 1
                
                if model_id not in self.model_usage:
                    self.model_usage[model_id] = {
                        'requests': 0,
                        'tokens': 0,
                        'cost': 0.0
                    }
                
                self.model_usage[model_id]['requests'] += 1
                self.model_usage[model_id]['tokens'] += tokens_used
                self.model_usage[model_id]['cost'] += cost
                
                end_time = time.time()
                response_time = end_time - start_time
                
                logger.info(f"OpenRouter generation completed: model={model_id}, tokens={tokens_used}, cost=${cost:.4f}, time={response_time:.2f}s")
            
            return generated_text
            
        except Exception as e:
            logger.error(f"OpenRouter generation failed: {e}")
            raise Exception(f"Failed to generate response with OpenRouter: {str(e)}")
    
    def get_usage_stats(self) -> Dict[str, Any]:
        """Get usage statistics."""
        return {
            'total_requests': self.request_count,
            'total_tokens': self.total_tokens_used,
            'total_cost': round(self.total_cost, 4),
            'average_cost_per_request': round(self.total_cost / max(1, self.request_count), 4),
            'model_usage': self.model_usage
        }
    
    def reset_usage_stats(self):
        """Reset usage statistics."""
        self.total_tokens_used = 0
        self.total_cost = 0.0
        self.request_count = 0
        self.model_usage = {}
        logger.info("Usage statistics reset")
    
    def get_tier_info(self) -> Dict[str, Any]:
        """Get information about current tier and available models."""
        current_model = self.get_model_info(self.default_model)
        return {
            'current_model': {
                'id': current_model.id,
                'name': current_model.name,
                'tier': current_model.tier,
                'quality': current_model.quality_rating,
                'cost_per_1k': current_model.cost_per_1k_tokens
            },
            'available_tiers': {
                'enhanced': len(self.get_models_by_tier('enhanced')),
                'advanced': len(self.get_models_by_tier('advanced')),
                'master': len(self.get_models_by_tier('master'))
            },
            'total_models': len(self.AVAILABLE_MODELS)
        }
    
    def switch_model(self, model_id: str) -> bool:
        """
        Switch to a different model.
        
        Args:
            model_id: ID of the model to switch to
            
        Returns:
            True if switch was successful
        """
        if model_id not in self.AVAILABLE_MODELS:
            logger.warning(f"Attempted to switch to unknown model: {model_id}")
            return False
        
        old_model = self.default_model
        self.default_model = model_id
        logger.info(f"Switched model from {old_model} to {model_id}")
        return True
    
    def get_recommended_model(self, 
                            complexity: str = "balanced",
                            budget_limit: Optional[float] = None) -> ModelInfo:
        """
        Get recommended model based on requirements.
        
        Args:
            complexity: "simple", "balanced", or "complex"
            budget_limit: Maximum cost per 1k tokens
            
        Returns:
            Recommended model info
        """
        available_models = list(self.AVAILABLE_MODELS.values())
        
        # Filter by budget if specified
        if budget_limit:
            available_models = [m for m in available_models if m.cost_per_1k_tokens <= budget_limit]
        
        if not available_models:
            # Return cheapest model if budget too restrictive
            return min(self.AVAILABLE_MODELS.values(), key=lambda m: m.cost_per_1k_tokens)
        
        # Select based on complexity
        if complexity == "simple":
            # Prefer faster, cheaper models
            return min(available_models, key=lambda m: (m.cost_per_1k_tokens, -m.quality_rating))
        elif complexity == "complex":
            # Prefer highest quality models
            return max(available_models, key=lambda m: m.quality_rating)
        else:  # balanced
            # Balance cost and quality
            def score(model):
                # Higher quality is better, lower cost is better
                return model.quality_rating - (model.cost_per_1k_tokens * 1000)
            
            return max(available_models, key=score)


# Convenience function for easy integration
def create_openrouter_provider(api_key: Optional[str] = None, 
                             model: str = "anthropic/claude-3.5-sonnet") -> OpenRouterProvider:
    """Create and return an OpenRouter provider instance."""
    return OpenRouterProvider(api_key=api_key, default_model=model)


# Test function
def test_openrouter_connection(api_key: Optional[str] = None) -> bool:
    """Test OpenRouter connection and return True if successful."""
    try:
        provider = OpenRouterProvider(api_key=api_key)
        response = provider.generate("Say 'Hello from OpenRouter!' in a creative way.", max_tokens=50)
        return len(response) > 0
    except Exception as e:
        logger.error(f"OpenRouter connection test failed: {e}")
        return False


if __name__ == "__main__":
    # Simple test if run directly
    import sys
    
    if test_openrouter_connection():
        print("✅ OpenRouter connection successful!")
        
        provider = create_openrouter_provider()
        print(f"\nAvailable models: {len(provider.get_available_models())}")
        print(f"Default model: {provider.default_model}")
        print(f"Usage stats: {provider.get_usage_stats()}")
    else:
        print("❌ OpenRouter connection failed!")
        print("Make sure OPENROUTER_API_KEY environment variable is set")
        sys.exit(1)