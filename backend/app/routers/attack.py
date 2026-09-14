"""
Attack Router - Backward compatibility re-export wrapper.
Main implementation moved to backend.app.features.attack_lab.
"""
from backend.app.features.attack_lab.router import router, record_attack_result

__all__ = ["router", "record_attack_result"]

