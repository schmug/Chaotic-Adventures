#!/usr/bin/env python3
"""
Test script for OpenRouter integration.
Run this to verify OpenRouter is working before deploying.
"""

import os
import sys

# Add src to path
sys.path.append(os.path.dirname(__file__))

from src.backend.openrouter_provider import OpenRouterProvider, test_openrouter_connection
from src.backend.enhanced_llm_interface import create_openrouter_interface
from src.backend.game_engine import GameEngine


def test_basic_connection():
    """Test basic OpenRouter connection."""
    print("🔗 Testing OpenRouter connection...")
    
    api_key = os.getenv('OPENROUTER_API_KEY')
    if not api_key:
        print("❌ OPENROUTER_API_KEY environment variable not set")
        print("   Set your API key with: export OPENROUTER_API_KEY='your-key-here'")
        return False
    
    if test_openrouter_connection(api_key):
        print("✅ OpenRouter connection successful!")
        return True
    else:
        print("❌ OpenRouter connection failed!")
        return False


def test_provider_models():
    """Test OpenRouter provider model listing."""
    print("\n📋 Testing OpenRouter model listing...")
    
    try:
        provider = OpenRouterProvider()
        models = provider.get_available_models()
        
        print(f"✅ Found {len(models)} available models:")
        for model in models[:5]:  # Show first 5
            print(f"   • {model.name} ({model.id})")
            print(f"     Tier: {model.tier}, Quality: {model.quality_rating}⭐, Cost: ${model.cost_per_1k_tokens:.4f}/1K")
        
        if len(models) > 5:
            print(f"   ... and {len(models) - 5} more models")
        
        return True
    except Exception as e:
        print(f"❌ Failed to get models: {e}")
        return False


def test_text_generation():
    """Test actual text generation."""
    print("\n✨ Testing text generation...")
    
    try:
        interface = create_openrouter_interface(tier="enhanced")
        
        prompt = "Create a brief, humorous introduction for a chaotic adventure game where the player enters a whimsical forest."
        print(f"Prompt: {prompt[:50]}...")
        
        response = interface.generate(prompt)
        print(f"✅ Generated response ({len(response)} chars):")
        print(f"   {response[:200]}...")
        
        # Test usage stats
        if hasattr(interface.provider, 'get_usage_stats'):
            stats = interface.provider.get_usage_stats()
            print(f"📊 Usage stats: {stats['total_requests']} requests, ${stats['total_cost']:.4f} total cost")
        
        return True
    except Exception as e:
        print(f"❌ Text generation failed: {e}")
        return False


def test_game_engine_integration():
    """Test OpenRouter integration with game engine."""
    print("\n🎮 Testing game engine integration...")
    
    try:
        # Create game engine with OpenRouter
        game = GameEngine(llm_provider="openrouter")
        
        # Start a simple game
        intro = game.start_game("TestPlayer", chaos_level=7)
        print(f"✅ Game intro generated ({len(intro)} chars):")
        print(f"   {intro[:150]}...")
        
        # Test choices generation
        choices = game.get_choices()
        print(f"✅ Generated {len(choices)} choices:")
        for i, choice in enumerate(choices):
            print(f"   {i+1}. {choice}")
        
        return True
    except Exception as e:
        print(f"❌ Game engine integration failed: {e}")
        return False


def test_cost_estimation():
    """Test cost estimation features."""
    print("\n💰 Testing cost estimation...")
    
    try:
        provider = OpenRouterProvider()
        
        test_prompt = "Tell me a story about a magical adventure in a mysterious forest."
        cost = provider.estimate_cost(test_prompt)
        print(f"✅ Estimated cost for test prompt: ${cost:.4f}")
        
        # Test model recommendations
        budget_model = provider.get_best_model_for_budget(0.001)  # $0.001 per 1K tokens
        if budget_model:
            print(f"✅ Best model under $0.001/1K tokens: {budget_model.name}")
        
        recommended = provider.get_recommended_model("balanced", 0.002)
        print(f"✅ Recommended balanced model: {recommended.name}")
        
        return True
    except Exception as e:
        print(f"❌ Cost estimation failed: {e}")
        return False


def main():
    """Run all OpenRouter tests."""
    print("🚀 OpenRouter Integration Test Suite")
    print("=" * 50)
    
    tests = [
        ("Basic Connection", test_basic_connection),
        ("Model Listing", test_provider_models),
        ("Text Generation", test_text_generation),
        ("Game Engine Integration", test_game_engine_integration),
        ("Cost Estimation", test_cost_estimation)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        try:
            if test_func():
                passed += 1
            else:
                print(f"⚠️  {test_name} test had issues")
        except Exception as e:
            print(f"❌ {test_name} test crashed: {e}")
    
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! OpenRouter integration is ready.")
        print("\n🔧 Next steps:")
        print("   1. Update frontend to show OpenRouter option")
        print("   2. Add model selection UI")
        print("   3. Deploy with OPENROUTER_API_KEY environment variable")
        return True
    else:
        print("⚠️  Some tests failed. Check the errors above.")
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)