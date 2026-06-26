"""Generate a professional, screenshot-style USER_MANUAL.pdf from USER_MANUAL.md."""
from __future__ import annotations

from html import unescape
from pathlib import Path
import re

import markdown
from fpdf import FPDF
from fpdf.enums import XPos, YPos
from fpdf.fonts import FontFace, TextStyle

ROOT = Path(__file__).resolve().parent.parent
MD_PATH = ROOT / "USER_MANUAL.md"
PDF_PATH = ROOT / "USER_MANUAL.pdf"
LOGO_PATH = ROOT / "frontend" / "public" / "images" / "logo.jpg"
HERO_PATH = ROOT / "frontend" / "public" / "images" / "hero.jpg"

BRAND_BLUE = (37, 99, 235)
BRAND_BLUE_DARK = (29, 78, 216)
SLATE_900 = (15, 23, 42)
SLATE_600 = (71, 85, 105)
SLATE_500 = (100, 116, 139)
SLATE_200 = (226, 232, 240)
SLATE_100 = (241, 245, 249)
SLATE_50 = (248, 250, 252)
WHITE = (255, 255, 255)

EMOJI_REPLACEMENTS = {
    "🛒": "(cart)",
    "🗑": "(delete)",
    "✎": "(edit)",
    "☰": "(menu)",
    "→": "->",
    "−": "-",
    "—": "-",
    "–": "-",
    "↓": "v",
    "┌": "+",
    "┐": "+",
    "└": "+",
    "┘": "+",
    "│": "|",
    "─": "-",
    "'": "'",
    "'": "'",
    """: '"',
    """: '"',
}

FLOW_STEPS = [
    ("Cart", "Review items"),
    ("Payment", "Card or COD"),
    ("Confirmation", "Email sent"),
    ("Invoice", "Download PDF"),
]


def clean_text(text: str) -> str:
    for old, new in EMOJI_REPLACEMENTS.items():
        text = text.replace(old, new)
    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)
    return text


def strip_title_block(md: str) -> str:
    lines = md.splitlines()
    start = 0
    for i, line in enumerate(lines):
        if line.startswith("## Table of Contents"):
            start = i
            break
    return "\n".join(lines[start:])


def sanitize_monospace_blocks(html: str) -> str:
    def replacer(match: re.Match) -> str:
        tag = match.group(1)
        attrs = match.group(2) or ""
        inner = clean_text(match.group(3))
        inner = inner.encode("latin-1", "replace").decode("latin-1")
        return f"<{tag}{attrs}>{inner}</{tag}>"

    return re.sub(
        r"<(pre|code)(\s[^>]*)?>(.*?)</\1>",
        replacer,
        html,
        flags=re.DOTALL | re.IGNORECASE,
    )


def flatten_table_cells(html: str) -> str:
    def replacer(match: re.Match) -> str:
        tag = match.group(1)
        attrs = match.group(2) or ""
        inner = re.sub(r"<[^>]+>", "", match.group(3))
        return f"<{tag}{attrs}>{unescape(inner)}</{tag}>"

    prev = None
    while prev != html:
        prev = html
        html = re.sub(
            r"<(td|th)(\s[^>]*)?>(.*?)</\1>",
            replacer,
            html,
            flags=re.DOTALL | re.IGNORECASE,
        )
    return html


def style_tables(html: str) -> str:
    html = html.replace("<th>", '<th bgcolor="#f1f5f9">')
    html = html.replace("<table>", '<table width="100%">')
    return html


def add_section_rules(html: str) -> str:
    return html.replace("</h2>", '</h2><hr color="#e2e8f0" width="100%"/>')


def split_flow_section(md: str) -> tuple[str, str]:
    pattern = (
        r"(### 9\.3 Checkout Flow Diagram\s*)```.*?```\s*"
    )
    match = re.search(pattern, md, flags=re.DOTALL)
    if not match:
        return md, ""
    before = md[: match.start()]
    after = md[match.end() :]
    heading = "### 9.3 Checkout Flow Diagram"
    return before.rstrip() + "\n\n" + heading + "\n\n", after.lstrip()


def md_to_html(md: str) -> str:
    body = markdown.markdown(
        clean_text(md),
        extensions=["tables", "fenced_code", "nl2br", "sane_lists"],
    )
    body = flatten_table_cells(body)
    body = sanitize_monospace_blocks(body)
    body = style_tables(body)
    return add_section_rules(body)


def build_tag_styles(font_family: str) -> dict[str, TextStyle | FontFace]:
    return {
        "h1": TextStyle(
            font_family=font_family,
            font_style="B",
            font_size_pt=20,
            color="#0f172a",
            t_margin=10,
            b_margin=5,
        ),
        "h2": TextStyle(
            font_family=font_family,
            font_style="B",
            font_size_pt=15,
            color="#1d4ed8",
            t_margin=12,
            b_margin=4,
        ),
        "h3": TextStyle(
            font_family=font_family,
            font_style="B",
            font_size_pt=12,
            color="#0f172a",
            t_margin=8,
            b_margin=3,
        ),
        "h4": TextStyle(
            font_family=font_family,
            font_style="B",
            font_size_pt=11,
            color="#334155",
            t_margin=6,
            b_margin=2,
        ),
        "p": TextStyle(
            font_family=font_family,
            font_size_pt=10.5,
            color="#334155",
            t_margin=1.5,
            b_margin=2.5,
        ),
        "li": TextStyle(
            font_family=font_family,
            font_size_pt=10.5,
            color="#334155",
            l_margin=6,
            t_margin=1.5,
        ),
        "blockquote": TextStyle(
            font_family=font_family,
            font_size_pt=10,
            color="#1e40af",
            fill_color="#eff6ff",
            l_margin=8,
            t_margin=5,
            b_margin=5,
        ),
        "a": FontFace(color="#2563eb"),
        "strong": FontFace(emphasis="BOLD", color="#0f172a"),
        "code": FontFace(
            family="Courier",
            size_pt=9,
            color="#0f172a",
            fill_color="#f8fafc",
        ),
        "pre": TextStyle(
            font_family="Courier",
            font_size_pt=9,
            color="#0f172a",
            fill_color="#f8fafc",
            t_margin=4,
            b_margin=4,
            l_margin=4,
        ),
    }


class ManualPDF(FPDF):
    def __init__(self, font_family: str):
        super().__init__()
        self._font_family = font_family
        self.set_margins(left=18, top=28, right=18)
        self.set_auto_page_break(auto=True, margin=20)

    def header(self):
        if self.page_no() == 1:
            return
        self.set_fill_color(*BRAND_BLUE)
        self.rect(0, 0, self.w, 6, style="F")
        if LOGO_PATH.exists():
            self.image(str(LOGO_PATH), x=10, y=8, w=11)
        self.set_xy(24, 8)
        self.set_font(self._font_family, "B", 9)
        self.set_text_color(*SLATE_900)
        self.cell(0, 5, "Al-Wakeel Al-Shamel OMS", new_x=XPos.RIGHT, new_y=YPos.TOP)
        self.set_font(self._font_family, "", 8)
        self.set_text_color(*SLATE_500)
        self.cell(0, 5, "User Manual", align="R")
        self.set_draw_color(*SLATE_200)
        self.line(10, 16, self.w - 10, 16)

    def footer(self):
        self.set_y(-14)
        self.set_draw_color(*SLATE_200)
        self.line(10, self.get_y(), self.w - 10, self.get_y())
        self.set_font(self._font_family, "", 8)
        self.set_text_color(*SLATE_500)
        self.cell(0, 8, f"Version 1.0  |  June 2026  |  Page {self.page_no()}", align="C")

    def draw_cover(self):
        self.add_page()
        self.set_fill_color(*BRAND_BLUE_DARK)
        self.rect(0, 0, self.w, 52, style="F")
        self.set_fill_color(*BRAND_BLUE)
        self.rect(0, 48, self.w, 8, style="F")

        if LOGO_PATH.exists():
            logo_w = 34
            self.image(
                str(LOGO_PATH),
                x=(self.w - logo_w) / 2,
                y=14,
                w=logo_w,
            )

        self.set_xy(self.l_margin, 62)
        self.set_font(self._font_family, "B", 24)
        self.set_text_color(*SLATE_900)
        self.multi_cell(self.epw, 11, "Al-Wakeel Al-Shamel", align="C")
        self.set_x(self.l_margin)
        self.set_font(self._font_family, "", 16)
        self.set_text_color(*BRAND_BLUE_DARK)
        self.multi_cell(self.epw, 9, "Order Management System", align="C")
        self.ln(2)
        self.set_x(self.l_margin)
        self.set_font(self._font_family, "B", 13)
        self.set_text_color(*SLATE_600)
        self.multi_cell(self.epw, 8, "User Manual", align="C")

        self.draw_screenshot_frame(y=self.get_y() + 6)

        card_y = self.get_y() + 8
        self.draw_info_card(
            card_y,
            [
                ("Version", "1.0"),
                ("Date", "June 2026"),
                ("Developer", "Osama Al-Hossam"),
            ],
        )

        self.draw_url_panel(self.get_y() + 10)

    def draw_screenshot_frame(self, y: float):
        frame_x = 22
        frame_w = self.w - 44
        frame_h = 58
        chrome_h = 10

        self.set_fill_color(*SLATE_100)
        self.set_draw_color(*SLATE_200)
        self.rect(frame_x, y, frame_w, frame_h, style="DF")

        self.set_fill_color(*WHITE)
        self.rect(frame_x, y + chrome_h, frame_w, frame_h - chrome_h, style="F")

        self.set_fill_color(239, 68, 68)
        self.circle(frame_x + 8, y + 5, 1.5, style="F")
        self.set_fill_color(250, 204, 21)
        self.circle(frame_x + 14, y + 5, 1.5, style="F")
        self.set_fill_color(34, 197, 94)
        self.circle(frame_x + 20, y + 5, 1.5, style="F")

        self.set_fill_color(*SLATE_50)
        self.set_draw_color(*SLATE_200)
        self.rect(frame_x + 28, y + 2.5, frame_w - 36, 5, style="DF")
        self.set_font(self._font_family, "", 7)
        self.set_text_color(*SLATE_500)
        self.set_xy(frame_x + 30, y + 3.5)
        self.cell(frame_w - 40, 4, "alwakeel-alshamel.vercel.app/products")

        if HERO_PATH.exists():
            self.image(
                str(HERO_PATH),
                x=frame_x + 2,
                y=y + chrome_h + 2,
                w=frame_w - 4,
                h=frame_h - chrome_h - 4,
            )

        self.set_xy(frame_x, y + frame_h + 3)
        self.set_font(self._font_family, "I", 8)
        self.set_text_color(*SLATE_500)
        self.cell(frame_w, 5, "Live storefront preview", align="C")

    def draw_info_card(self, y: float, rows: list[tuple[str, str]]):
        card_x = 28
        card_w = self.w - 56
        card_h = 8 + len(rows) * 9
        self.set_fill_color(*WHITE)
        self.set_draw_color(*SLATE_200)
        self.rect(card_x, y, card_w, card_h, style="DF")

        inner_y = y + 6
        for label, value in rows:
            self.set_xy(card_x + 8, inner_y)
            self.set_font(self._font_family, "B", 9)
            self.set_text_color(*SLATE_600)
            self.cell(28, 6, f"{label}:")
            self.set_font(self._font_family, "", 9)
            self.set_text_color(*SLATE_900)
            self.cell(card_w - 40, 6, value)
            inner_y += 9

        self.set_y(y + card_h)

    def draw_url_panel(self, y: float):
        panel_x = 22
        panel_w = self.w - 44
        panel_h = 24
        self.set_fill_color(*SLATE_50)
        self.set_draw_color(*BRAND_BLUE)
        self.set_line_width(0.6)
        self.rect(panel_x, y, panel_w, panel_h, style="DF")
        self.set_line_width(0.2)

        self.set_xy(panel_x + 8, y + 5)
        self.set_font(self._font_family, "B", 9)
        self.set_text_color(*BRAND_BLUE_DARK)
        self.cell(panel_w - 16, 5, "Live system access")

        self.set_font(self._font_family, "", 8.5)
        self.set_text_color(*SLATE_600)
        self.set_x(panel_x + 8)
        self.cell(panel_w - 16, 5, "Website: https://alwakeel-alshamel.vercel.app")
        self.set_x(panel_x + 8)
        self.cell(panel_w - 16, 5, "API: https://oms-api-23gt.onrender.com")

        self.set_y(y + panel_h)

    def draw_checkout_flow(self):
        self.ln(4)
        box_w = (self.w - 50) / 4
        box_h = 22
        start_x = 14
        y = self.get_y()

        for i, (title, subtitle) in enumerate(FLOW_STEPS):
            x = start_x + i * (box_w + 4)
            self.set_fill_color(*WHITE)
            self.set_draw_color(*BRAND_BLUE)
            self.set_line_width(0.5)
            self.rect(x, y, box_w, box_h, style="DF")
            self.set_line_width(0.2)

            self.set_xy(x, y + 5)
            self.set_font(self._font_family, "B", 9)
            self.set_text_color(*BRAND_BLUE_DARK)
            self.cell(box_w, 5, title, align="C")

            self.set_xy(x, y + 12)
            self.set_font(self._font_family, "", 7.5)
            self.set_text_color(*SLATE_500)
            self.cell(box_w, 4, subtitle, align="C")

            if i < len(FLOW_STEPS) - 1:
                arrow_x = x + box_w + 0.5
                self.set_font(self._font_family, "B", 10)
                self.set_text_color(*BRAND_BLUE)
                self.set_xy(arrow_x, y + 8)
                self.cell(3, 5, ">")

        note_y = y + box_h + 6
        self.set_fill_color(*SLATE_50)
        self.set_draw_color(*SLATE_200)
        self.rect(14, note_y, self.w - 28, 14, style="DF")
        self.set_xy(18, note_y + 4)
        self.set_font(self._font_family, "", 8.5)
        self.set_text_color(*SLATE_600)
        self.multi_cell(
            self.w - 36,
            4,
            "FedEx order created automatically after checkout. Order status: Shipped.",
        )
        self.set_y(note_y + 18)


def register_font(pdf: FPDF) -> str:
    fonts_dir = Path(r"C:\Windows\Fonts")
    regular = fonts_dir / "arial.ttf"
    if regular.exists():
        family = "ArialUnicode"
        variants = {
            "": regular,
            "B": fonts_dir / "arialbd.ttf",
            "I": fonts_dir / "ariali.ttf",
            "BI": fonts_dir / "arialbi.ttf",
        }
        for style, path in variants.items():
            if path.exists():
                pdf.add_font(family, style, str(path))
        return family
    return "Helvetica"


def main():
    md = MD_PATH.read_text(encoding="utf-8")
    md = strip_title_block(md)
    md_before_flow, md_after_flow = split_flow_section(md)

    font_family = "Helvetica"
    pdf = ManualPDF(font_family)
    font_family = register_font(pdf)
    pdf._font_family = font_family

    pdf.draw_cover()
    pdf.add_page()
    pdf.set_font(font_family, "", 10.5)

    tag_styles = build_tag_styles(font_family)

    html_before = md_to_html(md_before_flow)
    pdf.write_html(
        html_before,
        font_family=font_family,
        tag_styles=tag_styles,
        table_line_separators=True,
    )

    pdf.draw_checkout_flow()

    if md_after_flow:
        html_after = md_to_html(md_after_flow)
        pdf.write_html(
            html_after,
            font_family=font_family,
            tag_styles=tag_styles,
            table_line_separators=True,
        )

    pdf.output(str(PDF_PATH))
    print(f"Created: {PDF_PATH}")


if __name__ == "__main__":
    main()
