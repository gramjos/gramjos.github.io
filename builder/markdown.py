"""
This file is dedicated to converting Markdown text into HTML fragments.

It implements a lightweight parser that specifically targets the required
subset of Markdown for this project: H1-H5 headings, standard and Obsidian-style
image links, and paragraphs. All other Markdown is ignored, and text is
HTML-escaped to be displayed as-is. This ensures a consistent and predictable
output for the SPA to consume.
"""

from curses.ascii import alt
import re
from pathlib import Path
from turtle import ht
from typing import List

from .assets import normalise_image_src
from .models import BuildContext
from .utils import escape_html


def render_markdown(ctx: BuildContext, source_file: Path, markdown_text: str) -> str:
    """
    Converts a string of Markdown into an HTML fragment.

    This function iterates through the text line by line. It handles block-level
    elements like headings separately. For paragraph content, it processes each
    line to find and replace any inline image references (both standard and
    Obsidian-style) with their corresponding HTML `<img>` tags.

    Args:
        ctx: The build context, needed for resolving image paths.
        source_file: The path to the Markdown file being rendered.
        markdown_text: The raw text content of the Markdown file.

    Returns:
        A string containing the generated HTML fragment.
    """
    html_lines: List[str] = []

    x = markdown_text.splitlines()
    for raw_line in x:
        line = raw_line.strip() # Strip leading/trailing whitespace
        if not line.strip(): # if line empty
            continue

        # Markdown processing:
        ## artifacts that occurs to the whole line VERSUS to an element within the line
        # - Source ParsingRules.md

        # Is Heading
        heading_match = re.match(r"^(#{1,5})\s+(.*)$", line)
        if heading_match:
            level = len(heading_match.group(1))
            content = escape_html(heading_match.group(2).strip())
            html_lines.append(f"<h{level}>{content}</h{level}>")
            continue

        # Is Img
        image_pattern = re.compile(r"!\[\[(.+?)\]\]|!\[(.*?)\]\((.+?)\)")
        img_matches = image_pattern.findall(line)
        clean_img_matches = [m for m in img_matches if m != '']
        if clean_img_matches:
            for img_match in clean_img_matches:
                html_template = f'<img src="graphics/{img_match[0]}" alt="{img_match[1]}"/>'
                html_lines.append(html_template)
            continue
        # Is Paragraph
        # catch all is paragraph
        html_lines.append(f"<p>{line}</p>")

    return "\n".join(html_lines)
