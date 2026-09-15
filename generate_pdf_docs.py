import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    """Two-pass canvas to dynamically add total page numbers and running headers/footers."""
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
            self.draw_header_footer(num_pages)
            super().showPage()
        super().save()

    def draw_header_footer(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 750, "LEXICON — Enterprise Password Risk Intelligence Platform")
            self.drawRightString(612 - 54, 750, "Technical System Documentation")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(54, 742, 612 - 54, 742)

        # Footer
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(54, 45, 612 - 54, 45)
        
        self.drawString(54, 32, "Confidential • Enterprise Identity & Access Security Platform")
        self.drawRightString(612 - 54, 32, f"Page {self._pageNumber} of {page_count}")
        self.restoreState()

def build_pdf(filename="Lexicon_Enterprise_Platform_Documentation.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=64,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Custom typography styles
    primary_color = colors.HexColor("#0071E3")
    dark_navy = colors.HexColor("#0F172A")
    body_text = colors.HexColor("#334155")
    bg_light = colors.HexColor("#F8FAFC")
    border_color = colors.HexColor("#E2E8F0")

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=dark_navy,
        spaceAfter=4
    )

    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=primary_color,
        spaceAfter=14
    )

    h1_style = ParagraphStyle(
        'SectionH1',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=dark_navy,
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'SectionH2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=primary_color,
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=body_text,
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'CustomBullet',
        parent=body_style,
        leftIndent=14,
        firstLineIndent=-10,
        spaceAfter=3
    )

    code_style = ParagraphStyle(
        'CodeSnippet',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8,
        leading=10.5,
        textColor=colors.HexColor("#1E293B"),
        spaceBefore=3,
        spaceAfter=3
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.white
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=body_text
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=dark_navy
    )

    story = []

    # Title Banner Block
    story.append(Paragraph("LEXICON", title_style))
    story.append(Paragraph("Enterprise Password Risk Intelligence Platform — Technical Documentation", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=primary_color, spaceAfter=12))

    # Meta Info Table
    meta_data = [
        [Paragraph("<b>Status:</b> Production Ready", table_cell_style), Paragraph("<b>Target Scale:</b> 50,000 Active Directory Accounts", table_cell_style)],
        [Paragraph("<b>Architecture:</b> Next.js 15 + FastAPI + WASM", table_cell_style), Paragraph("<b>Compliance:</b> NIST 800-63B / OWASP Hashing Guidelines", table_cell_style)],
    ]
    meta_table = Table(meta_data, colWidths=[250, 254])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), bg_light),
        ('BOX', (0,0), (-1,-1), 0.5, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, border_color),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 10))

    # 1. Executive Summary
    story.append(Paragraph("1. Executive Summary", h1_style))
    story.append(Paragraph(
        "<b>Lexicon</b> is an enterprise-grade Identity & Access Risk Intelligence platform built to analyze large-scale "
        "Active Directory credential telemetry. Traditional password utilities only evaluate whether an isolated password string is weak. "
        "<b>Lexicon</b> bridges the gap between individual password entropy and organizational risk by answering: "
        "(1) Which accounts create the greatest enterprise blast radius when compromised? "
        "(2) How do credentials propagate across departments via password reuse clusters? "
        "(3) How easily can accounts be exploited via client-side mutation attacks? and "
        "(4) How do legacy hashes compare against memory-hard algorithms in empirical throughput?",
        body_style
    ))
    story.append(Paragraph(
        "The platform operates on a <b>zero-marginal-cost, client-side compute architecture</b>, eliminating the need for expensive "
        "GPU cracking infrastructure while guaranteeing that candidate credential streams never leave client browser memory.",
        body_style
    ))

    # 2. System Architecture
    story.append(Paragraph("2. System Architecture & Compute Model", h1_style))
    story.append(Paragraph(
        "• <b>Server-Side (FastAPI - Python 3.9+):</b> High-performance stateless API managing the 50,000-account precomputed dataset, "
        "synthetic breach corpus, metadata indexing, empirical score adjustments, and CISO advisory generation.<br/>"
        "• <b>Client-Side Compute (WebAssembly & Web Workers):</b> Multi-threaded browser execution using <code>hash-wasm</code> and dedicated Web Workers. "
        "Heavy hashing and bounded dictionary mutation attacks execute locally on the operator's device.<br/>"
        "• <b>Zero Data Exfiltration:</b> Attack candidate streams never traverse the network. Only final execution metrics (probes, time, match status, rule tag) "
        "are transmitted back for risk aggregation.",
        bullet_style
    ))

    # 3. 50k Dataset & Clustering
    story.append(Paragraph("3. 50,000-Account Active Directory Dataset & Ground-Truth Clustering", h1_style))
    story.append(Paragraph(
        "• <b>Scale & Realism:</b> Fully synthetic dataset of 50,000 corporate identities across IT, Engineering, Finance, Executive, HR, Legal, and Operations.<br/>"
        "• <b>Ground-Truth Tagging:</b> Salted algorithms (bcrypt/Argon2id) produce distinct hashes for identical passwords, concealing reuse. "
        "Lexicon assigns an explicit <code>password_group_id</code> at generation time to track 805 credential reuse families across departments without weakening salt security.<br/>"
        "• <b>Hero Account:</b> <code>alex.morgan</code> (ACC-00042) — Enterprise Domain Admin sharing credentials in Cluster #42 across 31 accounts.",
        bullet_style
    ))

    # 4. Two-Stage Risk Scoring Engine
    story.append(Paragraph("4. Two-Stage Explainable Risk Scoring Engine", h1_style))
    story.append(Paragraph("<b>Stage 1 — Baseline Risk Score (Computed for all 50,000 accounts):</b>", h2_style))
    story.append(Paragraph(
        "<code>Baseline Risk = 0.30·(1 - zxcvbn_entropy) + 0.25·BreachMatch + 0.20·ReuseCluster_norm + 0.15·PrivilegeWeight + 0.10·PolicyViolations</code>",
        code_style
    ))
    story.append(Paragraph(
        "Tiers: <b>Critical (≥ 0.75)</b>, <b>High (≥ 0.50)</b>, <b>Medium (≥ 0.25)</b>, and <b>Low (< 0.25)</b>.",
        body_style
    ))
    story.append(Paragraph("<b>Stage 2 — Empirical Attack Adjustment (Applied after Attack Lab run):</b>", h2_style))
    story.append(Paragraph(
        "<code>Attack Adjustment = +0.15 (if cracked within budget) + ConfidenceBonus(speed, candidates, algo)</code><br/>"
        "<code>Final Risk Score = Baseline Risk + Attack Adjustment</code> (adjustment is strictly 0.0 until live attack execution).",
        code_style
    ))

    story.append(Spacer(1, 4))

    # 5. Attack Lab & Hash Race
    story.append(Paragraph("5. Interactive Attack Lab & WASM Hash Race Arena", h1_style))
    story.append(Paragraph(
        "• <b>Bounded Attack Lab:</b> Executes rule mutations (corporate names, departments, seasons, calendar years 2022–2027, leetspeak) "
        "under dual safety caps (≤ 50,000 candidates, ≤ 30s wall-clock). Exhausted runs explicitly report 'NOT FOUND WITHIN BOUNDED BUDGET'.<br/>"
        "• <b>WASM Hash Race Arena:</b> Measures true on-device cryptographic performance across 4 algorithms in parallel Web Workers:<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;1. <b>MD5:</b> Standard unsalted digest (hundreds of thousands of hashes/sec).<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;2. <b>SHA-256:</b> Unsalted cryptographic digest with high hardware vulnerability.<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;3. <b>bcrypt:</b> Cost factor 10 (1,024 rounds), calibrated CPU work-factor resistance.<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;4. <b>Argon2id:</b> OWASP-recommended memory-hard scheme (8 MiB memory cost, t=2, p=1) preventing GPU parallelism.",
        bullet_style
    ))

    # 6. Dual-Path Breach & Remediation
    story.append(Paragraph("6. Breach Detection & AI Remediation Advisory", h1_style))
    story.append(Paragraph(
        "• <b>Dual-Path Breach Verification:</b> (1) Offline bulk audit using an in-memory synthetic corpus (~1,000 patterns) for instant repeatability, "
        "and (2) Live single-password check via official Have I Been Pwned k-Anonymity API (5-char SHA-1 prefix proxy) preserving zero-knowledge privacy.<br/>"
        "• <b>AI & Deterministic CISO Remediation Studio:</b> Converts deterministic findings into executive summaries, Active Directory Fine-Grained Password Policies, "
        "disallowed organizational wordlist blocklists, and prioritized FIDO2 / WebAuthn MFA deployment roadmaps.",
        bullet_style
    ))

    # 7. Multi-Experience Frontend
    story.append(Paragraph("7. Multi-Experience Frontend Architecture", h1_style))
    story.append(Paragraph(
        "1. <b>Public Landing Page:</b> Executive overview of platform capabilities, attack economics, and architecture.<br/>"
        "2. <b>Employee Self-Service Security Panel:</b> Interactive password evaluation with entropy score, breach checks, and AD policy feedback.<br/>"
        "3. <b>SOC Admin Defense Cockpit:</b> Complete operations dashboard featuring Defense Readiness Dial, Risk Distribution Charts, "
        "paginated Corporate Account Directory, Blast Radius Visualizer, Attack Lab Arena, and Hash Race Module.",
        bullet_style
    ))

    story.append(Spacer(1, 6))

    # 8. API Specification Table
    story.append(Paragraph("8. REST API Endpoint Specification", h1_style))
    api_data = [
        [Paragraph("Method", table_header_style), Paragraph("Endpoint", table_header_style), Paragraph("Description", table_header_style)],
        [Paragraph("GET", table_cell_bold), Paragraph("/api/dataset/summary", table_cell_style), Paragraph("Enterprise-wide audit telemetry & risk tier metrics", table_cell_style)],
        [Paragraph("GET", table_cell_bold), Paragraph("/api/dataset/hero-account", table_cell_style), Paragraph("Primary demonstration account (alex.morgan, Cluster #42)", table_cell_style)],
        [Paragraph("GET", table_cell_bold), Paragraph("/api/dataset/accounts", table_cell_style), Paragraph("Paginated directory search (filter by tier, dept, admin, breach)", table_cell_style)],
        [Paragraph("GET", table_cell_bold), Paragraph("/api/dataset/accounts/{id}", table_cell_style), Paragraph("Telemetry, policy violations, and hashes for a single account", table_cell_style)],
        [Paragraph("GET", table_cell_bold), Paragraph("/api/dataset/reuse-clusters/{id}", table_cell_style), Paragraph("Full cluster blast-radius membership breakdown", table_cell_style)],
        [Paragraph("POST", table_cell_bold), Paragraph("/api/attack/result", table_cell_style), Paragraph("Ingests client attack metadata & applies empirical risk adjustment", table_cell_style)],
        [Paragraph("POST", table_cell_bold), Paragraph("/api/remediation/report", table_cell_style), Paragraph("Generates structured CISO advisory & policy recommendations", table_cell_style)],
        [Paragraph("GET", table_cell_bold), Paragraph("/api/hibp/check-range/{prefix}", table_cell_style), Paragraph("Proxies 5-char SHA-1 prefix to HIBP k-Anonymity API", table_cell_style)],
        [Paragraph("GET", table_cell_bold), Paragraph("/health", table_cell_style), Paragraph("Service health check", table_cell_style)],
    ]
    api_table = Table(api_data, colWidths=[55, 175, 274])
    api_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), dark_navy),
        ('GRID', (0,0), (-1,-1), 0.5, border_color),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, bg_light]),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(api_table)

    story.append(Spacer(1, 8))

    # 9. Quick Start & Test Results
    story.append(Paragraph("9. Quick Start & Test Verification", h1_style))
    story.append(Paragraph(
        "• <b>Backend Start (Port 8000):</b> <code>cd backend && python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload</code><br/>"
        "• <b>Frontend Start (Port 3000):</b> <code>cd frontend && npm run dev</code><br/>"
        "• <b>Automated Test Suite:</b> <code>pytest -v</code> (<b>17/17 tests passing</b> across risk math, hashing verifications, policy checks, and APIs).",
        bullet_style
    ))

    # Build PDF with NumberedCanvas
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF successfully generated at: {filename}")

if __name__ == "__main__":
    out_path = sys.argv[1] if len(sys.argv) > 1 else "Lexicon_Enterprise_Platform_Documentation.pdf"
    build_pdf(out_path)
