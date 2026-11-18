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
OUT = ROOT / "dist" / "The_Elements_Advanced_Scientific_Reference_Professional.pdf"
OUT.parent.mkdir(parents=True, exist_ok=True)

# A4 is a standard, print-friendly page size with enough width for research tables.
PAGE = A4
PAGE_WIDTH, PAGE_HEIGHT = PAGE
LEFT = RIGHT = 19 * mm
TOP = 24 * mm
BOTTOM = 21 * mm
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
BLUE = colors.HexColor("#1F5F85")
BLUE_DARK = colors.HexColor("#174663")
BLUE_MID = colors.HexColor("#4F88A8")
MUTED = colors.HexColor("#647789")
RULE = colors.HexColor("#C9D7E2")
PALE = colors.HexColor("#E8F0F6")
PALE_BLUE = colors.HexColor("#F3F7FA")
PALE_CYAN = colors.HexColor("#EAF4F8")
STATUS = colors.HexColor("#F5F7F9")
WARNING = colors.HexColor("#FCF5E8")
WARNING_RULE = colors.HexColor("#D9B979")
TEXT = colors.HexColor("#1E2A35")
WHITE = colors.white

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(
    name="CoverTitle", parent=styles["Title"], fontName="NotoSans-Bold",
    fontSize=32, leading=40, alignment=TA_CENTER, textColor=NAVY,
    spaceAfter=12
))
styles.add(ParagraphStyle(
    name="CoverSub", parent=styles["Normal"], fontName="NotoSans",
    fontSize=11.5, leading=17, alignment=TA_CENTER, textColor=MUTED
))
styles.add(ParagraphStyle(
    name="CoverTag", parent=styles["Normal"], fontName="NotoSans-Bold",
    fontSize=9.2, leading=14, alignment=TA_CENTER, textColor=BLUE
))
styles.add(ParagraphStyle(
    name="CoverMeta", parent=styles["Normal"], fontName="NotoSans",
    fontSize=9.1, leading=13.5, textColor=TEXT
))
styles.add(ParagraphStyle(
    name="H1x", parent=styles["Heading1"], fontName="NotoSans-Bold",
    fontSize=19, leading=25, textColor=NAVY, spaceBefore=14,
    spaceAfter=11, keepWithNext=1
))
styles.add(ParagraphStyle(
    name="ElementTitle", parent=styles["Heading1"], fontName="NotoSans-Bold",
    fontSize=21, leading=27, textColor=NAVY, spaceBefore=3,
    spaceAfter=12, keepWithNext=1
))
styles.add(ParagraphStyle(
    name="H2x", parent=styles["Heading2"], fontName="NotoSans-Bold",
    fontSize=13.5, leading=18, textColor=BLUE_DARK, spaceBefore=12,
    spaceAfter=6, keepWithNext=1
))
styles.add(ParagraphStyle(
    name="H3x", parent=styles["Heading3"], fontName="NotoSans-Bold",
    fontSize=11.5, leading=15.5, textColor=NAVY, spaceBefore=9,
    spaceAfter=5, keepWithNext=1
))
styles.add(ParagraphStyle(
    name="Bodyx", parent=styles["BodyText"], fontName="NotoSans",
    fontSize=10.1, leading=15.1, spaceAfter=7.2, textColor=TEXT,
    allowWidows=0, allowOrphans=0
))
styles.add(ParagraphStyle(
    name="Listx", parent=styles["BodyText"], fontName="NotoSans",
    fontSize=9.8, leading=14.4, leftIndent=13, firstLineIndent=-9,
    spaceAfter=4.5, textColor=TEXT, allowWidows=0, allowOrphans=0
))
styles.add(ParagraphStyle(
    name="Smallx", parent=styles["BodyText"], fontName="NotoSans",
    fontSize=8.4, leading=11.5, textColor=MUTED
))
styles.add(ParagraphStyle(
    name="Cellx", parent=styles["BodyText"], fontName="NotoSans",
    fontSize=8.8, leading=12.2, textColor=TEXT,
    allowWidows=0, allowOrphans=0
))
styles.add(ParagraphStyle(
    name="CellHeadx", parent=styles["BodyText"], fontName="NotoSans-Bold",
    fontSize=8.5, leading=11.5, textColor=WHITE
))
styles.add(ParagraphStyle(
    name="Statusx", parent=styles["BodyText"], fontName="NotoSans",
    fontSize=8.7, leading=12.5, textColor=TEXT
))
styles.add(ParagraphStyle(
    name="MetaLabelx", parent=styles["BodyText"], fontName="NotoSans-Bold",
    fontSize=7.8, leading=10.5, textColor=BLUE_DARK
))
styles.add(ParagraphStyle(
    name="MetaValuex", parent=styles["BodyText"], fontName="NotoSans",
    fontSize=8.5, leading=11.3, textColor=TEXT
))
styles.add(ParagraphStyle(
    name="TOCEntry", parent=styles["BodyText"], fontName="NotoSans",
    fontSize=9.2, leading=12.6, leftIndent=15, firstLineIndent=-15,
    textColor=colors.HexColor("#243746"), spaceBefore=1.7
))

def esc(text):
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

def inline(text):
    text = esc(text)
    saved_links = []

    def hold_markdown_link(match):
        saved_links.append((match.group(1), match.group(2)))
        return f"__PDF_LINK_{len(saved_links) - 1}__"

    # Preserve Markdown links first so the bare-URL pass does not nest anchors.
    text = re.sub(
        r"\[([^\]]+)\]\((https?://[^)\s]+)\)",
        hold_markdown_link,
        text
    )

    def hold_bare_url(match):
        raw = match.group(0)
        url = raw.rstrip(".,;:)")
        trailing = raw[len(url):]
        saved_links.append((url, url))
        return f"__PDF_LINK_{len(saved_links) - 1}__{trailing}"

    text = re.sub(r"https?://[^\s<]+", hold_bare_url, text)

    for index, (label, url) in enumerate(saved_links):
        anchor = f'<link href="{url}" color="#235B75">{label}</link>'
        text = text.replace(f"__PDF_LINK_{index}__", anchor)

    text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
    text = re.sub(r"\*(.+?)\*", r"<i>\1</i>", text)
    return text

def draw_page_chrome(canvas, doc):
    canvas.saveState()
    if doc.page > 1:
        canvas.setFillColor(BLUE_DARK)
        canvas.setFont("NotoSans-Bold", 7.4)
        canvas.drawString(LEFT, PAGE_HEIGHT - 12.5 * mm, "THE ELEMENTS  |  SCIENTIFIC REFERENCE")
        canvas.setFont("NotoSans", 7.2)
        canvas.setFillColor(MUTED)
        canvas.drawRightString(PAGE_WIDTH - RIGHT, PAGE_HEIGHT - 12.5 * mm, "RESEARCH WORKING EDITION")
        canvas.setStrokeColor(RULE)
        canvas.setLineWidth(0.6)
        canvas.line(LEFT, PAGE_HEIGHT - 15.5 * mm, PAGE_WIDTH - RIGHT, PAGE_HEIGHT - 15.5 * mm)

        canvas.setStrokeColor(RULE)
        canvas.line(LEFT, 14 * mm, PAGE_WIDTH - RIGHT, 14 * mm)
        canvas.setFillColor(MUTED)
        canvas.setFont("NotoSans", 7.3)
        canvas.drawString(LEFT, 8.7 * mm, "SCIENTIFIC AUDIT COVERAGE: ELEMENTS 1-30  |  FULL REVIEW IN PROGRESS")
        canvas.drawRightString(PAGE_WIDTH - RIGHT, 8.7 * mm, f"PAGE {doc.page}")
    canvas.restoreState()


def draw_cover(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(NAVY)
    canvas.rect(0, PAGE_HEIGHT - 31 * mm, PAGE_WIDTH, 31 * mm, stroke=0, fill=1)
    canvas.setFillColor(BLUE)
    canvas.rect(0, PAGE_HEIGHT - 33 * mm, PAGE_WIDTH, 2 * mm, stroke=0, fill=1)
    canvas.setFillColor(PALE_BLUE)
    canvas.rect(0, 0, PAGE_WIDTH, 17 * mm, stroke=0, fill=1)
    canvas.setFillColor(BLUE_DARK)
    canvas.rect(0, 0, 5 * mm, PAGE_HEIGHT, stroke=0, fill=1)
    canvas.setStrokeColor(RULE)
    canvas.setLineWidth(0.7)
    canvas.line(23 * mm, 26 * mm, PAGE_WIDTH - 18 * mm, 26 * mm)
    canvas.setFont("NotoSans-Bold", 8)
    canvas.setFillColor(WHITE)
    canvas.drawString(23 * mm, PAGE_HEIGHT - 19 * mm, "SCIENTIFIC REFERENCE SERIES")
    canvas.setFont("NotoSans", 7.4)
    canvas.setFillColor(MUTED)
    canvas.drawString(23 * mm, 10 * mm, "VERSION 0.3  |  18 NOVEMBER 2026")
    canvas.drawRightString(PAGE_WIDTH - 18 * mm, 10 * mm, "EDITORIAL WORKING COPY")
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
    data = []
    for row_index, row in enumerate(normalized):
        cells = []
        for cell in row:
            style = styles["CellHeadx"] if row_index == 0 else styles["Cellx"]
            cells.append(Paragraph(inline(cell.strip()), style))
        data.append(cells)

    table = Table(
        data,
        colWidths=table_widths(normalized),
        repeatRows=1,
        hAlign="LEFT",
        splitByRow=1,
        spaceBefore=3,
        spaceAfter=7,
    )
    commands = [
        ("BACKGROUND", (0, 0), (-1, 0), BLUE_DARK),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("GRID", (0, 0), (-1, -1), 0.4, RULE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6.5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6.5),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]
    for row_index in range(1, len(data)):
        fill = PALE_BLUE if row_index % 2 == 0 else WHITE
        commands.append(("BACKGROUND", (0, row_index), (-1, row_index), fill))
    table.setStyle(TableStyle(commands))
    return table


def make_metadata_table(pairs):
    rows = []
    for i in range(0, len(pairs), 2):
        left = pairs[i]
        right = pairs[i + 1] if i + 1 < len(pairs) else ("", "")
        rows.append([
            Paragraph(inline(left[0]), styles["MetaLabelx"]),
            Paragraph(inline(left[1]), styles["MetaValuex"]),
            Paragraph(inline(right[0]), styles["MetaLabelx"]) if right[0] else "",
            Paragraph(inline(right[1]), styles["MetaValuex"]) if right[1] else "",
        ])
    table = Table(
        rows,
        colWidths=[29 * mm, 58 * mm, 29 * mm, CONTENT_WIDTH - 116 * mm],
        hAlign="LEFT",
        spaceBefore=1,
        spaceAfter=8,
    )
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), PALE),
        ("BACKGROUND", (2, 0), (2, -1), PALE),
        ("BACKGROUND", (1, 0), (1, -1), PALE_BLUE),
        ("BACKGROUND", (3, 0), (3, -1), PALE_BLUE),
        ("GRID", (0, 0), (-1, -1), 0.35, RULE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return table


def make_heading_panel(title, style):
    para = Paragraph(inline(title), style)
    if style.name == "H2x":
        panel = Table([[para]], colWidths=[CONTENT_WIDTH], hAlign="LEFT")
        panel.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), PALE_BLUE),
            ("LINEBEFORE", (0, 0), (0, -1), 2.3, BLUE),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ]))
        panel.keepWithNext = 1
        return panel
    return para

def parse_md(path, element_number=None):
    lines = path.read_text(encoding="utf-8").splitlines()
    story = []
    paragraph_lines = []
    table_rows = []
    metadata_pairs = []
    title_added = False
    metadata_scan = element_number is not None

    def flush_paragraph():
        if paragraph_lines:
            story.append(Paragraph(inline(" ".join(paragraph_lines)), styles["Bodyx"]))
            paragraph_lines.clear()

    def flush_table():
        if table_rows:
            story.append(make_table(table_rows))
            story.append(Spacer(1, 7))
            table_rows.clear()

    def flush_metadata():
        if metadata_pairs:
            story.append(make_metadata_table(metadata_pairs))
            metadata_pairs.clear()

    def add_callout(label, value, tone="blue"):
        box = Table(
            [[Paragraph(f"<b>{esc(label)}</b> " + inline(value), styles["Statusx"])]],
            colWidths=[CONTENT_WIDTH],
            hAlign="LEFT"
        )
        if tone == "warning":
            bg, rule = WARNING, WARNING_RULE
        elif tone == "neutral":
            bg, rule = PALE, RULE
        else:
            bg, rule = PALE_CYAN, BLUE_MID
        box.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), bg),
            ("BOX", (0, 0), (-1, -1), 0.55, rule),
            ("LINEBEFORE", (0, 0), (0, -1), 2.2, BLUE if tone != "warning" else WARNING_RULE),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ]))
        story.append(box)
        story.append(Spacer(1, 5))

    for line in lines:
        text = line.strip()

        # Element identity fields become a compact but readable data grid.
        if metadata_scan and title_added:
            if not text:
                continue
            if text.startswith("## ") or text.startswith("# "):
                flush_metadata()
                metadata_scan = False
            else:
                meta_match = re.match(r"^\*\*(.+?):\*\*\s*(.*?)$", text)
                if meta_match:
                    label = meta_match.group(1).strip()
                    value = meta_match.group(2).strip()
                    if label.lower() == "block note":
                        flush_metadata()
                        metadata_scan = False
                        add_callout("Block note:", value, tone="neutral")
                        continue
                    elif not re.match(r"^(Editorial|Document) status$", label, re.I):
                        metadata_pairs.append((label, value))
                        continue
                elif metadata_pairs:
                    flush_metadata()
                    metadata_scan = False

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
            flush_metadata()
        elif re.match(r"^\*{1,2}(Document|Editorial) status:\*{0,2}\s*", text, flags=re.IGNORECASE):
            flush_paragraph()
            flush_metadata()
            match = re.match(
                r"^\*{1,2}(Document|Editorial) status:\*{0,2}\s*(.*?)\*?$",
                text,
                flags=re.IGNORECASE
            )
            status_label = match.group(1).title()
            status_text = match.group(2).strip()
            tone = "warning" if re.search(r"draft|pending|in progress|not complete|not yet", status_text, re.I) else "blue"
            add_callout(f"{status_label} status:", status_text, tone=tone)
        elif re.match(r"^\*{1,2}(Evidence classification|Evidence status|Data status|Important|Caution|Scope note):\*{0,2}", text, flags=re.IGNORECASE):
            flush_paragraph()
            flush_metadata()
            match = re.match(r"^\*{1,2}([^:]+):\*{0,2}\s*(.*?)$", text)
            label, value = match.group(1).strip()+":", match.group(2).strip()
            tone = "warning" if re.search(r"caution|unknown|pending|not complete|not yet", label+" "+value, re.I) else "blue"
            add_callout(label, value, tone=tone)
        elif text.startswith("# "):
            flush_paragraph()
            flush_metadata()
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
            flush_metadata()
            heading_panel = make_heading_panel(text[3:], styles["H2x"])
            heading_space = Spacer(1, 4)
            heading_panel.keepWithNext = 1
            heading_space.keepWithNext = 1
            story.extend([heading_panel, heading_space])
        elif text.startswith("### "):
            flush_paragraph()
            flush_metadata()
            story.append(Paragraph(inline(text[4:]), styles["H3x"]))
        elif text.startswith("- ") or re.match(r"^\d+\.\s", text):
            flush_paragraph()
            flush_metadata()
            ordered = re.match(r"^(\d+)\.\s", text)
            if ordered:
                item = re.sub(r"^\d+\.\s", "", text)
                prefix = f"<b>{ordered.group(1)}.</b> "
            else:
                item = re.sub(r"^-\s", "", text)
                prefix = "• "
            story.append(Paragraph(prefix + inline(item), styles["Listx"]))
        else:
            paragraph_lines.append(text)

    flush_paragraph()
    flush_table()
    flush_metadata()
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
audit_file = ROOT / "editorial" / "AUDIT-LOG.md"
research_register_file = ROOT / "editorial" / "RESEARCH-SOURCE-REGISTER.md"
for required_file in (standards_file, audit_file, research_register_file):
    if not required_file.exists():
        raise FileNotFoundError(f"Required editorial file not found: {required_file}")

toc = TableOfContents()
toc.levelStyles = [styles["TOCEntry"]]
toc.dotsMinLevel = 0

story = [
    Spacer(1, 48 * mm),
    Paragraph("THE ELEMENTS", styles["CoverTitle"]),
    Paragraph("AN ADVANCED SCIENTIFIC AND RESEARCH REFERENCE", styles["CoverSub"]),
    Spacer(1, 14 * mm),
    Paragraph(
        "ATOMIC STRUCTURE  |  NUCLEAR DATA  |  SPECTROSCOPY  |  CHEMISTRY  |  MATERIALS SCIENCE",
        styles["CoverTag"]
    ),
    Spacer(1, 29 * mm),
    Paragraph("118 ELEMENTS  |  ATOMIC NUMBERS 1-118", styles["CoverTag"]),
    Spacer(1, 6 * mm),
    Paragraph("VERSION 0.3  |  RESEARCH WORKING EDITION  |  18 NOVEMBER 2026", styles["CoverSub"]),
    Spacer(1, 12 * mm),
    Table(
        [[
            Paragraph("<b>PHASE I BASELINE</b><br/>Elements 1-30: limited atomic and isotope-data cross-check against CIAAW 2024 and NIST ASD 5.12.", styles["CoverMeta"]),
            Paragraph("<b>REMAINING REVIEW</b><br/>Elements 31-118 and all outstanding property domains remain in the audit queue.", styles["CoverMeta"])
        ]],
        colWidths=[CONTENT_WIDTH / 2, CONTENT_WIDTH / 2],
        style=TableStyle([
            ("BACKGROUND", (0, 0), (0, 0), PALE_CYAN),
            ("BACKGROUND", (1, 0), (1, 0), WARNING),
            ("BOX", (0, 0), (0, 0), 0.6, BLUE_MID),
            ("BOX", (1, 0), (1, 0), 0.6, WARNING_RULE),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 9),
            ("RIGHTPADDING", (0, 0), (-1, -1), 9),
            ("TOPPADDING", (0, 0), (-1, -1), 9),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
        ])
    ),
    Spacer(1, 8 * mm),
    Paragraph(
        "This working edition preserves the distinction between evaluated reference data, primary research, calculated results, estimates and unresolved fields. It is not a claim that all 118 monographs have completed full scientific review.",
        styles["Smallx"]
    ),
    PageBreak(),
    Paragraph("Contents", styles["H1x"]),
    toc,
    PageBreak(),
]

story.extend(parse_md(standards_file))
story.append(PageBreak())
story.extend(parse_md(audit_file))
story.append(PageBreak())
story.extend(parse_md(research_register_file))
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
    subject="Research working edition. Limited Phase I atomic and isotopic baseline reviewed for elements 1-30; full monograph review remains in progress.",
    keywords="118 elements, CIAAW 2024, NIST ASD 5.12, atomic structure, isotopic composition, ionization energy, spectroscopy, nuclear data, chemistry, materials science",
)
doc.multiBuild(story, onFirstPage=draw_cover, onLaterPages=draw_page_chrome, maxPasses=5)
print(
    f"Built {OUT} ({OUT.stat().st_size} bytes); "
    f"page size=A4; elements={len(element_files)}; "
    f"Phase I scope=1-30; TOC entries={len(element_files)}"
)
