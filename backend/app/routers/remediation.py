"""
Remediation Router - Backward compatibility re-export wrapper.
Main implementation moved to backend.app.features.remediation.
"""
from backend.app.features.remediation.router import router, get_remediation_report
from backend.app.features.remediation.service import generate_fallback_advisory_report

__all__ = ["router", "get_remediation_report", "generate_fallback_advisory_report"]

