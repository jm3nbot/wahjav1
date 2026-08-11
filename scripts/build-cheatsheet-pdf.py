"""Build the Direct Drive Abu Dhabi branded cheat-sheet PDF."""
import json, re, os
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor, Color
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader
from PIL import Image
import io

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "DirectDrive-CheatSheets.pdf")

# Brand
INK = HexColor("#0D2117")
INK_2 = HexColor("#1C3A28")
CREAM = HexColor("#F7F5F0")
CREAM_DIM = HexColor("#EDE9DF")
GOLD = HexColor("#C9A84C")
RULE_DARK = Color(13/255, 33/255, 23/255, 0.12)
RULE_LIGHT = Color(247/255, 245/255, 240/255, 0.18)
TYPE_COLORS = {
    "mandatory": HexColor("#B23B3B"),
    "warning": HexColor("#E8B73A"),
    "informative": HexColor("#2C4A6E"),
}

PAGE_W, PAGE_H = A4
MARGIN = 36

# Load data
with open(os.path.join(ROOT, "data/driving-pdf/signs.js")) as f:
    s = f.read()
m = re.search(r"window\.OFFICIAL_DRIVING_SIGNS\s*=\s*(\{.*\});?\s*\Z", s, re.S)
DATA = json.loads(m.group(1))
SIGNS = DATA["signs"]
POLICE = DATA.get("policeSignals", [])

with open("/tmp/rules.json") as f:
    RULES = json.load(f)

LOGO = os.path.join(ROOT, "assets/logo.png")

# ---------- helpers ----------
def header(c, page_label, page_num, total):
    # top brand bar
    c.setFillColor(INK)
    c.rect(0, PAGE_H - 56, PAGE_W, 56, fill=1, stroke=0)
    # gold rule under bar
    c.setFillColor(GOLD)
    c.rect(0, PAGE_H - 58, PAGE_W, 2, fill=1, stroke=0)
    # logo
    try:
        c.drawImage(LOGO, MARGIN, PAGE_H - 50, width=34, height=34,
                    mask="auto", preserveAspectRatio=True)
    except Exception:
        pass
    # wordmark
    c.setFillColor(CREAM)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(MARGIN + 44, PAGE_H - 30, "DIRECT DRIVE")
    c.setFont("Helvetica", 8)
    c.setFillColor(GOLD)
    c.drawString(MARGIN + 44, PAGE_H - 42, "ABU DHABI · CHEAT SHEET")
    # right side label
    c.setFont("Helvetica", 8)
    c.setFillColor(CREAM)
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 30, page_label.upper())
    c.setFillColor(GOLD)
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 42, f"PAGE {page_num} / {total}")

def footer(c):
    c.setFillColor(INK)
    c.rect(0, 0, PAGE_W, 26, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(0, 26, PAGE_W, 1, fill=1, stroke=0)
    c.setFillColor(CREAM)
    c.setFont("Helvetica", 7)
    c.drawString(MARGIN, 10, "© DIRECT DRIVE · directdrive.ae · Independent · Not affiliated with ADTM or TAMM")
    c.drawRightString(PAGE_W - MARGIN, 10, "BUILT IN ABU DHABI")

def section_title(c, y, kicker, title):
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(MARGIN, y, kicker.upper())
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 22)
    c.drawString(MARGIN, y - 22, title)
    # gold underline
    c.setFillColor(GOLD)
    c.rect(MARGIN, y - 30, 40, 2, fill=1, stroke=0)
    return y - 48

def wrap_text(text, max_chars):
    words = text.split()
    lines, line = [], ""
    for w in words:
        candidate = (line + " " + w).strip()
        if len(candidate) <= max_chars:
            line = candidate
        else:
            if line: lines.append(line)
            line = w
    if line: lines.append(line)
    return lines

# ---------- COVER ----------
def draw_cover(c):
    # Full bleed forest green
    c.setFillColor(INK)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    # subtle gold corner ticks
    c.setStrokeColor(GOLD)
    c.setLineWidth(1.2)
    s = 18
    for (x, y, dx, dy) in [
        (MARGIN, PAGE_H - MARGIN, 1, -1),
        (PAGE_W - MARGIN, PAGE_H - MARGIN, -1, -1),
        (MARGIN, MARGIN, 1, 1),
        (PAGE_W - MARGIN, MARGIN, -1, 1),
    ]:
        c.line(x, y, x + dx*s, y)
        c.line(x, y, x, y + dy*s)
    # logo center top
    try:
        c.drawImage(LOGO, PAGE_W/2 - 32, PAGE_H - 180, width=64, height=64,
                    mask="auto", preserveAspectRatio=True)
    except Exception:
        pass
    # Title
    c.setFillColor(CREAM)
    c.setFont("Helvetica-Bold", 36)
    c.drawCentredString(PAGE_W/2, PAGE_H - 260, "The Cheat Sheet.")
    c.setFillColor(GOLD)
    c.setFont("Helvetica-BoldOblique", 36)
    c.drawCentredString(PAGE_W/2, PAGE_H - 300, "Signs · Rules · Signals.")
    # Sub
    c.setFillColor(CREAM)
    c.setFont("Helvetica", 11)
    sub = "A clean print-ready reference for the Abu Dhabi theory test."
    c.drawCentredString(PAGE_W/2, PAGE_H - 340, sub)
    # Stats row
    stats = [
        ("85", "VISUAL SIGN CARDS"),
        ("14", "RULE REMINDERS"),
        ("5", "POLICE SIGNALS"),
    ]
    bx = PAGE_W/2 - 240
    for i, (k, v) in enumerate(stats):
        x = bx + i*160
        c.setFillColor(GOLD)
        c.setFont("Helvetica-Bold", 32)
        c.drawCentredString(x + 80, PAGE_H/2 - 30, k)
        c.setFillColor(CREAM)
        c.setFont("Helvetica", 8)
        c.drawCentredString(x + 80, PAGE_H/2 - 50, v)
        # divider
        if i < 2:
            c.setStrokeColor(Color(247/255, 245/255, 240/255, 0.18))
            c.line(x + 160, PAGE_H/2 - 60, x + 160, PAGE_H/2 - 10)
    # Brand strip near bottom
    c.setFillColor(GOLD)
    c.rect(MARGIN, 110, PAGE_W - MARGIN*2, 1, fill=1, stroke=0)
    c.setFillColor(CREAM)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(MARGIN, 90, "DIRECT DRIVE · ABU DHABI")
    c.setFillColor(GOLD)
    c.setFont("Helvetica", 8)
    c.drawRightString(PAGE_W - MARGIN, 90, "directdrive.ae")
    c.setFillColor(CREAM)
    c.setFont("Helvetica", 8)
    c.drawString(MARGIN, 70, "Your Abu Dhabi driving license, finally made clear.")

# ---------- TOC ----------
def draw_toc(c, total_pages):
    header(c, "Contents", 1, total_pages)
    y = PAGE_H - 100
    y = section_title(c, y, "§ I", "Contents")
    items = [
        ("Mandatory signs", "Section II"),
        ("Warning signs", "Section III"),
        ("Informative signs", "Section IV"),
        ("Road rules", "Section V"),
        ("Police hand signals", "Section VI"),
    ]
    c.setFont("Helvetica", 12)
    for label, ref in items:
        c.setFillColor(INK)
        c.drawString(MARGIN, y, label)
        c.setFillColor(GOLD)
        c.setFont("Helvetica", 9)
        c.drawRightString(PAGE_W - MARGIN, y, ref.upper())
        c.setFont("Helvetica", 12)
        # dotted leader
        c.setStrokeColor(RULE_DARK)
        c.setDash(1, 3)
        c.line(MARGIN + 130, y + 3, PAGE_W - MARGIN - 80, y + 3)
        c.setDash()
        y -= 26
    footer(c)

# ---------- SIGNS GRID ----------
def draw_signs_section(c, page_no_ref, total_ref, signs, kicker, title, type_filter):
    cols = 3
    cell_w = (PAGE_W - MARGIN*2) / cols
    cell_h = 150
    rows_per_page = 4

    def start_page(first):
        nonlocal y
        # cream bg for every page in the section
        c.setFillColor(CREAM)
        c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
        header(c, title, page_no_ref[0], total_ref[0])
        if first:
            y = section_title(c, PAGE_H - 100, kicker, title)
        else:
            y = PAGE_H - 110
        return y

    items = [s for s in signs if s["type"] == type_filter]
    y = 0
    first = True
    i = 0
    while i < len(items):
        y = start_page(first)
        first = False
        page_top = y
        # draw up to rows_per_page * cols cards
        for r in range(rows_per_page):
            for col in range(cols):
                if i >= len(items): break
                cx = MARGIN + col * cell_w
                cy = page_top - r * cell_h - cell_h + 10
                draw_sign_card(c, items[i], cx + 6, cy + 8, cell_w - 12, cell_h - 16)
                i += 1
            if i >= len(items): break
        footer(c)
        c.showPage()
        page_no_ref[0] += 1

def draw_sign_card(c, sign, x, y, w, h):
    # type tag bar
    tcol = TYPE_COLORS.get(sign["type"], INK)
    c.setFillColor(tcol)
    c.rect(x, y + h - 4, 28, 3, fill=1, stroke=0)
    # card border
    c.setStrokeColor(RULE_DARK)
    c.setLineWidth(0.5)
    c.rect(x, y, w, h - 8, fill=0, stroke=1)
    # image area
    img_h = h - 50
    img_path = os.path.join(ROOT, sign["image"])
    if os.path.exists(img_path):
        try:
            c.drawImage(img_path, x + 8, y + 32, width=w - 16, height=img_h - 8,
                        preserveAspectRatio=True, mask="auto", anchor="c")
        except Exception:
            pass
    # type text
    c.setFillColor(tcol)
    c.setFont("Helvetica-Bold", 6)
    c.drawString(x + 6, y + 22, sign["type"].upper())
    # label
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 9)
    label_lines = wrap_text(sign["label"], 28)[:2]
    for li, line in enumerate(label_lines):
        c.drawString(x + 6, y + 12 - li * 10, line)

# ---------- RULES ----------
def draw_rules_section(c, page_no_ref, total_ref):
    c.setFillColor(CREAM); c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    header(c, "Road Rules", page_no_ref[0], total_ref[0])
    y = section_title(c, PAGE_H - 100, "§ V", "Road Rules")

    # group rules
    groups = {}
    for r in RULES:
        groups.setdefault(r["group"], []).append(r)

    col_w = (PAGE_W - MARGIN*2 - 16) / 2
    cx, cy = MARGIN, y - 6
    col = 0
    for g, items in groups.items():
        # group header
        block_h = 28 + len(items) * 56 + 8
        if cy - block_h < 60:
            if col == 0:
                col = 1
                cx = MARGIN + col_w + 16
                cy = y - 6
            else:
                footer(c); c.showPage()
                page_no_ref[0] += 1
                c.setFillColor(CREAM); c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
                header(c, "Road Rules", page_no_ref[0], total_ref[0])
                cy = PAGE_H - 100
                col = 0
                cx = MARGIN

        # group label
        c.setFillColor(GOLD)
        c.setFont("Helvetica-Bold", 9)
        c.drawString(cx, cy, g.upper())
        c.setFillColor(GOLD)
        c.rect(cx, cy - 4, 22, 1.5, fill=1, stroke=0)
        cy -= 18

        for item in items:
            # k
            c.setFillColor(Color(13/255, 33/255, 23/255, 0.7))
            c.setFont("Helvetica", 9)
            c.drawString(cx, cy, item["k"])
            # v
            c.setFillColor(INK)
            c.setFont("Helvetica-Bold", 14)
            c.drawString(cx, cy - 16, item["v"])
            # note
            c.setFillColor(Color(13/255, 33/255, 23/255, 0.6))
            c.setFont("Helvetica", 8)
            note_lines = wrap_text(item["note"], 60)[:2]
            for ni, line in enumerate(note_lines):
                c.drawString(cx, cy - 30 - ni * 9, line)
            # divider
            c.setStrokeColor(RULE_DARK)
            c.setLineWidth(0.4)
            c.line(cx, cy - 50, cx + col_w - 4, cy - 50)
            cy -= 56
        cy -= 8
    footer(c)
    c.showPage()
    page_no_ref[0] += 1

# ---------- POLICE ----------
def draw_police_section(c, page_no_ref, total_ref):
    c.setFillColor(CREAM); c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    header(c, "Police Signals", page_no_ref[0], total_ref[0])
    y = section_title(c, PAGE_H - 100, "§ VI", "Police Hand Signals")

    cy = y - 6
    for sig in POLICE:
        if cy < 200:
            footer(c); c.showPage()
            page_no_ref[0] += 1
            c.setFillColor(CREAM); c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
            header(c, "Police Signals", page_no_ref[0], total_ref[0])
            cy = PAGE_H - 100

        block_h = 130
        # border
        c.setStrokeColor(RULE_DARK)
        c.setLineWidth(0.6)
        c.rect(MARGIN, cy - block_h, PAGE_W - MARGIN*2, block_h, fill=0, stroke=1)
        # image — crop top ~22% to drop the caption baked into the source PNG
        img_path = os.path.join(ROOT, sig["image"])
        if os.path.exists(img_path):
            try:
                pil = Image.open(img_path)
                w0, h0 = pil.size
                pil = pil.crop((0, int(h0 * 0.22), w0, h0))
                buf = io.BytesIO()
                pil.save(buf, format="PNG")
                buf.seek(0)
                c.drawImage(ImageReader(buf), MARGIN + 12, cy - block_h + 12,
                            width=130, height=block_h - 24,
                            preserveAspectRatio=True, mask="auto", anchor="c")
            except Exception:
                pass
        # divider
        c.setStrokeColor(RULE_DARK)
        c.line(MARGIN + 158, cy - block_h + 14, MARGIN + 158, cy - 14)
        # label
        tx = MARGIN + 174
        c.setFillColor(GOLD)
        c.setFont("Helvetica-Bold", 8)
        c.drawString(tx, cy - 22, "TRAFFIC AUTHORITY SIGNAL")
        c.setFillColor(INK)
        c.setFont("Helvetica-Bold", 16)
        c.drawString(tx, cy - 44, sig["label"])
        # desc
        c.setFillColor(Color(13/255, 33/255, 23/255, 0.66))
        c.setFont("Helvetica", 10)
        for li, line in enumerate(wrap_text(sig["desc"], 70)[:3]):
            c.drawString(tx, cy - 64 - li * 13, line)
        # source
        c.setFillColor(Color(13/255, 33/255, 23/255, 0.4))
        c.setFont("Helvetica-Oblique", 7)
        c.drawString(tx, cy - block_h + 14, sig.get("source", ""))
        cy -= block_h + 12
    footer(c)
    c.showPage()
    page_no_ref[0] += 1

# ---------- COUNT PAGES (rough) ----------
def estimate_total():
    cols, rows = 3, 4
    per = cols * rows
    total = 1  # cover
    total += 1  # toc
    for t in ("mandatory", "warning", "informative"):
        n = sum(1 for s in SIGNS if s["type"] == t)
        total += -(-n // per)  # ceil
    # rules: 1 or 2 pages
    total += 1
    # police: 1 or 2 pages
    total += -(-len(POLICE) // 4)
    return total

# ---------- BUILD ----------
def build():
    total = estimate_total()
    c = canvas.Canvas(OUT, pagesize=A4)
    c.setTitle("Direct Drive Abu Dhabi — Cheat Sheet")
    c.setAuthor("Direct Drive Abu Dhabi")
    c.setSubject("Traffic signs, road rules, and police signals")

    # cream page background helper
    def bg():
        c.setFillColor(CREAM)
        c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)

    # COVER (no bg, drawn dark)
    draw_cover(c)
    c.showPage()

    page_no = [2]
    total_ref = [total]

    # TOC
    bg()
    draw_toc(c, total)
    c.showPage()
    page_no[0] += 1

    # Sections
    for kicker, title, t in [("§ II", "Mandatory Signs", "mandatory"),
                              ("§ III", "Warning Signs", "warning"),
                              ("§ IV", "Informative Signs", "informative")]:
        bg(); draw_signs_section(c, page_no, total_ref, SIGNS, kicker, title, t)
        # showPage already called inside; need to re-bg before each
    bg(); draw_rules_section(c, page_no, total_ref)
    bg(); draw_police_section(c, page_no, total_ref)

    c.save()
    print("Wrote", OUT)
    return OUT

if __name__ == "__main__":
    build()
