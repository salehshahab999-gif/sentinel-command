from pathlib import Path
import math
import re

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle,
    KeepTogether
)
from reportlab.platypus.tableofcontents import TableOfContents

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "dist" / "The_Elements_Advanced_Scientific_Reference_PREVIEW.pdf"
OUT.parent.mkdir(parents=True, exist_ok=True)

# A4 is a standard, print-friendly page size with enough width for research tables.
PAGE = A4
PAGE_WIDTH, PAGE_HEIGHT = PAGE
LEFT = RIGHT = 18 * mm
TOP = 22 * mm
BOTTOM = 19 * mm
CONTENT_WIDTH = PAGE_WIDTH - LEFT - RIGHT

# Embed Noto Sans to preserve isotope superscripts, subscripts, Greek letters,
# degree signs, and other scientific glyphs across PDF viewers.
FONT_DIR = Path("/usr/share/fonts/truetype/noto")
pdfmetrics.registerFont(TTFont("NotoSans", str(FONT_DIR / "NotoSans-Regular.ttf")))
pdfmetrics.registerFont(TTFont("NotoSans-Bold", str(FONT_DIR / "NotoSans-Bold.ttf")))
pdfmetrics.registerFont(TTFont("NotoSans-Italic", str(FONT_DIR / "NotoSans-Italic.ttf")))
pdfmetrics.registerFont(TTFont("NotoSans-BoldItalic", str(FONT_DIR / "NotoSans-BoldItalic.ttf")))
pdfmetrics.registerFontFamily(
    "NotoSans",
    normal="NotoSans",
    bold="NotoSans-Bold",
    italic="NotoSans-Italic",
    boldItalic="NotoSans-BoldItalic",
)

NAVY = colors.HexColor("#14263D")
BLUE = colors.HexColor("#235B75")
MUTED = colors.HexColor("#5D6F80")
RULE = colors.HexColor("#CBD5DF")
PALE = colors.HexColor("#EDF2F6")
PALE_BLUE = colors.HexColor("#F2F6F9")
STATUS = colors.HexColor("#F7F2E9")

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(
    name="CoverTitle", parent=styles["Title"], fontName="NotoSans-Bold",
    fontSize=31, leading=38, alignment=TA_CENTER, textColor=NAVY,
    spaceAfter=12
))
styles.add(ParagraphStyle(
    name="CoverSub", parent=styles["Normal"], fontName="NotoSans",
    fontSize=11, leading=16, alignment=TA_CENTER, textColor=MUTED
))
styles.add(ParagraphStyle(
    name="CoverTag", parent=styles["Normal"], fontName="NotoSans-Bold",
    fontSize=9, leading=13, alignment=TA_CENTER, textColor=BLUE
))
styles.add(ParagraphStyle(
    name="H1x", parent=styles["Heading1"], fontName="NotoSans-Bold",
    fontSize=18, leading=23, textColor=NAVY, spaceBefore=10,
    spaceAfter=9, keepWithNext=1
))
styles.add(ParagraphStyle(
    name="ElementTitle", parent=styles["Heading1"], fontName="NotoSans-Bold",
    fontSize=19, leading=24, textColor=NAVY, spaceBefore=2,
    spaceAfter=11, keepWithNext=1
))
styles.add(ParagraphStyle(
    name="H2x", parent=styles["Heading2"], fontName="NotoSans-Bold",
    fontSize=12.5, leading=16, textColor=BLUE, spaceBefore=10,
    spaceAfter=5, keepWithNext=1
))
styles.add(ParagraphStyle(
    name="H3x", parent=styles["Heading3"], fontName="NotoSans-Bold",
    fontSize=10.5, leading=13.5, textColor=NAVY, spaceBefore=8,
    spaceAfter=4, keepWithNext=1
))
styles.add(ParagraphStyle(
    name="Bodyx", parent=styles["BodyText"], fontName="NotoSans",
    fontSize=9.4, leading=13.7, spaceAfter=6, textColor=colors.HexColor("#202B35")
))
styles.add(ParagraphStyle(
    name="Listx", parent=styles["BodyText"], fontName="NotoSans",
    fontSize=9.2, leading=13.2, leftIndent=11, firstLineIndent=-8,
    spaceAfter=3.5, textColor=colors.HexColor("#202B35")
))
styles.add(ParagraphStyle(
    name="Smallx", parent=styles["BodyText"], fontName="NotoSans",
    fontSize=8, leading=10.5, textColor=MUTED
))
styles.add(ParagraphStyle(
    name="Cellx", parent=styles["BodyText"], fontName="NotoSans",
    fontSize=8.15, leading=10.5, textColor=colors.HexColor("#202B35")
))
styles.add(ParagraphStyle(
    name="Statusx", parent=styles["BodyText"], fontName="NotoSans",
    fontSize=7.9, leading=10.5, textColor=colors.HexColor("#5B4A31")
))
styles.add(ParagraphStyle(
    name="TOCEntry", parent=styles["BodyText"], fontName="NotoSans",
    fontSize=8.5, leading=11.2, leftIndent=13, firstLineIndent=-13,
    textColor=colors.HexColor("#243746"), spaceBefore=1
))

def esc(text):
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

def inline(text):
    text = esc(text)
    text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
    text = re.sub(r"\*(.+?)\*", r"<i>\1</i>", text)
    text = re.sub(
        r"\[([^\]]+)\]\((https?://[^)]+)\)",
        r'<link href="\2" color="#235B75">\1</link>',
        text
    )
    return text

def draw_page_chrome(canvas, doc):
    canvas.saveState()
    if doc.page > 1:
        canvas.setFont("NotoSans-Bold", 7.2)
        canvas.setFillColor(MUTED)
        canvas.drawString(LEFT, PAGE_HEIGHT - 11 * mm, "THE ELEMENTS  |  ADVANCED SCIENTIFIC REFERENCE")
        canvas.setStrokeColor(RULE)
        canvas.setLineWidth(0.55)
        canvas.line(LEFT, PAGE_HEIGHT - 14 * mm, PAGE_WIDTH - RIGHT, PAGE_HEIGHT - 14 * mm)

        canvas.line(LEFT, 13 * mm, PAGE_WIDTH - RIGHT, 13 * mm)
        canvas.setFont("NotoSans", 7.2)
        canvas.setFillColor(MUTED)
        canvas.drawString(LEFT, 8 * mm, "DEVELOPMENT PREVIEW  |  18 NOVEMBER 2026")
        canvas.drawRightString(PAGE_WIDTH - RIGHT, 8 * mm, f"PAGE {doc.page}")
    canvas.restoreState()

class ReferenceDocTemplate(SimpleDocTemplate):
    def afterFlowable(self, flowable):
        if isinstance(flowable, Paragraph) and flowable.style.name == "ElementTitle":
            key = getattr(flowable, "_bookmarkName", None)
            if key:
                title = flowable.getPlainText()
                self.canv.bookmarkPage(key)
                self.canv.addOutlineEntry(title, key, level=0, closed=False)
                self.notify("TOCEntry", (0, title, self.page, key))

def table_widths(rows):
    count = len(rows[0])
    maxima = []
    for col in range(count):
        longest = max(
            (len(re.sub(r"\s+", " ", row[col])) for row in rows if col < len(row)),
            default=8
        )
        maxima.append(min(4.8, max(1.15, math.sqrt(max(1, longest)))))
    total = sum(maxima)
    return [CONTENT_WIDTH * weight / total for weight in maxima]

def make_table(rows):
    column_count = len(rows[0])
    normalized = [row[:column_count] + [""] * max(0, column_count - len(row)) for row in rows]
    data = [[Paragraph(inline(cell.strip()), styles["Cellx"]) for cell in row] for row in normalized]
    table = Table(
        data,
        colWidths=table_widths(normalized),
        repeatRows=1,
        hAlign="LEFT",
        splitByRow=1,
        spaceBefore=2,
        spaceAfter=5,
    )
    commands = [
        ("BACKGROUND", (0, 0), (-1, 0), PALE),
        ("TEXTCOLOR", (0, 0), (-1, 0), NAVY),
        ("GRID", (0, 0), (-1, -1), 0.35, RULE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5.5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5.5),
        ("TOPPADDING", (0, 0), (-1, -1), 4.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4.5),
    ]
    for row_index in range(1, len(data)):
        if row_index % 2 == 0:
            commands.append(("BACKGROUND", (0, row_index), (-1, row_index), PALE_BLUE))
    table.setStyle(TableStyle(commands))
    return table

def parse_md(path, element_number=None):
    lines = path.read_text(encoding="utf-8").splitlines()
    story = []
    paragraph_lines = []
    table_rows = []
    title_added = False

    def flush_paragraph():
        if paragraph_lines:
            story.append(Paragraph(inline(" ".join(paragraph_lines)), styles["Bodyx"]))
            paragraph_lines.clear()

    def flush_table():
        if table_rows:
            story.append(make_table(table_rows))
            story.append(Spacer(1, 6))
            table_rows.clear()

    for line in lines:
        text = line.strip()

        if text.startswith("|") and text.endswith("|"):
            flush_paragraph()
            cells = [cell.strip() for cell in text.strip("|").split("|")]
            if all(re.fullmatch(r":?-{3,}:?", cell or "-") for cell in cells):
                continue
            table_rows.append(cells)
            continue

        flush_table()

        if not text:
            flush_paragraph()
        elif text in {"---", "***", "___"}:
            flush_paragraph()
        elif re.match(r"^\*{1,2}(Document|Editorial) status:\*{0,2}\s*", text, flags=re.IGNORECASE):
            flush_paragraph()
            match = re.match(
                r"^\*{1,2}(Document|Editorial) status:\*{0,2}\s*(.*?)\*?$",
                text,
                flags=re.IGNORECASE
            )
            status_label = match.group(1).title()
            status_text = match.group(2).strip()
            status_box = Table(
                [[Paragraph(f"<b>{status_label} status:</b> " + inline(status_text), styles["Statusx"])]],
                colWidths=[CONTENT_WIDTH],
                hAlign="LEFT"
            )
            status_box.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), STATUS),
                ("BOX", (0, 0), (-1, -1), 0.45, colors.HexColor("#D8C9AA")),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]))
            if story and isinstance(story[-1], Paragraph):
                previous = story.pop()
                story.append(KeepTogether([previous, Spacer(1, 4), status_box]))
            else:
                story.append(status_box)
        elif text.startswith("# "):
            flush_paragraph()
            title = text[2:]
            if element_number is not None and not title_added:
                title_para = Paragraph(inline(title), styles["ElementTitle"])
                title_para._bookmarkName = f"element-{element_number:03d}"
                story.append(title_para)
                title_added = True
            else:
                story.append(Paragraph(inline(title), styles["H1x"]))
        elif text.startswith("## "):
            flush_paragraph()
            story.append(Paragraph(inline(text[3:]), styles["H2x"]))
        elif text.startswith("### "):
            flush_paragraph()
            story.append(Paragraph(inline(text[4:]), styles["H3x"]))
        elif text.startswith("- ") or re.match(r"^\d+\.\s", text):
            flush_paragraph()
            item = re.sub(r"^(- |\d+\.\s)", "", text)
            story.append(Paragraph("• " + inline(item), styles["Listx"]))
        else:
            paragraph_lines.append(text)

    flush_paragraph()
    flush_table()
    return story

# Fail the build rather than silently publishing a partial reference.
element_files = sorted((ROOT / "elements").glob("[0-9][0-9][0-9]-*.md"))
numbers = [int(path.name[:3]) for path in element_files]
expected = list(range(1, 119))
if numbers != expected:
    missing = sorted(set(expected) - set(numbers))
    duplicates = sorted({n for n in numbers if numbers.count(n) > 1})
    raise RuntimeError(f"Expected exactly 118 element monographs. Missing={missing}; duplicates={duplicates}")

index_file = ROOT / "elements" / "INDEX.md"
index_text = index_file.read_text(encoding="utf-8")
indexed_numbers = [
    int(match.group(1))
    for line in index_text.splitlines()
    if (match := re.match(r"^\|\s*(\d{1,3})\s*\|", line))
]
if indexed_numbers != expected:
    raise RuntimeError("INDEX.md does not contain exactly one ordered register row for elements 1-118.")

standards_file = ROOT / "editorial" / "SCIENTIFIC-STANDARDS.md"
if not standards_file.exists():
    raise FileNotFoundError(f"Required editorial standards file not found: {standards_file}")

toc = TableOfContents()
toc.levelStyles = [styles["TOCEntry"]]
toc.dotsMinLevel = 0

story = [
    Spacer(1, 49 * mm),
    Paragraph("THE ELEMENTS", styles["CoverTitle"]),
    Paragraph("AN ADVANCED SCIENTIFIC AND RESEARCH REFERENCE", styles["CoverSub"]),
    Spacer(1, 13 * mm),
    Paragraph(
        "Atomic structure  •  Nuclear properties  •  Spectroscopy  •  Chemistry  •  Materials science",
        styles["CoverTag"]
    ),
    Spacer(1, 36 * mm),
    Paragraph("118 ELEMENTS  |  ATOMIC NUMBERS 1-118", styles["CoverTag"]),
    Spacer(1, 7 * mm),
    Paragraph("DEVELOPMENT PREVIEW  •  18 NOVEMBER 2026", styles["CoverSub"]),
    Spacer(1, 8 * mm),
    Paragraph(
        "An evolving research reference. Individual monographs remain drafts and are not yet "
        "a complete or fully peer-reviewed encyclopedia.",
        styles["Smallx"]
    ),
    PageBreak(),
    Paragraph("Contents", styles["H1x"]),
    toc,
    PageBreak(),
]

story.extend(parse_md(standards_file))
story.append(PageBreak())
story.extend(parse_md(index_file))

for element_file in element_files:
    element_number = int(element_file.name[:3])
    story.append(PageBreak())
    story.extend(parse_md(element_file, element_number=element_number))

doc = ReferenceDocTemplate(
    str(OUT),
    pagesize=PAGE,
    rightMargin=RIGHT,
    leftMargin=LEFT,
    topMargin=TOP,
    bottomMargin=BOTTOM,
    title="The Elements: An Advanced Scientific and Research Reference",
    author="Scientific Reference Project",
    subject="A research reference covering the 118 chemical elements",
)
doc.multiBuild(story, onFirstPage=draw_page_chrome, onLaterPages=draw_page_chrome, maxPasses=5)
print(
    f"Built {OUT} ({OUT.stat().st_size} bytes); "
    f"page size=A4; elements={len(element_files)}; "
    f"TOC entries={len(element_files)}"
)
