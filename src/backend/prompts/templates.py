#!/usr/bin/env python3
"""
Prompt templates for Chaotic Adventures.
Contains templates for different narrative scenarios.
"""

from typing import Dict, Any


# Template dictionary with all prompt types
TEMPLATES = {
    "intro": """
    You are the narrator of a chaotic and unpredictable choose-your-own-adventure story.
    Create an engaging, humorous introduction for a new adventure.
    The player's name is {player_name}.
    Chaos level (1-10): {chaos_level} (higher means more absurd and unpredictable)
    
    {past_memories}
    
    Write a first-person narrative introduction that:
    1. Sets up an unusual, slightly absurd scenario
    2. Incorporates the player's name
    3. Hints at the chaotic nature of this world
    4. If past memories are provided above, subtly reference or incorporate at least one of them
    5. Ends at a point where the player needs to make a decision
    
    Keep it concise (150-200 words) and humorous. Don't include the choices.
    """,
    
    "extract_memories": """
    Extract memorable elements from this adventure that could be referenced in future adventures.
    These should be specific, memorable objects, characters, events, or locations that stood out.
    
    Player's name: {player_name}
    Key events from the adventure:
    {significant_events}
    Chaos level: {chaos_level}
    
    Identify 3-5 memorable elements from this adventure that:
    1. Are unique and distinctive enough to be recognizable if mentioned again
    2. Could appear in a different adventure (items, characters, unusual events, etc.)
    3. Have a touch of the absurd or unexpected
    4. Don't depend too much on the specific context of this adventure
    
    Format your response as a numbered list, with each item being a concise description (15-25 words)
    of the memorable element. Focus on concrete details rather than abstract concepts.
    """,
    
    "generate_choices": """
    Based on the current state of the adventure, generate 3-4 possible choices for the player.
    
    Player name: {player_name}
    Recent events: {previous_events}
    Chaos level (1-10): {chaos_level}
    {active_buffs}
    {memory_choice_hint}
    
    Create choices that:
    1. Follow logically from the current situation
    2. Include at least one unexpected or absurd option
    3. Provide meaningfully different paths forward
    4. Are concise (max 15 words each)
    5. Reflect any active narrative effects in their tone and content
    
    Format each choice as a numbered list item.
    """,
    
    "choice_response": """
    The player has made a choice in the adventure. Generate a narrative response.
    
    Player name: {player_name}
    Player's choice: {choice}
    Recent events: {previous_events}
    Chaos level (1-10): {chaos_level}
    {active_buffs}
    {memory_reference}
    Game over scenario: {game_over}
    
    Write a response that:
    1. Directly addresses the choice made
    2. Advances the story in an unexpected way
    3. Incorporates humor and surprises
    4. If a memory reference is provided above, weave it naturally into your response
    5. If game_over is "true", create a humorous but definitive end to the adventure where the player's choice leads to failure, defeat, or being trapped with no way forward
    6. If game_over is "false", ends at a point where new choices would make sense
    7. IMPORTANTLY: Adapt your writing style to match any active narrative effects listed above
    
    Keep it concise (100-150 words) and entertaining. Don't include new choices.
    """,
    
    "chaotic_event": """
    Generate a random chaotic event to inject into the current adventure.
    
    Player name: {player_name}
    Recent events: {previous_events}
    Chaos level (1-10): {chaos_level}
    {active_buffs}
    {memory_chaotic_event}
    
    Create an event that:
    1. Is unexpected and disrupts the current situation
    2. Has a surreal, absurd, or humorous quality
    3. Might introduce a new element to the story
    4. Doesn't completely derail the adventure's direction
    5. Incorporates the style of any active narrative effects
    6. If a memory element is specified above, cleverly incorporate it into your chaotic event
    
    Keep it concise (50-75 words) and make it feel like a sudden interruption.
    """,
    
    "adventure_summary": """
    The adventure has concluded. Generate a humorous summary of the player's journey.
    
    Player name: {player_name}
    Full adventure events: {story_events}
    Chaos level experienced: {chaos_level}
    {encountered_buffs}
    
    Create a summary that:
    1. Recaps the major beats of the adventure
    2. Highlights the most absurd moments
    3. Pokes gentle fun at the player's journey
    4. References the narrative effects that influenced the adventure
    5. Hints that this adventure's memories might influence future ones
    6. Has a satisfying conclusion
    
    Make it funny, self-aware, and between 100-200 words.
    """,
    
    "game_over_summary": """
    The adventure has ended unexpectedly. Generate a humorous game over summary.
    
    Player name: {player_name}
    Full adventure events: {story_events}
    Final choice that led to game over: {final_choice}
    Chaos level experienced: {chaos_level}
    {encountered_buffs}
    
    Create a game over summary that:
    1. Recaps the major moments of the adventure
    2. Focuses on the fateful final choice and its consequences
    3. Makes the failure entertaining and amusing
    4. Pokes gentle fun at how the player's journey came to an end
    5. References any narrative effects that were encountered
    6. Includes an encouraging note about trying again
    7. Has a definitive but humorous conclusion
    
    Make it funny, self-aware, and between 100-200 words.
    """
}


def get_prompt(prompt_type: str, variables: Dict[str, Any]) -> str:
    """
    Get a formatted prompt based on the prompt type and variables.
    
    Args:
        prompt_type: The type of prompt to retrieve
        variables: Dictionary of variables to format the prompt with
        
    Returns:
        The formatted prompt string
    """
    if prompt_type not in TEMPLATES:
        raise ValueError(f"Unknown prompt type: {prompt_type}")
        
    template = TEMPLATES[prompt_type]
    
    # Format template with provided variables
    try:
        # Handle previous_events specially if it's a list of events
        if "previous_events" in variables and isinstance(variables["previous_events"], list):
            events = variables["previous_events"]
            event_texts = []
            
            for event in events:
                if isinstance(event, dict):
                    # Extract text based on event type
                    if event.get("type") == "intro":
                        event_texts.append(f"Introduction: {event.get('text', '')}")
                    elif event.get("type") == "player_choice":
                        event_texts.append(f"Player chose: {event.get('choice', '')}")
                        event_texts.append(f"Result: {event.get('response', '')}")
                    elif event.get("type") == "chaotic_event":
                        event_texts.append(f"Chaotic event: {event.get('text', '')}")
                    else:
                        # Unknown event type, just add text if available
                        if "text" in event:
                            event_texts.append(event["text"])
                else:
                    # If event is just a string
                    event_texts.append(str(event))
            
            # Join all event texts
            variables = variables.copy()  # Create a copy to avoid modifying original
            variables["previous_events"] = "\n".join(event_texts)
        
        return template.format(**variables)
    except KeyError as e:
        # If a required variable is missing
        raise ValueError(f"Missing required variable for prompt '{prompt_type}': {e}")
    except Exception as e:
        # Any other formatting error
        raise ValueError(f"Error formatting prompt '{prompt_type}': {e}")


# For testing
if __name__ == "__main__":
    # Test the intro prompt
    test_variables = {
        "player_name": "Alex",
        "chaos_level": 7
    }
    
    intro_prompt = get_prompt("intro", test_variables)
    print("=== INTRO PROMPT ===")
    print(intro_prompt)
    
    # Test with a list of events
    test_events = [
        {"type": "intro", "text": "You found yourself in a strange forest."},
        {"type": "player_choice", "choice": "Follow the path", "response": "The path started glowing."}
    ]
    
    choice_variables = {
        "player_name": "Alex",
        "choice": "Investigate the glowing",
        "previous_events": test_events,
        "chaos_level": 7
    }
    
    choice_prompt = get_prompt("choice_response", choice_variables)
    print("\n=== CHOICE PROMPT ===")
    print(choice_prompt)