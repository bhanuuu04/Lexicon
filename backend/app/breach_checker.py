"""Feature re-export for backward compatibility."""
from backend.app.features.breach_dictionary.service import BreachChecker, breach_checker

__all__ = ["BreachChecker", "breach_checker"]
