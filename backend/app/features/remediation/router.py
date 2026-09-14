import os
import json
from fastapi import APIRouter
import httpx

from backend.app.models import RemediationRequest, RemediationReport
from backend.app.config import GEMINI_API_KEY
from backend.app.features.remediation.service import generate_fallback_advisory_report

router = APIRouter(prefix="/api/remediation", tags=["remediation"])

@router.post("/report", response_model=RemediationReport)
async def get_remediation_report(req: RemediationRequest):
    """
    Generate structured remediation report from deterministic findings JSON.
    AI is advisory only and never alters calculated risk scores or tiers.
    """
    api_key = GEMINI_API_KEY or os.getenv("GEMINI_API_KEY")
    if api_key:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
            findings_json_str = json.dumps(req.model_dump(), indent=2)
            
            prompt = f"""
You are a Principal Cybersecurity Architect reviewing findings from Lexicon, an Enterprise Password Risk Intelligence Platform.
Analyze the following deterministic findings JSON from a 50,000-account Active Directory audit:

{findings_json_str}

Provide an actionable, authoritative enterprise remediation advisory.
Respond ONLY with a valid JSON object strictly matching this schema:
{{
  "executive_summary": "string",
  "risk_explanation": "string",
  "priority_accounts": [
    {{
      "username": "string",
      "role": "string",
      "department": "string",
      "risk_tier": "string",
      "immediate_action": "string",
      "recommended_policy": "string"
    }}
  ],
  "password_policy_recommendations": ["string"],
  "mfa_recommendations": ["string"],
  "org_blocklist_suggestions": ["string"],
  "remediation_priorities": ["string"]
}}
"""
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(
                    url,
                    json={"contents": [{"parts": [{"text": prompt}]}]},
                    headers={"Content-Type": "application/json"}
                )
                if resp.status_code == 200:
                    data = resp.json()
                    raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
                    clean_json = raw_text.strip()
                    if clean_json.startswith("```json"):
                        clean_json = clean_json[7:]
                    if clean_json.startswith("```"):
                        clean_json = clean_json[3:]
                    if clean_json.endswith("```"):
                        clean_json = clean_json[:-3]
                    parsed = json.loads(clean_json.strip())
                    return RemediationReport(**parsed)
        except Exception as e:
            print(f"[RemediationRouter] AI generation fallback triggered: {e}")

    return generate_fallback_advisory_report(req)
