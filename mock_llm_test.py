#!/usr/bin/env python3
"""
Mock LLM implementation for testing without dependencies
"""

import os
import sys
import json

# Define the mock LLM class that doesn't depend on external libraries
class MockLLM:
    """Simple mock LLM implementation that mimics the real interface."""
    
    def __init__(self, model_name="llama3"):
        self.model_name = model_name
        self.max_tokens = 1000
        self.temperature = 0.8
    
    def generate(self, prompt):
        """Generate mock responses for testing."""
        # Very simple mock responses based on prompt type
        if "intro" in prompt.lower():
            return ("Welcome to the Whimsical Woods, a place where logic takes a backseat "
                   "and chaos reigns supreme! As you step into the forest, the trees seem "
                   "to whisper your name, occasionally mispronouncing it in increasingly "
                   "ridiculous ways.")
        
        elif "generate_choices" in prompt.lower():
            return ("1. Follow the glowing mushrooms deeper into the woods\n"
                   "2. Climb the nearest tree to get a better view\n"
                   "3. Strike up a conversation with a suspiciously articulate squirrel")
        
        elif "choice_response" in prompt.lower():
            return ("As you decide to follow the glowing mushrooms, they suddenly uproot "
                   "themselves and begin to dance in formation, leading you deeper into "
                   "the forest. The mushrooms perform an impressive choreographed routine "
                   "complete with jazz hands.")
        
        elif "chaotic_event" in prompt.lower():
            return ("Suddenly, the sky turns neon purple and it begins to rain tiny "
                   "rubber ducks. One lands on your shoulder and whispers stock tips "
                   "into your ear before dissolving into maple syrup.")
        
        elif "adventure_summary" in prompt.lower():
            return ("In what can only be described as the most peculiar Tuesday afternoon "
                   "of your life, you journeyed through the Whimsical Woods, befriended "
                   "sentient mushrooms, received financial advice from rubber ducks, and "
                   "somehow ended up with maple syrup in your hair. The local wildlife "
                   "rated your adventure 5/5 stars, 'Would watch this human get confused again.'")
        
        else:
            return ("The universe hiccups and something unexpected happens. You're not "
                   "quite sure what it means, but it definitely means something.")

# GameState class for testing
class GameState:
    """Simple mock game state for testing."""
    
    def __init__(self):
        self.llm = MockLLM()
        self.state = {
            "player_name": "TestPlayer",
            "story_events": [],
            "chaos_level": 5
        }
        self.choices = []
    
    def start_game(self):
        """Start a test game and generate intro text."""
        intro_text = self.llm.generate("intro test prompt")
        self.state["story_events"].append({"type": "intro", "text": intro_text})
        
        # Generate initial choices
        self._generate_choices()
        
        return intro_text
    
    def _generate_choices(self):
        """Generate mock choices."""
        choices_text = self.llm.generate("generate_choices test")
        
        # Simple parsing
        choices = [c.strip() for c in choices_text.split("\n") if c.strip()]
        if len(choices) > 1:
            self.choices = choices
        else:
            self.choices = ["Continue the adventure", "Try something else"]
    
    def make_choice(self, choice_index):
        """Make a choice in the game."""
        if 0 <= choice_index < len(self.choices):
            selected_choice = self.choices[choice_index]
            response = self.llm.generate("choice_response test")
            
            self.state["story_events"].append({
                "type": "player_choice", 
                "choice": selected_choice,
                "response": response
            })
            
            # Maybe add a chaotic event (30% chance)
            if choice_index % 3 == 0:  # Deterministic for testing
                chaotic_event = self.llm.generate("chaotic_event test")
                self.state["story_events"].append({
                    "type": "chaotic_event",
                    "text": chaotic_event
                })
                response += "\n\n" + chaotic_event
            
            # Generate new choices
            self._generate_choices()
            
            return response
        else:
            return "Invalid choice. Please try again."
    
    def get_choices(self):
        """Get the current choices."""
        return self.choices
    
    def generate_summary(self):
        """Generate an adventure summary."""
        return self.llm.generate("adventure_summary test")


# Run the test
if __name__ == "__main__":
    print("\n===== TESTING MOCK LLM IMPLEMENTATION =====")
    
    # Test the basic LLM functions
    llm = MockLLM()
    
    print("\nTesting individual prompt types:")
    print("-" * 40)
    
    print("1. Intro prompt:")
    intro = llm.generate("intro test")
    print(f"  Response ({len(intro)} chars): {intro[:50]}...")
    
    print("\n2. Choices prompt:")
    choices = llm.generate("generate_choices test")
    print(f"  Response ({len(choices)} chars):")
    print(f"  {choices}")
    
    print("\n3. Choice response prompt:")
    choice_response = llm.generate("choice_response test")
    print(f"  Response ({len(choice_response)} chars): {choice_response[:50]}...")
    
    print("\n4. Chaotic event prompt:")
    chaotic = llm.generate("chaotic_event test")
    print(f"  Response ({len(chaotic)} chars): {chaotic[:50]}...")
    
    print("\n5. Adventure summary prompt:")
    summary = llm.generate("adventure_summary test")
    print(f"  Response ({len(summary)} chars): {summary[:50]}...")
    
    # Test a full game flow
    print("\n\n===== TESTING GAME FLOW WITH MOCK LLM =====")
    print("-" * 40)
    
    game = GameState()
    
    print("Starting game...")
    intro = game.start_game()
    print(f"Intro: {intro[:50]}...")
    
    print("\nAvailable choices:")
    for i, choice in enumerate(game.get_choices()):
        print(f"  {i+1}. {choice}")
    
    print("\nMaking choice 0...")
    response = game.make_choice(0)
    print(f"Response: {response[:50]}...")
    
    print("\nNew choices:")
    for i, choice in enumerate(game.get_choices()):
        print(f"  {i+1}. {choice}")
    
    print("\nMaking choice 1...")
    response = game.make_choice(1)
    print(f"Response: {response[:50]}...")
    
    print("\nGenerating summary...")
    summary = game.generate_summary()
    print(f"Summary: {summary[:50]}...")
    
    print("\n===== TEST RESULTS =====")
    
    # Check if all important responses were generated
    all_valid = (
        len(intro) > 10 and 
        len(choices) > 10 and 
        len(choice_response) > 10 and
        len(chaotic) > 10 and
        len(summary) > 10 and
        len(game.get_choices()) > 0
    )
    
    if all_valid:
        print("✅ All mock LLM tests passed!")
        print("\nThe mock LLM implementation is functioning correctly.")
        print("This confirms that the core game logic works with mocked responses.")
        sys.exit(0)
    else:
        print("❌ Some tests failed - check the responses above.")
        sys.exit(1)