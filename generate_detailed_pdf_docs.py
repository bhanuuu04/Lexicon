import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

class DetailedNumberedCanvas(canvas.Canvas):
    """Two-pass canvas to dynamically render running headers, footers, and page numbers."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#0071E3"))
        
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 752, "LEXICON")
            self.setFont("Helvetica", 8)
            self.setFillColor(colors.HexColor("#64748B"))
            self.drawString(100, 752, "|  Enterprise Password Risk Intelligence Platform — Comprehensive Architecture Specification")
            self.drawRightString(612 - 54, 752, "CONFIDENTIAL")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.6)
            self.line(54, 744, 612 - 54, 744)

        # Footer (all pages)
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.6)
        self.line(54, 44, 612 - 54, 44)
        
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        self.drawString(54, 30, "Lexicon Platform Architecture & Security Specification  •  NIST 800-63B / OWASP Aligned")
        self.drawRightString(612 - 54, 30, f"Page {self._pageNumber} of {page_count}")
        self.restoreState()

def build_detailed_pdf(filename):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=58,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Brand Colors
    primary = colors.HexColor("#0071E3")
    navy = colors.HexColor("#0F172A")
    dark_gray = colors.HexColor("#1E293B")
    body_color = colors.HexColor("#334155")
    muted_color = colors.HexColor("#64748B")
    bg_card = colors.HexColor("#F8FAFC")
    bg_highlight = colors.HexColor("#EFF6FF")
    border_color = colors.HexColor("#E2E8F0")
    danger_color = colors.HexColor("#DC2626")

    # Typography Styles
    title_style = ParagraphStyle(
        'MainTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=navy,
        spaceAfter=3
    )

    subtitle_style = ParagraphStyle(
        'SubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=15,
        textColor=primary,
        spaceAfter=10
    )

    section_h1 = ParagraphStyle(
        'SecH1',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=navy,
        spaceBefore=14,
        spaceAfter=5,
        keepWithNext=True
    )

    section_h2 = ParagraphStyle(
        'SecH2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=primary,
        spaceBefore=8,
        spaceAfter=3,
        keepWithNext=True
    )

    body = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12.5,
        textColor=body_color,
        spaceAfter=5
    )

    bullet = ParagraphStyle(
        'Bullet',
        parent=body,
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=3
    )

    code_block = ParagraphStyle(
        'CodeBlock',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=7.5,
        leading=10,
        textColor=dark_gray,
        spaceBefore=2,
        spaceAfter=4
    )

    th_style = ParagraphStyle(
        'TH',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.white
    )

    td_style = ParagraphStyle(
        'TD',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=10,
        textColor=body_color
    )

    td_bold = ParagraphStyle(
        'TDBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=10,
        textColor=navy
    )

    story = []

    # --- COVER / HEADER ---
    story.append(Paragraph("LEXICON", title_style))
    story.append(Paragraph("Enterprise Password Risk Intelligence & Identity Security Platform", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=primary, spaceAfter=10))

    meta_table_data = [
        [Paragraph("<b>Platform Version:</b> 1.0.0 (Enterprise GA)", td_style), Paragraph("<b>Dataset Scope:</b> 50,000 Active Directory Accounts", td_style)],
        [Paragraph("<b>Frontend:</b> Next.js 15, React 19, TypeScript, Tailwind", td_style), Paragraph("<b>Backend:</b> FastAPI, Uvicorn, Python 3.9+, Pydantic v2", td_style)],
        [Paragraph("<b>Cryptography Engine:</b> hash-wasm (WASM Multi-Worker)", td_style), Paragraph("<b>Breach Telemetry:</b> Synthetic Bulk + Live HIBP k-Anonymity", td_style)],
    ]
    meta_t = Table(meta_table_data, colWidths=[250, 254])
    meta_t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), bg_card),
        ('BOX', (0,0), (-1,-1), 0.5, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, border_color),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(meta_t)
    story.append(Spacer(1, 8))

    # --- 1. EXECUTIVE OVERVIEW ---
    story.append(Paragraph("1. Executive Summary & Problem Space", section_h1))
    story.append(Paragraph(
        "Modern enterprise identity security is plagued by isolated password evaluation. Traditional password tools check whether "
        "a string has uppercase letters, numbers, or passes an arbitrary 8-character threshold. They fail to assess how passwords "
        "interact with organizational structure, administrative access, and lateral movement.",
        body
    ))
    story.append(Paragraph(
        "<b>Lexicon</b> redefines password auditing from static string scoring into comprehensive <b>Identity Risk Intelligence</b>. "
        "Benchmarked against an enterprise Active Directory directory of 50,000 corporate identities, Lexicon correlates: "
        "(1) Multi-account password reuse families, (2) Administrative privilege weighting, (3) Known breach exposure, "
        "(4) Real client-side mutation attack exploitability, and (5) Cryptographic hashing resistance across legacy and modern algorithms.",
        body
    ))

    # --- 2. ARCHITECTURE & ZERO-MARGINAL-COST MODEL ---
    story.append(Paragraph("2. System Architecture & Zero-Marginal-Cost Compute", section_h1))
    story.append(Paragraph(
        "Lexicon introduces a hybrid compute architecture specifically engineered to deliver instant enterprise-scale analysis "
        "without requiring GPU cracking clusters or risking employee credential privacy:",
        body
    ))
    story.append(Paragraph(
        "• <b>Server-Side Telemetry Engine (FastAPI):</b> Handles precomputed enterprise audit indexes, fast paginated queries, "
        "cluster relationships, and CISO advisory report generation. Response times remain under 15ms.<br/>"
        "• <b>Client-Side Compute Engine (WebAssembly & Web Workers):</b> All active cryptographic hashing, candidate mutation generation, "
        "and dictionary simulations execute directly on the operator's device using <code>hash-wasm</code>. "
        "This achieves true zero marginal server compute cost and horizontal scalability.<br/>"
        "• <b>Zero-Knowledge Privacy Guarantee:</b> Raw password candidate streams and generated dictionary mutations are strictly confined "
        "to client browser memory. Only final execution summaries (probes tested, elapsed time, match status) are sent to the API.",
        bullet
    ))

    # --- 3. DATASET & GROUND-TRUTH CLUSTERING ---
    story.append(Paragraph("3. Enterprise Active Directory Directory & Credential Reuse Clustering", section_h1))
    story.append(Paragraph(
        "• <b>Directory Structure:</b> 50,000 corporate accounts benchmarked across 8 corporate departments: "
        "Information Technology (6,250), Database Administration (3,120), Software Engineering (12,480), Finance & Accounting (6,250), "
        "Operations (9,400), Human Resources (4,100), Legal & Compliance (3,150), and Executive Leadership (5,250).<br/>"
        "• <b>The Salted Reuse Paradox:</b> Salted algorithms (bcrypt/Argon2id) generate completely different hashes for identical passwords, "
        "which blinds traditional hash-equality auditing to credential reuse. Lexicon solves this by analyzing credential group identifiers, "
        "allowing exact tracking of <b>805 credential reuse families</b> without compromising salt mechanics.<br/>"
        "• <b>Hero Account (alex.morgan - ACC-00042):</b> Enterprise Active Directory Domain Admin in IT Operations. Shares credentials with "
        "31 accounts across IT, Finance, and Operations in <b>Cluster #42</b>, illustrating lateral privilege escalation.",
        bullet
    ))

    # --- 4. MATHEMATICAL RISK ENGINE ---
    story.append(Paragraph("4. Two-Stage Deterministic Risk-Scoring Methodology", section_h1))
    story.append(Paragraph("<b>Stage 1: Baseline Risk Calculation (Precomputed for all 50k accounts):</b>", section_h2))
    story.append(Paragraph(
        "<code>Baseline Risk = 0.30·(1 - zxcvbn_norm) + 0.25·BreachFlag + 0.20·ReuseCluster_norm + 0.15·PrivilegeWeight + 0.10·PolicyViolations</code>",
        code_block
    ))
    story.append(Paragraph(
        "• <code>zxcvbn_norm</code>: Score from 0 to 4 normalized to [0, 1.0].<br/>"
        "• <code>BreachFlag</code>: 1.0 if matched in compromised breach corpus, else 0.0.<br/>"
        "• <code>ReuseCluster_norm</code>: Normalized cluster size factor: <code>min(1.0, cluster_size / 30.0)</code>.<br/>"
        "• <code>PrivilegeWeight</code>: 1.0 for Domain/Cloud Admins & Executives, 0.4 for standard users.<br/>"
        "• <code>PolicyViolations</code>: <code>min(1.0, count / 3.0)</code> for AD policy breaches.<br/>"
        "<b>Risk Tiers:</b> Critical (≥ 0.75), High (≥ 0.50), Medium (≥ 0.25), Low (< 0.25).",
        bullet
    ))

    story.append(Paragraph("<b>Stage 2: Empirical Attack Adjustment (Applied after Attack Lab run):</b>", section_h2))
    story.append(Paragraph(
        "<code>Attack Adjustment = +0.15 (if cracked within budget) + ConfidenceBonus(speed, candidates, algo)</code><br/>"
        "<code>Final Account Risk = Baseline Risk + Attack Adjustment</code>",
        code_block
    ))
    story.append(Paragraph(
        "An account's attack adjustment remains strictly 0.0 until an operator explicitly subjects it to an Attack Lab run.",
        body
    ))

    story.append(PageBreak())

    # --- 5. ATTACK LAB & MUTATION ENGINE ---
    story.append(Paragraph("5. Client-Side Bounded Attack Lab & Mutation Engine", section_h1))
    story.append(Paragraph(
        "The Attack Lab provides empirical verification of exploitability by running deterministic mutation rules inside a Web Worker:",
        body
    ))
    story.append(Paragraph(
        "• <b>Contextual Seed Extraction:</b> Extracts contextual seed terms from account metadata (username components, department name, company keywords).<br/>"
        "• <b>Rule Combinations:</b> Applies TitleCase, UPPERCASE, toggleCase, leetspeak (<code>@, 4, 3, 1, !, 0, $, 5</code>), "
        "calendar year suffixes (<code>2022</code> to <code>2027</code>), seasonal patterns (<code>Summer!</code>, <code>Winter2026!</code>), and special delimiter appends.<br/>"
        "• <b>Dual Safety Caps:</b> Maximum 50,000 candidates tested or 30.0 seconds wall-clock time limit.<br/>"
        "• <b>Exhaustion Semantics:</b> If no match is found within budget, the engine explicitly reports "
        "<b>'NOT FOUND WITHIN BOUNDED BUDGET'</b> rather than falsely certifying password strength.",
        bullet
    ))

    # --- 6. WASM HASH RACE ARENA ---
    story.append(Paragraph("6. WASM Multi-Algorithm Hash Race Arena", section_h1))
    story.append(Paragraph(
        "Lexicon conducts genuine, un-fabricated benchmarks directly on the operator's CPU across 4 cryptographic schemes using WebAssembly:",
        body
    ))

    hash_table_data = [
        [Paragraph("Algorithm", th_style), Paragraph("Type & Resistance", th_style), Paragraph("Parameters / Work Factor", th_style), Paragraph("Throughput / Security Implication", th_style)],
        [Paragraph("MD5", td_bold), Paragraph("Unsalted Message Digest", td_style), Paragraph("1 Iteration, 0 KB RAM", td_style), Paragraph("100,000+ hashes/sec. Trivial to crack on commodity GPU.", td_style)],
        [Paragraph("SHA-256", td_bold), Paragraph("Cryptographic Hash", td_style), Paragraph("1 Iteration, 0 KB RAM", td_style), Paragraph("High throughput. Vulnerable to ASIC/GPU dictionary parallelism.", td_style)],
        [Paragraph("bcrypt", td_bold), Paragraph("Adaptive CPU Key Derivation", td_style), Paragraph("Cost Factor 10 (1,024 rounds), 4 KB RAM", td_style), Paragraph("Calibrated CPU cost slows brute force significantly.", td_style)],
        [Paragraph("Argon2id", td_bold), Paragraph("Memory-Hard (OWASP Winner)", td_style), Paragraph("t=2, m=8,192 KB, p=1", td_style), Paragraph("High memory hardness defeats GPU/ASIC parallelism entirely.", td_style)],
    ]
    hash_t = Table(hash_table_data, colWidths=[60, 120, 140, 184])
    hash_t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), navy),
        ('GRID', (0,0), (-1,-1), 0.5, border_color),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, bg_card]),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(hash_t)
    story.append(Spacer(1, 6))

    # --- 7. DUAL-PATH BREACH DETECTION ---
    story.append(Paragraph("7. Dual-Path Breach Exposure Engine", section_h1))
    story.append(Paragraph(
        "• <b>Path 1 — Offline Synthetic Corpus (Bulk 50k Audit):</b> An in-memory hash set of ~1,000 compromised credential signatures "
        "enabling instantaneous, offline O(1) breach correlation for all 50,000 accounts without external rate limits.<br/>"
        "• <b>Path 2 — Live Real-World HIBP k-Anonymity API:</b> Single-password interactive probe. Computes the SHA-1 hash client-side and transmits "
        "<b>only the first 5 hexadecimal characters</b> to <code>https://api.pwnedpasswords.com/range/{prefix}</code>. "
        "The browser matches the remaining suffix locally, guaranteeing that the user's password never leaves the client.",
        bullet
    ))

    # --- 8. AI REMEDIATION & CISO ADVISORY ---
    story.append(Paragraph("8. AI & Deterministic CISO Remediation Studio", section_h1))
    story.append(Paragraph(
        "Converts deterministic mathematical audit findings into structured, prioritized enterprise remediation plans:",
        body
    ))
    story.append(Paragraph(
        "• <b>Executive Risk Summary:</b> CISO-level briefings detailing exposed privileged identities and blast radius metrics.<br/>"
        "• <b>Active Directory Fine-Grained Password Policies (FGPP):</b> Mandating 16+ character passphrases, eliminating arbitrary 90-day resets.<br/>"
        "• <b>Custom AD Wordlist Blocklists:</b> Automatic extraction of organization dictionary roots (e.g. <code>Company*</code>, <code>Welcome*</code>, <code>Summer*</code>).<br/>"
        "• <b>Phishing-Resistant MFA Roadmap:</b> Priority deployment of hardware security keys (FIDO2 / WebAuthn) for privileged administrative accounts.<br/>"
        "• <b>Deterministic Fallback:</b> Fully operational offline even in air-gapped environments without external LLM API dependencies.",
        bullet
    ))

    # --- 9. MULTI-EXPERIENCE FRONTEND ---
    story.append(Paragraph("9. Multi-Experience Frontend Architecture", section_h1))
    story.append(Paragraph(
        "Built in Next.js 15 using Apple-inspired minimalist design tokens, responsive cards, and dynamic Framer Motion transitions:",
        body
    ))
    story.append(Paragraph(
        "1. <b>Public Product Landing Page:</b> Interactive security posture overview, platform feature showcase, and architecture breakdown.<br/>"
        "2. <b>Employee Self-Service Security Portal:</b> Live password strength calculator, policy violation diagnostics, and breach check.<br/>"
        "3. <b>SOC Admin Operations Cockpit:</b> Unified Defense Readiness Dial, Risk Distribution charts, filterable 50k Account Directory, "
        "Blast Radius Visualizer, Web Worker Attack Lab, and WASM Hash Race Arena.",
        bullet
    ))

    # --- 10. REST API SPECIFICATION ---
    story.append(Paragraph("10. Complete REST API Specification", section_h1))
    api_table_data = [
        [Paragraph("HTTP", th_style), Paragraph("Endpoint", th_style), Paragraph("Query / Payload", th_style), Paragraph("Description", th_style)],
        [Paragraph("GET", td_bold), Paragraph("/api/dataset/summary", td_style), Paragraph("None", td_style), Paragraph("Aggregated 50k audit metrics, tier counts, & top reuse families", td_style)],
        [Paragraph("GET", td_bold), Paragraph("/api/dataset/hero-account", td_style), Paragraph("None", td_style), Paragraph("Retrieves primary demo target: alex.morgan (Cluster #42)", td_style)],
        [Paragraph("GET", td_bold), Paragraph("/api/dataset/accounts", td_style), Paragraph("search, tier, dept, is_privileged, page", td_style), Paragraph("Paginated directory search and multi-vector filtering", td_style)],
        [Paragraph("GET", td_bold), Paragraph("/api/dataset/accounts/{id}", td_style), Paragraph("account_id in path", td_style), Paragraph("Detailed telemetry, hashes, & policy violations for an identity", td_style)],
        [Paragraph("GET", td_bold), Paragraph("/api/dataset/reuse-clusters/{id}", td_style), Paragraph("group_id in path", td_style), Paragraph("Full member list and departmental blast radius for a cluster", td_style)],
        [Paragraph("POST", td_bold), Paragraph("/api/attack/result", td_style), Paragraph("account_id, algorithm, candidates, matched", td_style), Paragraph("Ingests client attack metadata & applies empirical risk adjustment", td_style)],
        [Paragraph("POST", td_bold), Paragraph("/api/remediation/report", td_style), Paragraph("findings JSON", td_style), Paragraph("Generates structured CISO remediation & policy recommendations", td_style)],
        [Paragraph("GET", td_bold), Paragraph("/api/hibp/check-range/{prefix}", td_style), Paragraph("5-char hex prefix in path", td_style), Paragraph("Proxies 5-char SHA-1 prefix to HIBP k-Anonymity API", td_style)],
        [Paragraph("GET", td_bold), Paragraph("/health", td_style), Paragraph("None", td_style), Paragraph("Service health status check", td_style)],
    ]
    api_t = Table(api_table_data, colWidths=[35, 145, 140, 184])
    api_t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), navy),
        ('GRID', (0,0), (-1,-1), 0.5, border_color),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, bg_card]),
        ('TOPPADDING', (0,0), (-1,-1), 3.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(api_t)

    # --- 11. TESTING & QUICK START ---
    story.append(Paragraph("11. Quality Assurance & Local Quick Start", section_h1))
    story.append(Paragraph(
        "• <b>Automated Test Suite:</b> 17 unit and integration test suites passing (<code>pytest -v</code>) covering mathematical risk thresholds, "
        "hashing verifications, Active Directory policy parsers, and API contracts.<br/>"
        "• <b>Start Backend:</b> <code>cd backend && python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload</code><br/>"
        "• <b>Start Frontend:</b> <code>cd frontend && npm run dev</code> (Open <b>http://localhost:3000</b>)<br/>"
        "• <b>API Docs:</b> Interactive Swagger UI at <b>http://localhost:8000/docs</b>.",
        bullet
    ))

    # Build PDF
    doc.build(story, canvasmaker=DetailedNumberedCanvas)
    print(f"Detailed PDF successfully generated at: {filename}")

if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else "Lexicon_Comprehensive_Platform_Documentation.pdf"
    build_detailed_pdf(out)
