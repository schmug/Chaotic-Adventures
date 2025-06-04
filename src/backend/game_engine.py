#!/usr/bin/env python3
"""
Game engine for Chaotic Adventures.
Handles core game logic, state management, and narrative flow.
"""

import json
import random
import os
import time
from typing import Dict, List, Optional, Any
from datetime import datetime

from .llm_interface import LLMInterface
from .enhanced_llm_interface import EnhancedLLMInterface, LLMProviderType, create_openrouter_interface, create_mock_interface
from .prompts.templates import get_prompt


class GameEngine:
    """
    Core game engine that manages game state and narrative progression.
    """
    
    # Directory for storing memory of past adventures
    MEMORY_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'adventure_memories')
    
    def __init__(self, llm_provider: str = "openrouter", llm_model: Optional[str] = None, api_key: Optional[str] = None):
        """Initialize the game engine with default state."""
        # Initialize LLM with enhanced interface
        try:
            if llm_provider == "openrouter":
                self.llm = create_openrouter_interface(api_key=api_key, tier="enhanced", model=llm_model)
            elif llm_provider == "mock":
                self.llm = create_mock_interface(tier="enhanced")
            else:
                # Fallback to enhanced interface with mock
                self.llm = create_mock_interface(tier="enhanced")
        except Exception as e:
            print(f"Failed to initialize {llm_provider} LLM, falling back to mock: {e}")
            self.llm = create_mock_interface(tier="enhanced")
        self.state = {
            "player_name": "",
            "current_location": "",
            "inventory": [],
            "story_events": [],
            "chaos_level": 5,  # Scale of 1-10
            "buffs": [],       # Narrative modifiers that affect the story
            "memorable_elements": [],  # Notable elements from this adventure
            "past_memories": [],  # Memories from past adventures
            "game_id": f"adv_{int(time.time())}",  # Unique identifier for this adventure
            "start_time": datetime.now().isoformat(),
            "model_tier": "basic",  # Current narrative model tier
            "model_upgrade_points": 0,  # Points toward next model upgrade
            "upgrades_available": 0,    # Available model upgrades
        }
        self.choices = []
        
        # Create memory directory if it doesn't exist
        os.makedirs(self.MEMORY_DIR, exist_ok=True)
        
        # Load past memories
        self._load_past_memories()
        
        # Set up model tier
        self._set_model_tier("basic")
        
        # Available buffs with their effects
        self.available_buffs = {
            "poetic": {
                "description": "Makes the narrative more poetic and flowery",
                "duration": 3,  # Number of turns it lasts
            },
            "noir": {
                "description": "Adds a detective noir style to the narrative",
                "duration": 2,
            },
            "musical": {
                "description": "Characters occasionally break into song",
                "duration": 2,
            },
            "dramatic": {
                "description": "Adds dramatic flair and over-the-top reactions",
                "duration": 3,
            },
            "cosmic": {
                "description": "Introduces cosmic and existential elements",
                "duration": 2,
            },
            "ghostly": {
                "description": "Adds supernatural and ghostly elements",
                "duration": 3,
            },
            "miniature": {
                "description": "Everything becomes tiny and adorable",
                "duration": 2,
            },
            "gigantic": {
                "description": "Everything becomes enormous and imposing",
                "duration": 2,
            },
            "time_loop": {
                "description": "Creates minor time loops and déjà vu moments",
                "duration": 3,
            },
            "shakespearean": {
                "description": "Characters speak in Shakespearean English",
                "duration": 2,
            },
        }
        
    def _set_model_tier(self, tier: str) -> None:
        """
        Set the model tier and update the LLM interface.
        
        Args:
            tier: The model tier to set
        """
        # Update the model tier in state
        self.state["model_tier"] = tier
        
        # Update the LLM interface
        if isinstance(self.llm, LLMInterface):
            # Create a new LLM interface with the specified tier
            self.llm = LLMInterface(tier=tier)
    
    def add_upgrade_points(self, points: int = 1) -> int:
        """
        Add points toward model upgrades.
        
        Args:
            points: Number of points to add
            
        Returns:
            Total upgrade points
        """
        # Define points needed for each tier upgrade
        upgrade_thresholds = {
            "basic": 5,      # 5 points to upgrade from basic to enhanced
            "enhanced": 10,  # 10 points to upgrade from enhanced to advanced
            "advanced": 15   # 15 points to upgrade from advanced to master
        }
        
        # Get current tier and points
        current_tier = self.state["model_tier"]
        current_points = self.state["model_upgrade_points"]
        
        # Add points
        new_points = current_points + points
        self.state["model_upgrade_points"] = new_points
        
        # Check if we've reached threshold for an upgrade
        if current_tier in upgrade_thresholds:
            threshold = upgrade_thresholds[current_tier]
            if new_points >= threshold:
                # Reset points and add an available upgrade
                self.state["model_upgrade_points"] = new_points - threshold
                self.state["upgrades_available"] += 1
                
                # Add event to story
                self.state["story_events"].append({
                    "type": "upgrade_available",
                    "tier": current_tier,
                    "next_tier": self._get_next_tier(current_tier)
                })
        
        return new_points
    
    def _get_next_tier(self, current_tier: str) -> Optional[str]:
        """
        Get the next tier after the current one.
        
        Args:
            current_tier: Current model tier
            
        Returns:
            Next tier or None if at highest
        """
        tier_progression = ["basic", "enhanced", "advanced", "master"]
        
        try:
            current_index = tier_progression.index(current_tier)
            if current_index < len(tier_progression) - 1:
                return tier_progression[current_index + 1]
        except ValueError:
            pass
            
        return None
        
    def _get_points_needed_for_upgrade(self) -> int:
        """
        Get the number of points needed for the next upgrade.
        
        Returns:
            Points needed
        """
        # Define points needed for each tier upgrade
        upgrade_thresholds = {
            "basic": 5,      # 5 points to upgrade from basic to enhanced
            "enhanced": 10,  # 10 points to upgrade from enhanced to advanced
            "advanced": 15   # 15 points to upgrade from advanced to master
        }
        
        current_tier = self.state["model_tier"]
        
        if current_tier in upgrade_thresholds:
            return upgrade_thresholds[current_tier]
        
        return 0  # Already at highest tier
    
    def upgrade_model(self) -> Dict[str, Any]:
        """
        Upgrade the model tier if upgrades are available.
        
        Returns:
            Dictionary with upgrade status and information
        """
        # Check if upgrades are available
        if self.state["upgrades_available"] <= 0:
            return {
                "success": False,
                "message": "No upgrades available",
                "current_tier": self.state["model_tier"]
            }
        
        # Get current tier and next tier
        current_tier = self.state["model_tier"]
        next_tier = self._get_next_tier(current_tier)
        
        # Check if there's a next tier available
        if not next_tier:
            return {
                "success": False,
                "message": "Already at highest tier",
                "current_tier": current_tier
            }
        
        # Apply the upgrade
        self._set_model_tier(next_tier)
        self.state["upgrades_available"] -= 1
        
        # Add event to story
        self.state["story_events"].append({
            "type": "model_upgraded",
            "old_tier": current_tier,
            "new_tier": next_tier
        })
        
        # Get tier info
        tier_info = self.llm.get_current_tier_info()
        
        return {
            "success": True,
            "message": f"Upgraded from {current_tier} to {next_tier}",
            "old_tier": current_tier,
            "current_tier": next_tier,
            "tier_info": tier_info
        }
    
    def get_model_tier_info(self) -> Dict[str, Any]:
        """
        Get information about the current model tier.
        
        Returns:
            Dictionary with model tier information
        """
        return {
            "tier": self.state["model_tier"],
            "upgrade_points": self.state["model_upgrade_points"],
            "upgrades_available": self.state["upgrades_available"],
            "tier_info": self.llm.get_current_tier_info(),
            "available_tiers": self.llm.get_available_tiers()
        }
        
    def start_game(self, player_name: str, chaos_level: int = None) -> str:
        """
        Start a new game with the given player name.
        
        Args:
            player_name: The name of the player
            chaos_level: Optional chaos level (1-10)
            
        Returns:
            The introductory narrative
        """
        # Generate a new game ID
        self.state["game_id"] = f"adv_{int(time.time())}"
        self.state["start_time"] = datetime.now().isoformat()
        
        self.state["player_name"] = player_name
        
        # Set chaos level if provided
        if chaos_level is not None and 1 <= chaos_level <= 10:
            self.state["chaos_level"] = chaos_level
            # Update LLM interface with chaos level
            if hasattr(self.llm, 'set_chaos_level'):
                self.llm.set_chaos_level(self.state["chaos_level"])
        
        # Clear any existing buffs
        self.state["buffs"] = []
        
        # Clear story events and memorable elements
        self.state["story_events"] = []
        self.state["memorable_elements"] = []
        
        # Reset model tier to basic for new games
        self._set_model_tier("basic")
        self.state["model_upgrade_points"] = 0
        self.state["upgrades_available"] = 0
        
        # Reload past memories in case new ones have been added
        self._load_past_memories()
        
        # Format past memories for prompt context
        past_memories_text = ""
        if self.state["past_memories"]:
            memories_list = []
            for memory in self.state["past_memories"]:
                attribution = memory.get("attribution", {})
                memory_text = f"{memory.get('text', 'Unknown event')} (from {attribution.get('player_name', 'someone')}'s adventure)"
                memories_list.append(memory_text)
            
            if memories_list:
                past_memories_text = "Memories from past adventures:\n" + "\n".join([f"- {m}" for m in memories_list])
        
        # Generate starting scenario
        prompt = get_prompt("intro", {
            "player_name": player_name,
            "chaos_level": self.state["chaos_level"],
            "past_memories": past_memories_text
        })
        
        intro_text = self.llm.generate(prompt)
        self.state["story_events"].append({"type": "intro", "text": intro_text})
        
        # Generate initial choices
        self._generate_choices()
        
        return intro_text
    
    def add_buff(self, buff_name: str) -> bool:
        """
        Add a narrative buff to the game state.
        
        Args:
            buff_name: The name of the buff to add
            
        Returns:
            Success status
        """
        # First try to add the buff through the new LLM modifier system
        if hasattr(self.llm, 'add_modifier'):
            modifier = self.llm.add_modifier(buff_name)
            if modifier:
                # Add to story events
                self.state["story_events"].append({
                    "type": "buff_added",
                    "buff": modifier.name,
                    "description": modifier.description
                })
                
                # For backward compatibility
                buff_for_state = {
                    "name": modifier.name,
                    "description": modifier.description,
                    "duration": modifier.duration,
                    "turns_remaining": modifier.turns_remaining
                }
                self.state["buffs"].append(buff_for_state)
                
                return True
        
        # Fall back to the old system if necessary
        if buff_name not in self.available_buffs:
            return False
            
        # Get the buff details
        buff = self.available_buffs[buff_name].copy()
        buff["name"] = buff_name
        buff["turns_remaining"] = buff["duration"]
        
        # Add to active buffs
        self.state["buffs"].append(buff)
        
        # Record in story events
        self.state["story_events"].append({
            "type": "buff_added",
            "buff": buff_name,
            "description": buff["description"]
        })
        
        return True
    
    def _update_buffs(self) -> list:
        """
        Update the status of active buffs, decrementing their duration
        and removing expired ones.
        
        Returns:
            List of buffs that expired this turn
        """
        # First update buffs through the new LLM modifier system
        if hasattr(self.llm, 'update_modifiers'):
            expired, remaining = self.llm.update_modifiers()
            
            # Record expired modifiers in story events
            for modifier_name in expired:
                self.state["story_events"].append({
                    "type": "buff_expired",
                    "buff": modifier_name
                })
            
            # For backward compatibility, also update the state buffs
            expired_buffs = []
            active_buffs = []
            
            for buff in self.state["buffs"]:
                buff["turns_remaining"] -= 1
                
                if buff["turns_remaining"] <= 0:
                    expired_buffs.append(buff)
                else:
                    active_buffs.append(buff)
            
            # Update the active buffs list
            self.state["buffs"] = active_buffs
            
            # Record expired buffs in story events
            for buff in expired_buffs:
                self.state["story_events"].append({
                    "type": "buff_expired",
                    "buff": buff["name"]
                })
                
            return expired_buffs
        
        # Fall back to the old system if necessary
        expired_buffs = []
        active_buffs = []
        
        for buff in self.state["buffs"]:
            buff["turns_remaining"] -= 1
            
            if buff["turns_remaining"] <= 0:
                expired_buffs.append(buff)
            else:
                active_buffs.append(buff)
        
        # Update the active buffs list
        self.state["buffs"] = active_buffs
        
        # Record expired buffs in story events
        for buff in expired_buffs:
            self.state["story_events"].append({
                "type": "buff_expired",
                "buff": buff["name"]
            })
            
        return expired_buffs
    
    def _get_active_buff_descriptions(self) -> str:
        """
        Get descriptions of currently active buffs for prompts.
        
        Returns:
            String describing active buffs for LLM context
        """
        # First try to get active modifiers from the new LLM modifier system
        if hasattr(self.llm, 'get_active_modifiers'):
            active_modifiers = self.llm.get_active_modifiers()
            if active_modifiers:
                descriptions = []
                for modifier in active_modifiers:
                    descriptions.append(f"{modifier['name']}: {modifier['description']}")
                return "Active narrative effects:\n" + "\n".join(descriptions)
        
        # Fall back to the old system if necessary
        if not self.state["buffs"]:
            return "No special narrative effects active."
            
        descriptions = []
        for buff in self.state["buffs"]:
            descriptions.append(f"{buff['name']}: {buff['description']}")
            
        return "Active narrative effects:\n" + "\n".join(descriptions)
    
    def make_choice(self, choice_index: int) -> dict:
        """
        Process the player's choice and advance the game state.
        
        Args:
            choice_index: The index of the choice made
            
        Returns:
            Dictionary containing the narrative response and game state information
        """
        if not 0 <= choice_index < len(self.choices):
            return {"text": "Invalid choice. Please try again.", "game_over": False}
        
        selected_choice = self.choices[choice_index]
        
        # Update and get expired buffs
        expired_buffs = self._update_buffs()
        
        # Get active buff descriptions for the prompt
        active_buffs = self._get_active_buff_descriptions()
        
        # Determine if we should include a past memory (20% chance, only if we have memories)
        include_memory = random.random() < 0.2 and bool(self.state["past_memories"])
        memory_reference = ""
        self.last_used_memory = None
        
        if include_memory:
            # Select a random memory to include
            memory = random.choice(self.state["past_memories"])
            attribution = memory.get("attribution", {})
            memory_text = memory.get("text", "")
            player_name = attribution.get("player_name", "someone")
            
            # Store the memory we're using for reference
            self.last_used_memory = memory
            
            memory_reference = f"""
            Reference this memory from a past adventure in your response:
            {memory_text} (from {player_name}'s adventure)
            """
        
        # Random chance (10%) for a choice to lead to game over
        game_over = random.random() < 0.10
        
        # Generate response to the choice
        prompt = get_prompt("choice_response", {
            "player_name": self.state["player_name"],
            "choice": selected_choice,
            "previous_events": self.state["story_events"][-3:],
            "chaos_level": self.state["chaos_level"],
            "active_buffs": active_buffs,
            "memory_reference": memory_reference,
            "game_over": "true" if game_over else "false"
        })
        
        response_text = self.llm.generate(prompt)
        self.state["story_events"].append({
            "type": "player_choice", 
            "choice": selected_choice,
            "response": response_text,
            "game_over": game_over
        })
        
        # If game is over, we don't need to add chaotic events or generate new choices
        if game_over:
            # Add a message indicating game over
            game_over_message = "\n\n🔚 GAME OVER 🔚\nYour adventure has come to an unexpected end!"
            response_text += game_over_message
            
            # Return response with game_over flag
            return {"text": response_text, "game_over": True}
        
        # Maybe inject a random chaotic event
        if random.random() < 0.3:  # 30% chance
            # Temporarily store the memory that might be used in the chaotic event
            chaotic_memory = None
            if hasattr(self, 'last_chaotic_memory'):
                chaotic_memory = self.last_chaotic_memory
            
            chaotic_event = self._generate_chaotic_event()
            
            # Record which memory was used, if any
            if chaotic_memory:
                self.state["story_events"].append({
                    "type": "chaotic_event",
                    "text": chaotic_event,
                    "memory_reference": chaotic_memory
                })
            else:
                self.state["story_events"].append({
                    "type": "chaotic_event",
                    "text": chaotic_event
                })
                
            response_text += "\n\n" + chaotic_event
            
        # Try to add a random modifier using the new system
        if hasattr(self.llm, 'maybe_add_random_modifier'):
            new_modifier = self.llm.maybe_add_random_modifier()
            if new_modifier:
                buff_intro = f"\n\nNarrative Effect Activated: {new_modifier.name} - {new_modifier.description}!"
                response_text += buff_intro
                
                # Add to story events for tracking
                self.state["story_events"].append({
                    "type": "buff_added",
                    "buff": new_modifier.name,
                    "description": new_modifier.description
                })
                
                # For backward compatibility
                buff_for_state = {
                    "name": new_modifier.name,
                    "description": new_modifier.description,
                    "duration": new_modifier.duration,
                    "turns_remaining": new_modifier.turns_remaining
                }
                self.state["buffs"].append(buff_for_state)
        else:
            # Fall back to the old system
            # Random chance to add a new buff (10% chance)
            if random.random() < 0.1:
                available_buffs = list(self.available_buffs.keys())
                # Don't add buffs that are already active
                active_buff_names = [b["name"] for b in self.state["buffs"]]
                available_buffs = [b for b in available_buffs if b not in active_buff_names]
                
                if available_buffs:
                    new_buff = random.choice(available_buffs)
                    self.add_buff(new_buff)
                    buff_intro = f"\n\nNarrative Effect Activated: {new_buff.title()} - {self.available_buffs[new_buff]['description']}!"
                    response_text += buff_intro
        
        # Random chance to earn upgrade points (15% chance)
        if random.random() < 0.15:
            # Award 1-2 upgrade points
            points = random.randint(1, 2)
            total_points = self.add_upgrade_points(points)
            
            # If this resulted in an available upgrade, notify the player
            if self.state["upgrades_available"] > 0:
                current_tier = self.state["model_tier"]
                next_tier = self._get_next_tier(current_tier)
                
                upgrade_notification = f"\n\n🌟 Model Upgrade Available! 🌟\nYour narrative model can be upgraded from {current_tier.title()} to {next_tier.title()}."
                response_text += upgrade_notification
            else:
                # Just note the points earned
                point_notification = f"\n\n✨ You earned {points} model upgrade point{'s' if points > 1 else ''}! ({total_points}/{self._get_points_needed_for_upgrade()} needed for next upgrade)"
                response_text += point_notification
        
        # Generate new choices
        self._generate_choices()
        
        return {"text": response_text, "game_over": False}
    
    def get_choices(self) -> List[str]:
        """
        Get the current available choices.
        
        Returns:
            List of choice descriptions
        """
        return self.choices
    
    def _generate_choices(self) -> None:
        """Generate a new set of player choices."""
        active_buffs = self._get_active_buff_descriptions()
        
        # Occasionally include a memory-based choice (15% chance)
        memory_choice_hint = ""
        self.last_choice_memory = None
        
        if random.random() < 0.15 and self.state["past_memories"]:
            memory = random.choice(self.state["past_memories"])
            memory_text = memory.get("text", "")
            
            # Store the memory we're using
            self.last_choice_memory = memory
            
            memory_choice_hint = f"""
            IMPORTANT: Include one choice that references this memory from a past adventure:
            {memory_text}
            """
        
        prompt = get_prompt("generate_choices", {
            "player_name": self.state["player_name"],
            "previous_events": self.state["story_events"][-3:],
            "chaos_level": self.state["chaos_level"],
            "active_buffs": active_buffs,
            "memory_choice_hint": memory_choice_hint
        })
        
        choices_text = self.llm.generate(prompt)
        
        # Parse choices (assuming LLM returns numbered choices)
        try:
            # Simple parsing - could be improved with more robust parsing
            choices = [c.strip() for c in choices_text.split("\n") 
                      if c.strip() and not c.strip().startswith("Choice")]
            
            # Ensure we have 2-4 choices
            if len(choices) < 2:
                choices = ["Continue the adventure", "Try something else"]
            elif len(choices) > 4:
                choices = choices[:4]
                
            self.choices = choices
        except Exception:
            # Fallback options if parsing fails
            self.choices = ["Continue forward", "Take another path", 
                           "Do something unexpected"]
    
    def _generate_chaotic_event(self) -> str:
        """
        Generate a random chaotic event to inject into the story.
        
        Returns:
            Text description of the chaotic event
        """
        active_buffs = self._get_active_buff_descriptions()
        
        # Occasionally reference a past memory in a chaotic event (25% chance if memories exist)
        memory_chaotic_event = ""
        self.last_chaotic_memory = None
        
        if random.random() < 0.25 and self.state["past_memories"]:
            memory = random.choice(self.state["past_memories"])
            attribution = memory.get("attribution", {})
            memory_text = memory.get("text", "")
            player_name = attribution.get("player_name", "someone")
            
            # Store the memory we're using
            self.last_chaotic_memory = memory
            
            memory_chaotic_event = f"""
            IMPORTANT: Your chaotic event should incorporate this element from a past adventure:
            {memory_text} (from {player_name}'s adventure)
            """
        
        prompt = get_prompt("chaotic_event", {
            "player_name": self.state["player_name"],
            "previous_events": self.state["story_events"][-3:],
            "chaos_level": self.state["chaos_level"],
            "active_buffs": active_buffs,
            "memory_chaotic_event": memory_chaotic_event
        })
        
        return self.llm.generate(prompt)
    
    def _load_past_memories(self) -> None:
        """
        Load memories from past adventures.
        Reads all memory files in the memory directory and loads a
        random selection of memorable elements.
        """
        self.state["past_memories"] = []
        
        # Get all memory files
        memory_files = []
        try:
            memory_files = [f for f in os.listdir(self.MEMORY_DIR) 
                           if f.endswith('.json') and os.path.isfile(os.path.join(self.MEMORY_DIR, f))]
        except Exception as e:
            print(f"Error loading memory files: {e}")
            return
        
        # If no memory files exist, return empty
        if not memory_files:
            return
        
        # Load up to 3 random memory files
        selected_files = random.sample(memory_files, min(3, len(memory_files)))
        
        for filename in selected_files:
            try:
                with open(os.path.join(self.MEMORY_DIR, filename), 'r') as f:
                    memory_data = json.load(f)
                    
                    # Add memory info with attribution to original adventure
                    if "memorable_elements" in memory_data and isinstance(memory_data["memorable_elements"], list):
                        # Take up to 2 random memories from each adventure
                        elements = memory_data["memorable_elements"]
                        if elements:
                            # Create attribution information
                            attribution = {
                                "player_name": memory_data.get("player_name", "Unknown Adventurer"),
                                "adventure_id": memory_data.get("game_id", "unknown"),
                                "date": memory_data.get("end_time", "unknown time")
                            }
                            
                            # Select random elements
                            selected_elements = random.sample(elements, min(2, len(elements)))
                            
                            # Add each element with attribution
                            for element in selected_elements:
                                if isinstance(element, dict) and "text" in element:
                                    memory = element.copy()
                                    memory["attribution"] = attribution
                                    self.state["past_memories"].append(memory)
            except Exception as e:
                print(f"Error loading memory file {filename}: {e}")
                continue
        
        # Shuffle the memories for more variety
        random.shuffle(self.state["past_memories"])
        
        # Cap the total number of memories
        self.state["past_memories"] = self.state["past_memories"][:5]
    
    def _extract_memorable_elements(self) -> None:
        """
        Extract memorable elements from the current adventure using the LLM.
        This creates persistent memories that can appear in future adventures.
        """
        # Prepare a list of significant events from this adventure
        significant_events = []
        
        # Add introduction
        for event in self.state["story_events"]:
            if event.get("type") == "intro":
                significant_events.append({
                    "type": "intro",
                    "text": event.get("text", "")
                })
                break
        
        # Add player choices and responses (sample for long adventures)
        choice_events = [e for e in self.state["story_events"] if e.get("type") == "player_choice"]
        selected_choices = choice_events
        if len(choice_events) > 3:
            # Pick first, last, and a random middle one for variety
            selected_choices = [choice_events[0], 
                               random.choice(choice_events[1:-1]) if len(choice_events) > 2 else None,
                               choice_events[-1]]
            selected_choices = [c for c in selected_choices if c is not None]
        
        for event in selected_choices:
            significant_events.append({
                "type": "player_choice",
                "choice": event.get("choice", ""),
                "response": event.get("response", "")
            })
        
        # Add chaotic events
        chaotic_events = [e for e in self.state["story_events"] if e.get("type") == "chaotic_event"]
        if chaotic_events:
            # Pick up to 2 random chaotic events
            selected_events = random.sample(chaotic_events, min(2, len(chaotic_events)))
            for event in selected_events:
                significant_events.append({
                    "type": "chaotic_event",
                    "text": event.get("text", "")
                })
        
        # Prepare the prompt to extract memorable elements
        prompt = get_prompt("extract_memories", {
            "player_name": self.state["player_name"],
            "significant_events": significant_events,
            "chaos_level": self.state["chaos_level"]
        })
        
        # Get memorable elements from the LLM
        memory_text = self.llm.generate(prompt)
        
        # Parse the memory elements (expecting numbered list items)
        memory_elements = []
        
        # Basic parsing by line splits
        lines = memory_text.split('\n')
        current_memory = ""
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Check for numbered list items
            if line[0].isdigit() and '. ' in line[:4]:
                # Save previous memory if exists
                if current_memory:
                    memory_elements.append({"text": current_memory, "type": "memory"})
                # Start new memory
                current_memory = line[line.find('. ')+2:]
            else:
                # Continue current memory
                if current_memory:
                    current_memory += " " + line
        
        # Add final memory if exists
        if current_memory:
            memory_elements.append({"text": current_memory, "type": "memory"})
        
        # If parsing failed or returned nothing, create a single generic memory
        if not memory_elements:
            memory_elements.append({
                "text": f"{self.state['player_name']} had an adventure with chaos level {self.state['chaos_level']}.",
                "type": "fallback_memory"
            })
        
        # Update state with extracted memories
        self.state["memorable_elements"] = memory_elements
    
    def _save_adventure_memory(self) -> bool:
        """
        Save this adventure's memorable elements to a memory file.
        
        Returns:
            Success status
        """
        # Extract memorable elements if not already done
        if not self.state["memorable_elements"]:
            self._extract_memorable_elements()
        
        # Add end time to state
        self.state["end_time"] = datetime.now().isoformat()
        
        # Prepare memory data - include only what's needed
        memory_data = {
            "game_id": self.state["game_id"],
            "player_name": self.state["player_name"],
            "chaos_level": self.state["chaos_level"],
            "memorable_elements": self.state["memorable_elements"],
            "start_time": self.state["start_time"],
            "end_time": self.state["end_time"]
        }
        
        try:
            # Create filename from game ID
            filename = f"{self.state['game_id']}.json"
            file_path = os.path.join(self.MEMORY_DIR, filename)
            
            # Write memory to file
            with open(file_path, 'w') as f:
                json.dump(memory_data, f, indent=2)
            
            return True
        except Exception as e:
            print(f"Error saving adventure memory: {e}")
            return False
            
    def generate_summary(self, game_over: bool = False, final_choice: str = None) -> str:
        """
        Generate a humorous summary of the adventure.
        
        Args:
            game_over: Whether the game ended due to player loss/death
            final_choice: The final choice that led to game over
            
        Returns:
            Summary text of the adventure
        """
        # Get list of all buffs encountered during this adventure
        encountered_buffs = []
        for event in self.state["story_events"]:
            if event.get("type") == "buff_added":
                buff_name = event.get("buff")
                if buff_name and buff_name not in encountered_buffs:
                    encountered_buffs.append(buff_name)
        
        # Format the list of encountered buffs
        if encountered_buffs:
            buffs_text = "Narrative effects encountered: " + ", ".join(encountered_buffs)
        else:
            buffs_text = "No special narrative effects were encountered."
        
        # Extract memorable elements and save memory before generating summary
        self._extract_memorable_elements()
        self._save_adventure_memory()
        
        if game_over:
            # Use the game over summary template
            prompt = get_prompt("game_over_summary", {
                "player_name": self.state["player_name"],
                "story_events": self.state["story_events"],
                "final_choice": final_choice or "Unknown choice",
                "chaos_level": self.state["chaos_level"],
                "encountered_buffs": buffs_text
            })
        else:
            # Use the regular adventure summary template
            prompt = get_prompt("adventure_summary", {
                "player_name": self.state["player_name"],
                "story_events": self.state["story_events"],
                "chaos_level": self.state["chaos_level"],
                "encountered_buffs": buffs_text
            })
        
        return self.llm.generate(prompt)
    
    def save_game(self, filename: str) -> bool:
        """
        Save the current game state to a file.
        
        Args:
            filename: Path to save the game
            
        Returns:
            Success status
        """
        try:
            with open(filename, 'w') as f:
                json.dump(self.state, f)
            return True
        except Exception:
            return False
    
    def load_game(self, filename: str) -> bool:
        """
        Load a game state from a file.
        
        Args:
            filename: Path to the saved game
            
        Returns:
            Success status
        """
        try:
            with open(filename, 'r') as f:
                self.state = json.load(f)
            self._generate_choices()
            return True
        except Exception:
            return False


if __name__ == "__main__":
    # Simple CLI for testing
    engine = GameEngine()
    
    print("Welcome to Chaotic Adventures!")
    player_name = input("Enter your name: ")
    
    intro = engine.start_game(player_name)
    print("\n" + intro + "\n")
    
    while True:
        print("\nChoices:")
        for i, choice in enumerate(engine.get_choices()):
            print(f"{i+1}. {choice}")
        
        choice_input = input("\nEnter your choice (or 'q' to quit): ")
        
        if choice_input.lower() == 'q':
            print("\nThanks for playing!")
            
            # Generate and show summary
            print("\n=== YOUR ADVENTURE SUMMARY ===")
            summary = engine.generate_summary()
            print(summary)
            break
        
        try:
            choice_index = int(choice_input) - 1
            response = engine.make_choice(choice_index)
            print("\n" + response)
        except (ValueError, IndexError):
            print("Invalid choice. Please try again.")