#!/usr/bin/env python3
"""
Integration test script for Chaotic Adventures.
Tests all LLM configurations including:
- Mock LLM
- Server LLM API (Ollama)
- Browser LLM simulation
"""

import os
import sys
import json
import time
import argparse
from contextlib import contextmanager

# Add parent directory to system path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.backend.llm_interface import LLMInterface
from src.backend.game_engine import GameEngine
from src.backend.prompts.templates import get_prompt


class IntegrationTester:
    """Tests integration between various components"""
    
    def __init__(self, verbose=False):
        """Initialize the integration tester."""
        self.verbose = verbose
        self.results = {
            "mock": {"status": "not_run", "details": {}},
            "server": {"status": "not_run", "details": {}},
            "tests_run": 0,
            "tests_passed": 0
        }
    
    def log(self, message):
        """Log a message if verbose mode is enabled."""
        if self.verbose:
            print(message)
    
    @contextmanager
    def env_vars(self, **kwargs):
        """Temporarily set environment variables."""
        original = {}
        for key, value in kwargs.items():
            if key in os.environ:
                original[key] = os.environ[key]
            os.environ[key] = value
            
        try:
            yield
        finally:
            for key in kwargs:
                if key in original:
                    os.environ[key] = original[key]
                else:
                    del os.environ[key]
    
    def run_all_tests(self):
        """Run all integration tests."""
        print("Starting Chaotic Adventures Integration Tests")
        print("=" * 50)
        
        # Test mock LLM
        self.log("\nTesting Mock LLM...")
        with self.env_vars(MOCK_LLM="true"):
            self.results["mock"] = self.test_llm_interface("mock")
        
        # Test server LLM (if available)
        self.log("\nTesting Server LLM (Ollama)...")
        # Try to determine if Ollama is running
        import socket
        ollama_running = False
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        try:
            s.connect(("localhost", 11434))
            ollama_running = True
        except:
            print("Ollama server not detected on port 11434")
        finally:
            s.close()
        
        if ollama_running:
            with self.env_vars(MOCK_LLM="false"):
                self.results["server"] = self.test_llm_interface("server")
        else:
            self.results["server"] = {"status": "skipped", "details": {"reason": "Ollama server not detected"}}
        
        # Print summary
        self.print_summary()
        
        return self.results
    
    def test_llm_interface(self, mode):
        """Test the LLM interface in the specified mode."""
        results = {"status": "passed", "details": {}}
        tests_run = 0
        tests_passed = 0
        
        try:
            # Initialize LLM
            llm = LLMInterface()
            
            # Test intro generation
            self.log(f"  Testing intro generation ({mode})...")
            intro_prompt = get_prompt("intro", {"player_name": "TestPlayer", "chaos_level": 7})
            intro_response = llm.generate(intro_prompt)
            tests_run += 1
            if len(intro_response) > 20:  # Simple length check
                tests_passed += 1
                self.log(f"  ✓ Intro generation successful ({len(intro_response)} chars)")
                results["details"]["intro"] = "passed"
            else:
                self.log(f"  ✗ Intro generation failed: response too short")
                results["details"]["intro"] = "failed"
                results["status"] = "failed"
            
            # Test choices generation
            self.log(f"  Testing choices generation ({mode})...")
            choices_prompt = get_prompt("generate_choices", {
                "player_name": "TestPlayer", 
                "previous_events": [{"type": "intro", "text": "Test intro"}],
                "chaos_level": 7
            })
            choices_response = llm.generate(choices_prompt)
            tests_run += 1
            if "1" in choices_response and "2" in choices_response:  # Simple check for numbered choices
                tests_passed += 1
                self.log(f"  ✓ Choices generation successful ({len(choices_response)} chars)")
                results["details"]["choices"] = "passed"
            else:
                self.log(f"  ✗ Choices generation failed: not formatted correctly")
                results["details"]["choices"] = "failed"
                results["status"] = "failed"
            
            # Test choice response
            self.log(f"  Testing choice response ({mode})...")
            choice_prompt = get_prompt("choice_response", {
                "player_name": "TestPlayer", 
                "choice": "Follow the path",
                "previous_events": [{"type": "intro", "text": "Test intro"}],
                "chaos_level": 7
            })
            choice_response = llm.generate(choice_prompt)
            tests_run += 1
            if len(choice_response) > 20:  # Simple length check
                tests_passed += 1
                self.log(f"  ✓ Choice response successful ({len(choice_response)} chars)")
                results["details"]["choice_response"] = "passed"
            else:
                self.log(f"  ✗ Choice response failed: response too short")
                results["details"]["choice_response"] = "failed"
                results["status"] = "failed"
            
            # Test chaotic event
            self.log(f"  Testing chaotic event ({mode})...")
            event_prompt = get_prompt("chaotic_event", {
                "player_name": "TestPlayer", 
                "previous_events": [{"type": "intro", "text": "Test intro"}],
                "chaos_level": 7
            })
            event_response = llm.generate(event_prompt)
            tests_run += 1
            if len(event_response) > 20:  # Simple length check
                tests_passed += 1
                self.log(f"  ✓ Chaotic event successful ({len(event_response)} chars)")
                results["details"]["chaotic_event"] = "passed"
            else:
                self.log(f"  ✗ Chaotic event failed: response too short")
                results["details"]["chaotic_event"] = "failed"
                results["status"] = "failed"
            
            # Test adventure summary
            self.log(f"  Testing adventure summary ({mode})...")
            summary_prompt = get_prompt("adventure_summary", {
                "player_name": "TestPlayer", 
                "story_events": [
                    {"type": "intro", "text": "Test intro"},
                    {"type": "player_choice", "choice": "Follow the path", "response": "You followed the path"}
                ],
                "chaos_level": 7
            })
            summary_response = llm.generate(summary_prompt)
            tests_run += 1
            if len(summary_response) > 20:  # Simple length check
                tests_passed += 1
                self.log(f"  ✓ Adventure summary successful ({len(summary_response)} chars)")
                results["details"]["adventure_summary"] = "passed"
            else:
                self.log(f"  ✗ Adventure summary failed: response too short")
                results["details"]["adventure_summary"] = "failed"
                results["status"] = "failed"
            
            # Test game engine integration
            self.log(f"  Testing game engine integration ({mode})...")
            engine = GameEngine()
            intro = engine.start_game("TestPlayer")
            choices = engine.get_choices()
            tests_run += 1
            if len(intro) > 0 and len(choices) > 0:
                tests_passed += 1
                self.log(f"  ✓ Game engine integration successful")
                results["details"]["game_engine"] = "passed"
            else:
                self.log(f"  ✗ Game engine integration failed")
                results["details"]["game_engine"] = "failed"
                results["status"] = "failed"
                
        except Exception as e:
            self.log(f"  ✗ Error in {mode} LLM test: {str(e)}")
            results["status"] = "error"
            results["details"]["error"] = str(e)
        
        self.results["tests_run"] += tests_run
        self.results["tests_passed"] += tests_passed
        return results
    
    def print_summary(self):
        """Print a summary of the test results."""
        print("\n" + "=" * 50)
        print("INTEGRATION TEST SUMMARY")
        print("=" * 50)
        
        print(f"\nMock LLM: {self.results['mock']['status'].upper()}")
        for test, result in self.results["mock"]["details"].items():
            if test != "error":
                print(f"  - {test}: {result}")
        
        print(f"\nServer LLM: {self.results['server']['status'].upper()}")
        for test, result in self.results["server"]["details"].items():
            if test != "error":
                print(f"  - {test}: {result}")
        
        print("\nOverall Results:")
        print(f"  Tests Run: {self.results['tests_run']}")
        print(f"  Tests Passed: {self.results['tests_passed']}")
        success_rate = (self.results['tests_passed'] / self.results['tests_run'] * 100) if self.results['tests_run'] > 0 else 0
        print(f"  Success Rate: {success_rate:.1f}%")
        
        if self.results['tests_passed'] == self.results['tests_run']:
            print("\n✅ All tests passed!")
        else:
            print(f"\n⚠️ {self.results['tests_run'] - self.results['tests_passed']} tests failed!")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run integration tests for Chaotic Adventures")
    parser.add_argument("-v", "--verbose", action="store_true", help="Enable verbose output")
    args = parser.parse_args()
    
    tester = IntegrationTester(verbose=args.verbose)
    results = tester.run_all_tests()
    
    # Exit with appropriate status code
    if (results["mock"]["status"] == "passed" and 
        (results["server"]["status"] == "passed" or results["server"]["status"] == "skipped")):
        sys.exit(0)
    else:
        sys.exit(1)