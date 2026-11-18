from pathlib import Path
import re
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, KeepTogether
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "dist" / "The_Elements_Advanced_Scientific_Reference_PREVIEW.pdf"
OUT.parent.mkdir(parents=True, exist_ok=True)
PAGE = (6.3 * inch, 9.2 * inch)

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="CoverTitle", parent=styles["Title"], fontName="Helvetica-Bold", fontSize=25, leading=30, alignment=TA_CENTER, textColor=colors.HexColor("#14263D"), spaceAfter=14))
styles.add(ParagraphStyle(name="CoverSub", parent=styles["Normal"], fontName="Helvetica", fontSize=10, leading=15, alignment=TA_CENTER, textColor=colors.HexColor("#526477")))
styles.add(ParagraphStyle(name="H1x", parent=styles["Heading1"], fontSize=17, leading=21, textColor=colors.HexColor("#14263D"), spaceBefore=12, spaceAfter=8))
styles.add(ParagraphStyle(name="H2x", parent=styles["Heading2"], fontSize=12, leading=15, textColor=colors.HexColor("#235B75"), spaceBefore=9, spaceAfter=5))
styles.add(ParagraphStyle(name="Bodyx", parent=styles["BodyText"], fontSize=8.7, leading=12.2, spaceAfter=6))
styles.add(ParagraphStyle(name="Smallx", parent=styles["BodyText"], fontSize=7.2, leading=9, textColor=colors.HexColor("#526477")))
styles.add(ParagraphStyle(name="Cellx", parent=styles["BodyText"], fontSize=7.2, leading=9))

def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

def inline(s):
    s = esc(s)
    s = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", s)
    s = re.sub(r"\*(.+?)\*", r"<i>\1</i>", s)
    s = re.sub(r"\[([^\]]+)\]\((https?://[^)]+)\)", r'<link href="\2" color="#235B75">\1</link>', s)
    return s

def footer(canvas, doc):
    canvas.saveState()
    w, h = PAGE
    canvas.setStrokeColor(colors.HexColor("#D7DEE5"))
    canvas.line(15*mm, 13*mm, w-15*mm, 13*mm)
    canvas.setFont("Helvetica", 7)
    canvas.setFillColor(colors.HexColor("#657789"))
    canvas.drawString(15*mm, 8*mm, "THE ELEMENTS | DEVELOPMENT PREVIEW")
    canvas.drawRightString(w-15*mm, 8*mm, str(doc.page))
    canvas.restoreState()

def parse_md(path):
    lines = path.read_text(encoding="utf-8").splitlines()
    story, para, table_rows = [], [], []
    def flush_para():
        if para:
            story.append(Paragraph(inline(" ".join(para)), styles["Bodyx"]))
            para.clear()
    def flush_table():
        if table_rows:
            data = [[Paragraph(inline(c.strip()), styles["Cellx"]) for c in row] for row in table_rows]
            t = Table(data, colWidths=[(PAGE[0]-36*mm)/len(data[0])]*len(data[0]), repeatRows=1, hAlign="LEFT")
            t.setStyle(TableStyle([
                ("BACKGROUND",(0,0),(-1,0),colors.HexColor("#E8EEF3")),
                ("TEXTCOLOR",(0,0),(-1,0),colors.HexColor("#14263D")),
                ("GRID",(0,0),(-1,-1),0.35,colors.HexColor("#CBD5DF")),
                ("VALIGN",(0,0),(-1,-1),"TOP"),
                ("LEFTPADDING",(0,0),(-1,-1),5),("RIGHTPADDING",(0,0),(-1,-1),5),
                ("TOPPADDING",(0,0),(-1,-1),4),("BOTTOMPADDING",(0,0),(-1,-1),4),
            ]))
            story.extend([t, Spacer(1,7)])
            table_rows.clear()
    for line in lines:
        s=line.strip()
        if s.startswith("|") and s.endswith("|"):
            flush_para()
            cells=[x.strip() for x in s.strip("|").split("|")]
            if all(re.fullmatch(r":?-{3,}:?",x or "-") for x in cells):
                continue
            table_rows.append(cells)
            continue
        flush_table()
        if not s:
            flush_para()
        elif s.startswith("# "):
            flush_para(); story.append(Paragraph(inline(s[2:]), styles["H1x"]))
        elif s.startswith("## "):
            flush_para(); story.append(Paragraph(inline(s[3:]), styles["H2x"]))
        elif s.startswith("### "):
            flush_para(); story.append(Paragraph(inline(s[4:]), styles["Heading3"]))
        elif s.startswith("- ") or re.match(r"^\d+\.\s",s):
            flush_para(); story.append(Paragraph("• " + inline(re.sub(r"^(- |\d+\.\s)","",s)), styles["Bodyx"]))
        else:
            para.append(s)
    flush_para(); flush_table()
    return story

story = [
    Spacer(1, 38*mm),
    Paragraph("THE ELEMENTS", styles["CoverTitle"]),
    Paragraph("AN ADVANCED SCIENTIFIC AND RESEARCH REFERENCE", styles["CoverSub"]),
    Spacer(1, 10*mm),
    Paragraph("Atomic, Nuclear, Physical, Chemical, and Materials Properties of the 118 Elements", styles["CoverSub"]),
    Spacer(1, 35*mm),
    Paragraph("DEVELOPMENT PREVIEW", ParagraphStyle("preview", parent=styles["CoverSub"], fontName="Helvetica-Bold", textColor=colors.HexColor("#A14B32"))),
    Spacer(1, 5*mm),
    Paragraph("Development build. This is an evolving research reference, not yet a complete or fully peer-reviewed 118-element encyclopedia.", styles["Smallx"]),
    PageBreak(),
    Paragraph("Editorial Standards", styles["H1x"]),
]
standards = ROOT / "editorial" / "SCIENTIFIC-STANDARDS.md"
story.extend(parse_md(standards))
index_file = ROOT / "elements" / "INDEX.md"
story.append(PageBreak())
story.extend(parse_md(index_file))
element_files = sorted(p for p in (ROOT / "elements").glob("[0-9][0-9][0-9]-*.md"))
for element_file in element_files:
    story.append(PageBreak())
    story.extend(parse_md(element_file))
doc = SimpleDocTemplate(str(OUT), pagesize=PAGE, rightMargin=18*mm, leftMargin=18*mm, topMargin=17*mm, bottomMargin=19*mm, title="The Elements: An Advanced Scientific and Research Reference", author="Scientific Reference Project")
doc.build(story, onFirstPage=footer, onLaterPages=footer)
print(f"Built {OUT} ({OUT.stat().st_size} bytes)")
