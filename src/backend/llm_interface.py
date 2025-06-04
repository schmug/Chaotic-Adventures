#!/usr/bin/env python3
"""
LLM Interface for Chaotic Adventures.
Handles communication with local LLM models.
"""

import os
import requests
import random
from typing import Dict, Any, List, Optional, Tuple
from .validation import sanitize_llm_input

# Narrative modifiers ("buffs/debuffs")
class NarrativeModifier:
    """Represents a narrative modifier that affects LLM generation."""
    
    def __init__(self, name: str, description: str, 
                 prompt_modifier: str, is_buff: bool = True,
                 duration: int = 3, strength: float = 1.0):
        """
        Initialize a narrative modifier.
        
        Args:
            name: Unique name of the modifier
            description: Description of the modifier's effect
            prompt_modifier: Text to add to prompts
            is_buff: Whether this is a positive (buff) or negative (debuff) modifier
            duration: Number of turns this modifier lasts
            strength: Modifier strength (0.5-2.0)
        """
        self.name = name
        self.description = description
        self.prompt_modifier = prompt_modifier
        self.is_buff = is_buff
        self.duration = duration
        self.strength = min(max(strength, 0.5), 2.0)
        self.turns_remaining = duration
    
    def apply_to_prompt(self, prompt: str) -> str:
        """Apply this modifier to a prompt."""
        modified_prompt = f"{prompt}\n\n{self.prompt_modifier}"
        return modified_prompt
    
    def decrement_duration(self) -> bool:
        """
        Decrement the remaining duration.
        
        Returns:
            True if the modifier is still active, False if expired
        """
        self.turns_remaining -= 1
        return self.turns_remaining > 0
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            "name": self.name,
            "description": self.description,
            "prompt_modifier": self.prompt_modifier,
            "is_buff": self.is_buff,
            "duration": self.duration,
            "strength": self.strength,
            "turns_remaining": self.turns_remaining
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "NarrativeModifier":
        """Create a modifier from dictionary data."""
        modifier = cls(
            name=data["name"],
            description=data["description"],
            prompt_modifier=data["prompt_modifier"],
            is_buff=data["is_buff"],
            duration=data["duration"],
            strength=data["strength"]
        )
        modifier.turns_remaining = data["turns_remaining"]
        return modifier


# Predefined narrative modifiers
NARRATIVE_MODIFIERS = {
    # Buffs (positive modifiers)
    "poetic_inspiration": NarrativeModifier(
        name="Poetic Inspiration",
        description="Makes the narrative more poetic and flowery",
        prompt_modifier="Use more poetic and flowery language in your response. Include vivid imagery and metaphors.",
        is_buff=True,
        duration=3,
        strength=1.2
    ),
    "cosmic_insight": NarrativeModifier(
        name="Cosmic Insight",
        description="Adds philosophical and existential elements",
        prompt_modifier="Include philosophical musings and existential questions in your response.",
        is_buff=True,
        duration=2,
        strength=1.3
    ),
    "humorous_twist": NarrativeModifier(
        name="Humorous Twist",
        description="Makes the narrative funnier and more absurd",
        prompt_modifier="Make your response even more humorous and absurd. Include unexpected jokes and silly situations.",
        is_buff=True,
        duration=3,
        strength=1.5
    ),
    "vivid_scenery": NarrativeModifier(
        name="Vivid Scenery",
        description="Enhances environmental descriptions",
        prompt_modifier="Include more detailed and vivid descriptions of the surroundings and environment.",
        is_buff=True,
        duration=2,
        strength=1.2
    ),
    "character_depth": NarrativeModifier(
        name="Character Depth",
        description="Adds more personality to characters",
        prompt_modifier="Give any characters in the story more personality, quirks, and detailed characteristics.",
        is_buff=True,
        duration=3,
        strength=1.3
    ),
    "narrative_focus": NarrativeModifier(
        name="Narrative Focus",
        description="Makes the story more cohesive and focused",
        prompt_modifier="Make the narrative more focused, with better pacing and a clearer plot direction.",
        is_buff=True,
        duration=4,
        strength=1.1
    ),
    
    # Debuffs (negative modifiers)
    "confused_narrator": NarrativeModifier(
        name="Confused Narrator",
        description="Makes the narrative slightly confused and disjointed",
        prompt_modifier="Make the narrator slightly confused about what's happening. Include some contradictions or uncertainty.",
        is_buff=False,
        duration=2,
        strength=1.2
    ),
    "verbose_tangents": NarrativeModifier(
        name="Verbose Tangents",
        description="Causes the narrative to go on tangents",
        prompt_modifier="Include irrelevant tangents and overly verbose descriptions in your response.",
        is_buff=False,
        duration=2,
        strength=1.3
    ),
    "mundane_focus": NarrativeModifier(
        name="Mundane Focus",
        description="Focuses on boring and mundane details",
        prompt_modifier="Focus on exceedingly mundane and unimportant details for at least part of your response.",
        is_buff=False,
        duration=1,
        strength=1.1
    ),
    "unreliable_narrator": NarrativeModifier(
        name="Unreliable Narrator",
        description="Makes the narrator unreliable and inconsistent",
        prompt_modifier="Make the narrator slightly unreliable. Contradict previous details or question if events actually happened.",
        is_buff=False,
        duration=3,
        strength=1.4
    ),
    "time_distortion": NarrativeModifier(
        name="Time Distortion",
        description="Mixes up the order of events",
        prompt_modifier="Present events in a slightly non-chronological order, with some confusion about what happened when.",
        is_buff=False,
        duration=2,
        strength=1.2
    ),
    "sensory_overload": NarrativeModifier(
        name="Sensory Overload",
        description="Overwhelms the narrative with sensory details",
        prompt_modifier="Overload the narrative with excessive sensory details that distract from the main events.",
        is_buff=False,
        duration=2,
        strength=1.3
    )
}


class LLMInterface:
    """Interface for communicating with local LLM models."""
    
    # Model tiers with their configurations
    MODEL_TIERS = {
        "basic": {
            "description": "Basic narrative model with standard capabilities",
            "model_name": "llama3",
            "max_tokens": 800,
            "temperature": 0.7,
            "top_p": 0.9,
            "frequency_penalty": 0.0,
            "presence_penalty": 0.0
        },
        "enhanced": {
            "description": "Enhanced narrative model with improved creativity",
            "model_name": "llama3",
            "max_tokens": 1000,
            "temperature": 0.8,
            "top_p": 0.92,
            "frequency_penalty": 0.1,
            "presence_penalty": 0.1
        },
        "advanced": {
            "description": "Advanced narrative model with superior storytelling",
            "model_name": "llama3",
            "max_tokens": 1200,
            "temperature": 0.85,
            "top_p": 0.95,
            "frequency_penalty": 0.2,
            "presence_penalty": 0.2
        },
        "master": {
            "description": "Master storyteller with exceptional narrative skills",
            "model_name": "llama3",
            "max_tokens": 1500,
            "temperature": 0.9,
            "top_p": 0.98,
            "frequency_penalty": 0.3,
            "presence_penalty": 0.3
        }
    }
    
    def __init__(self, model_name: str = "llama3", tier: str = "basic"):
        """
        Initialize the LLM interface.
        
        Args:
            model_name: Name of the model to use
            tier: Model tier (basic, enhanced, advanced, master)
        """
        self.api_url = os.environ.get("LLM_API_URL", "http://localhost:11434/api/generate")
        
        # Set default tier if provided tier is invalid
        if tier not in self.MODEL_TIERS:
            tier = "basic"
            
        self.tier = tier
        self.model_name = model_name
        
        # Active narrative modifiers
        self.active_modifiers: List[NarrativeModifier] = []
        
        # Chaos level affects modifier application
        self.chaos_level = 5
        
        # Apply tier settings
        self._apply_tier_settings(tier)
        
    def _apply_tier_settings(self, tier: str) -> None:
        """
        Apply settings from the selected model tier.
        
        Args:
            tier: The tier to apply
        """
        if tier not in self.MODEL_TIERS:
            tier = "basic"
            
        tier_config = self.MODEL_TIERS[tier]
        self.model_name = tier_config.get("model_name", self.model_name)
        self.max_tokens = tier_config.get("max_tokens", 1000)
        self.temperature = tier_config.get("temperature", 0.8)
        self.top_p = tier_config.get("top_p", 0.9)
        self.frequency_penalty = tier_config.get("frequency_penalty", 0.0)
        self.presence_penalty = tier_config.get("presence_penalty", 0.0)
    
    def upgrade_tier(self, new_tier: str) -> bool:
        """
        Upgrade the model to a new tier.
        
        Args:
            new_tier: The new tier to use
            
        Returns:
            Success status
        """
        if new_tier not in self.MODEL_TIERS:
            return False
            
        # Don't downgrade
        current_tier_keys = list(self.MODEL_TIERS.keys())
        current_tier_index = current_tier_keys.index(self.tier)
        new_tier_index = current_tier_keys.index(new_tier)
        
        if new_tier_index <= current_tier_index:
            return False
            
        # Apply the new tier settings
        self._apply_tier_settings(new_tier)
        self.tier = new_tier
        return True
    
    def get_current_tier_info(self) -> Dict[str, Any]:
        """
        Get information about the current model tier.
        
        Returns:
            Dictionary with tier information
        """
        tier_info = self.MODEL_TIERS.get(self.tier, {}).copy()
        tier_info["tier"] = self.tier
        return tier_info
    
    def get_available_tiers(self) -> Dict[str, Dict[str, Any]]:
        """
        Get information about all available tiers.
        
        Returns:
            Dictionary of tier information
        """
        return self.MODEL_TIERS.copy()
    
    def set_chaos_level(self, level: int) -> None:
        """
        Set the chaos level which affects modifier frequency and strength.
        
        Args:
            level: Chaos level (1-10)
        """
        self.chaos_level = max(1, min(level, 10))
    
    def add_modifier(self, modifier_key: str) -> Optional[NarrativeModifier]:
        """
        Add a specific modifier to the active modifiers.
        
        Args:
            modifier_key: Key of the modifier to add
            
        Returns:
            The added modifier or None if not found
        """
        if modifier_key not in NARRATIVE_MODIFIERS:
            return None
            
        # Create a copy of the modifier
        modifier = NARRATIVE_MODIFIERS[modifier_key]
        new_modifier = NarrativeModifier(
            name=modifier.name,
            description=modifier.description,
            prompt_modifier=modifier.prompt_modifier,
            is_buff=modifier.is_buff,
            duration=modifier.duration,
            strength=modifier.strength
        )
        
        self.active_modifiers.append(new_modifier)
        return new_modifier
    
    def add_random_modifier(self, buff_chance: float = 0.6) -> Optional[NarrativeModifier]:
        """
        Add a random narrative modifier.
        
        Args:
            buff_chance: Chance of getting a buff vs. debuff
            
        Returns:
            The added modifier
        """
        # Split modifiers into buffs and debuffs
        buffs = [k for k, v in NARRATIVE_MODIFIERS.items() if v.is_buff]
        debuffs = [k for k, v in NARRATIVE_MODIFIERS.items() if not v.is_buff]
        
        # Determine if this will be a buff or debuff
        is_buff = random.random() < buff_chance
        
        # Select from the appropriate list
        modifier_key = random.choice(buffs if is_buff else debuffs)
        return self.add_modifier(modifier_key)
    
    def maybe_add_random_modifier(self) -> Optional[NarrativeModifier]:
        """
        Maybe add a random modifier based on chaos level.
        
        Returns:
            The added modifier or None if no modifier was added
        """
        # Base chance is 10%, increasing with chaos level
        base_chance = 0.1
        chaos_factor = self.chaos_level / 10.0
        chance = base_chance + (chaos_factor * 0.3)  # Max 40% at chaos 10
        
        # Buff vs debuff chance is affected by chaos
        buff_chance = 0.8 - (chaos_factor * 0.4)  # 80% at chaos 1, 40% at chaos 10
        
        if random.random() < chance:
            return self.add_random_modifier(buff_chance)
        return None
    
    def get_active_modifiers(self) -> List[Dict[str, Any]]:
        """
        Get information about all active modifiers.
        
        Returns:
            List of modifier information dictionaries
        """
        return [modifier.to_dict() for modifier in self.active_modifiers]
    
    def update_modifiers(self) -> Tuple[List[str], List[str]]:
        """
        Update modifiers, decrementing duration and removing expired ones.
        
        Returns:
            Tuple of (expired_modifier_names, remaining_modifier_names)
        """
        expired = []
        remaining = []
        
        # Update each modifier and collect expired ones
        updated_modifiers = []
        for modifier in self.active_modifiers:
            if modifier.decrement_duration():
                updated_modifiers.append(modifier)
                remaining.append(modifier.name)
            else:
                expired.append(modifier.name)
        
        # Replace the list with only active modifiers
        self.active_modifiers = updated_modifiers
        
        return expired, remaining
    
    def _apply_modifiers_to_prompt(self, prompt: str) -> str:
        """
        Apply all active modifiers to a prompt.
        
        Args:
            prompt: Original prompt
            
        Returns:
            Modified prompt
        """
        if not self.active_modifiers:
            return prompt
            
        modified_prompt = prompt
        for modifier in self.active_modifiers:
            modified_prompt = modifier.apply_to_prompt(modified_prompt)
        
        return modified_prompt
    
    def _apply_modifiers_to_generation_params(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Apply modifier effects to generation parameters.
        
        Args:
            params: Original parameters
            
        Returns:
            Modified parameters
        """
        if not self.active_modifiers:
            return params
        
        # Copy the params to avoid modifying the original
        modified_params = params.copy()
        
        # Apply modifier effects
        for modifier in self.active_modifiers:
            # Buffs increase creativity (temperature, top_p)
            # Debuffs increase repetition penalty
            if modifier.is_buff:
                # Scale effect by strength
                temp_boost = 0.05 * modifier.strength
                modified_params["temperature"] = min(0.99, modified_params.get("temperature", 0.7) + temp_boost)
                
                top_p_boost = 0.02 * modifier.strength
                modified_params["top_p"] = min(0.99, modified_params.get("top_p", 0.9) + top_p_boost)
            else:
                # For debuffs, we might increase penalties slightly
                penalty_boost = 0.05 * modifier.strength
                modified_params["frequency_penalty"] = min(0.9, modified_params.get("frequency_penalty", 0.0) + penalty_boost)
        
        return modified_params
            
    def generate(self, prompt: str) -> str:
        """
        Generate text from the LLM based on the prompt.
        
        Args:
            prompt: The prompt to send to the LLM
            
        Returns:
            Generated text response
        """
        try:
            # Sanitize the input prompt for security
            sanitized_prompt = sanitize_llm_input(prompt)
            
            # Apply any active modifiers to the prompt
            modified_prompt = self._apply_modifiers_to_prompt(sanitized_prompt)
            
            # Set up generation parameters
            generation_params = {
                "temperature": self.temperature,
                "max_tokens": self.max_tokens,
                "top_p": self.top_p,
                "frequency_penalty": self.frequency_penalty,
                "presence_penalty": self.presence_penalty
            }
            
            # Apply modifier effects to generation parameters
            modified_params = self._apply_modifiers_to_generation_params(generation_params)
            
            # For local development/testing without a real LLM,
            # we can return mock responses
            if os.environ.get("MOCK_LLM", "false").lower() == "true":
                return self._mock_response(modified_prompt)
            
            # Real LLM request using Ollama API
            response = requests.post(
                self.api_url,
                json={
                    "model": self.model_name,
                    "prompt": modified_prompt,
                    "stream": False,
                    "options": modified_params
                },
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                return result.get("response", "")
            else:
                print(f"Error from LLM API: {response.status_code}")
                return self._fallback_response(prompt)
                
        except Exception as e:
            print(f"Error communicating with LLM: {str(e)}")
            return self._fallback_response(prompt)
    
    def _mock_response(self, prompt: str) -> str:
        """
        Generate a mock response for testing without a real LLM.
        
        Args:
            prompt: The original prompt
            
        Returns:
            A mock response
        """
        # Get response based on tier and prompt type
        response_tier = {
            "basic": self._get_basic_mock_response,
            "enhanced": self._get_enhanced_mock_response,
            "advanced": self._get_advanced_mock_response,
            "master": self._get_master_mock_response
        }.get(self.tier, self._get_basic_mock_response)
        
        return response_tier(prompt)
    
    def _get_basic_mock_response(self, prompt: str) -> str:
        """Generate a basic tier mock response."""
        # Basic responses are simple and direct
        if "intro" in prompt.lower():
            return ("Welcome to the Whimsical Woods! The trees whisper your name as you enter, "
                   "and strange mushrooms glow along the path. Something tells you this won't "
                   "be an ordinary adventure.")
        
        elif "generate_choices" in prompt.lower():
            return ("1. Follow the path deeper into the woods\n"
                   "2. Examine the glowing mushrooms\n"
                   "3. Call out to see if anyone responds")
        
        elif "choice_response" in prompt.lower():
            return ("You decide to explore further. As you walk, the mushrooms seem to "
                   "follow your movements with an eerie glow. The forest feels alive "
                   "around you, watching and waiting.")
        
        elif "chaotic_event" in prompt.lower():
            return ("Suddenly, a burst of colorful butterflies erupts from a nearby bush, "
                   "swirling around you in a dizzying pattern before disappearing into the trees.")
        
        elif "adventure_summary" in prompt.lower():
            return ("You explored the Whimsical Woods, encountered some strange phenomena, "
                   "and made it back with quite a tale to tell. The locals might not believe "
                   "your story, but you know what you experienced was real.")
        
        else:
            return ("Something unexpected happens, breaking the normal flow of events.")
    
    def _get_enhanced_mock_response(self, prompt: str) -> str:
        """Generate an enhanced tier mock response."""
        # Enhanced responses add more detail and creativity
        if "intro" in prompt.lower():
            return ("Welcome to the Whimsical Woods, a place where logic takes a backseat "
                   "and chaos reigns supreme! As you step into the forest, the trees seem "
                   "to whisper your name, occasionally mispronouncing it in increasingly "
                   "ridiculous ways. The path ahead splits in three directions, and you notice "
                   "a squirrel wearing tiny spectacles studying a miniature map nearby.")
        
        elif "generate_choices" in prompt.lower():
            return ("1. Follow the glowing mushrooms deeper into the woods\n"
                   "2. Climb the nearest tree to get a better view\n"
                   "3. Strike up a conversation with a suspiciously articulate squirrel\n"
                   "4. Examine the peculiar purple flowers that seem to be humming")
        
        elif "choice_response" in prompt.lower():
            return ("As you decide to follow the glowing mushrooms, they suddenly uproot "
                   "themselves and begin to dance in formation, leading you deeper into "
                   "the forest. The mushrooms perform an impressive choreographed routine "
                   "complete with jazz hands. They seem to be leading you toward a clearing "
                   "where something sparkles in the dappled sunlight.")
        
        elif "chaotic_event" in prompt.lower():
            return ("Suddenly, the sky turns neon purple and it begins to rain tiny "
                   "rubber ducks. One lands on your shoulder and whispers stock tips "
                   "into your ear before dissolving into maple syrup. Nearby trees "
                   "seem both amused and embarrassed by this meteorological outburst.")
        
        elif "adventure_summary" in prompt.lower():
            return ("In what can only be described as the most peculiar Tuesday afternoon "
                   "of your life, you journeyed through the Whimsical Woods, befriended "
                   "sentient mushrooms, received financial advice from rubber ducks, and "
                   "somehow ended up with maple syrup in your hair. The local wildlife "
                   "rated your adventure 5/5 stars, 'Would watch this human get confused again.'")
        
        else:
            return ("The universe hiccups and something unexpected happens. You're not "
                   "quite sure what it means, but it definitely means something, and it "
                   "leaves a slight taste of cinnamon in the air.")
    
    def _get_advanced_mock_response(self, prompt: str) -> str:
        """Generate an advanced tier mock response."""
        # Advanced responses are more complex and nuanced with vivid imagery
        if "intro" in prompt.lower():
            return ("Welcome to the Whimsical Woods, where reality is more suggestion than law! "
                   "As you step between the threshold trees—ancient sentinels with bark like "
                   "wrinkled faces—the very air around you seems to sparkle with mischievous "
                   "intent. Your name echoes through the canopy, carried by unseen voices that "
                   "pronounce it with increasingly creative interpretations, each one making "
                   "the leaves shiver with barely-contained laughter. The path before you splits "
                   "into three winding ways, each beckoning with its own mysterious promises. "
                   "Nearby, perched on a toadstool of impossible proportions, a gray squirrel "
                   "adjusts its miniature spectacles and consults a map made of what appears to "
                   "be pressed flower petals and morning dew. It glances up, fixing you with "
                   "an unmistakably intelligent gaze.")
        
        elif "generate_choices" in prompt.lower():
            return ("1. Follow the phosphorescent mushrooms that seem to be performing a silent waltz deeper into the woods\n"
                   "2. Scale the twisting oak tree whose branches seem to rearrange themselves invitingly as you look up\n"
                   "3. Engage the bespectacled squirrel in conversation about its intriguing botanical cartography\n"
                   "4. Investigate the brook that flows uphill, occasionally pausing to tie itself into elegant knots")
        
        elif "choice_response" in prompt.lower():
            return ("As you approach the dancing mushrooms, they freeze momentarily—like performers "
                   "caught in an unexpected spotlight—before erupting into a more elaborate routine, "
                   "clearly delighted by their audience of one. Each fungus uproots itself with a tiny "
                   "pop, their mycelium networks forming delicate, fiber-optic-like tendrils beneath them. "
                   "They begin an intricate choreography, forming patterns that seem almost mathematical "
                   "in their precision: fractals, spirals, and impossible geometries that leave brief "
                   "afterimages floating in your vision. Their bioluminescence intensifies with each "
                   "complex movement, casting your path in an ethereal blue-green glow that renders the "
                   "forest both familiar and alien. They're leading you purposefully now, toward a clearing "
                   "where something crystalline catches the fragmented light, sending prisms dancing across "
                   "the forest floor.")
        
        elif "chaotic_event" in prompt.lower():
            return ("Without warning, the laws of meteorology surrender to absurdity as the sky "
                   "above transforms from placid blue to a swirling vortex of violet and indigo. "
                   "The clouds contort into impossible shapes, briefly resembling everyday objects—a "
                   "teapot, a bicycle, a disgruntled cat—before rupturing. From their kaleidoscopic "
                   "depths descends a shower of perfect, yellow rubber ducks, each the size of a "
                   "walnut and warm to the touch. One particularly determined waterfowl lands precisely "
                   "on your left shoulder, its tiny plastic eyes somehow conveying both wisdom and "
                   "mischief. It leans close to your ear and, in a voice like rustling stock certificates, "
                   "delivers an unexpectedly compelling argument for investing in underwater real estate "
                   "before liquefying into a puddle of grade-A maple syrup that smells faintly of "
                   "financial opportunity. Nearby, a grove of aspens collectively facepalm their leaves.")
        
        elif "adventure_summary" in prompt.lower():
            return ("In what future anthropologists will surely classify as the most extraordinary "
                   "Tuesday in recorded history, you navigated the metaphysical labyrinth of the "
                   "Whimsical Woods with a combination of bewildered grace and accidental courage. "
                   "You formed unlikely alliances with a troupe of fungi whose choreography defied "
                   "both gravity and conventional dance theory, received surprisingly sound investment "
                   "advice from precipitation with an MBA (Mallard Business Acumen), and experienced "
                   "no fewer than seventeen physical impossibilities before afternoon tea. Your hair, "
                   "now partially crystallized with maple syrup and lightly dusted with quantum "
                   "improbability particles, has become sentient enough to express mild opinions about "
                   "your fashion choices. The Woodland Cryptozoological Society has unanimously voted "
                   "your journey 'Most Likely To Require A New Branch Of Physics To Explain' and have "
                   "requested an interview at your earliest convenience—preferably before the laws of "
                   "reality reassert themselves fully.")
        
        else:
            return ("Reality stutters like an old film reel, and in that moment of cosmic "
                   "hesitation, something slips through the cracks between what is and what "
                   "could be. The experience defies straightforward description, yet leaves you "
                   "with the unsettling certainty that the universe just winked at you personally.")
    
    def _get_master_mock_response(self, prompt: str) -> str:
        """Generate a master tier mock response with exceptional quality."""
        # Master responses are the highest quality with complex structures and themes
        # They would be even more elaborate versions of the advanced responses
        # For brevity, we'll just extend the advanced responses slightly
        advanced_response = self._get_advanced_mock_response(prompt)
        
        # Add a philosophical or meta element for master tier
        if "intro" in prompt.lower():
            return advanced_response + "\n\nAs you consider your options, you can't help but wonder if you've been here before, in another story, another time. The forest seems to recognize you, like an old friend greeting you after a long absence. There's something strangely comforting in the chaos here—a reminder that not all who wander are truly lost; some are simply characters in a tale still being written."
        
        elif "choice_response" in prompt.lower():
            return advanced_response + "\n\nEach step feels like both a decision and a destiny—as if you're simultaneously creating and discovering this surreal narrative. The threads of possibility stretch before you, a tapestry of what-ifs and almost-weres, and you find yourself aware of your role as both protagonist and observer in this unfolding tale."
        
        elif "adventure_summary" in prompt.lower():
            return advanced_response + "\n\nPerhaps the most profound discovery of all was not what you found in the Whimsical Woods, but what the Woods found in you: a willingness to embrace the absurd, to dance with impossibility, and to find meaning in the meaningless. In a universe of infinite stories, you've written one worth telling—chaotic, beautiful, and entirely your own."
            
        # For other types, just return the advanced response
        return advanced_response
    
    def _fallback_response(self, prompt: str) -> str:
        """
        Generate a fallback response when the LLM fails.
        
        Args:
            prompt: The original prompt
            
        Returns:
            A fallback response
        """
        return ("Something strange happened and the narrator momentarily lost their train "
               "of thought. They clear their throat and continue with the story...")


# Simple test
if __name__ == "__main__":
    llm = LLMInterface()
    test_prompt = "Tell me a short, humorous story about a chaotic adventure."
    response = llm.generate(test_prompt)
    print(response)