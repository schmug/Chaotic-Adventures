#!/usr/bin/env python3
"""
Version information for Chaotic Adventures.
"""

# Version numbering scheme:
# major.minor.patch
# - major: Major redesigns or architectural changes
# - minor: New features or significant improvements
# - patch: Bug fixes and small enhancements

__version__ = "1.3.2"

def get_version():
    """Return the current version string."""
    return __version__

def increment_version(level="patch"):
    """
    Increment the version number at the specified level.
    
    Args:
        level: The level to increment ("major", "minor", or "patch")
        
    Returns:
        The new version string
    """
    global __version__
    major, minor, patch = map(int, __version__.split("."))
    
    if level == "major":
        major += 1
        minor = 0
        patch = 0
    elif level == "minor":
        minor += 1
        patch = 0
    elif level == "patch":
        patch += 1
    else:
        raise ValueError(f"Invalid version level: {level}")
    
    __version__ = f"{major}.{minor}.{patch}"
    return __version__

def get_version_info():
    """
    Get the version information as a dictionary.
    
    Returns:
        Dictionary containing version components
    """
    major, minor, patch = map(int, __version__.split("."))
    return {
        "version": __version__,
        "major": major,
        "minor": minor,
        "patch": patch
    }