"""
This file is dedicated to converting Markdown text into HTML fragments.

It implements a lightweight parser that specifically targets the required
subset of Markdown for this project: H1-H5 headings, standard and Obsidian-style
image links, and paragraphs. All other Markdown is ignored, and text is
HTML-escaped to be displayed as-is. This ensures a consistent and predictable
output for the SPA to consume.
"""

import re
from pathlib import Path
from typing import List

from .assets import normalise_image_src
from .models import BuildContext
from .utils import escape_html


def render_markdown(ctx: BuildContext, source_file: Path, markdown_text: str) -> str:
    """
    Converts a string of Markdown into an HTML fragment.

    This function iterates through the text line by line, converting supported
    elements (headings, images) to HTML and wrapping other text in <p> tags.

    Args:
        ctx: The build context, needed for resolving image paths.
        source_file: The path to the Markdown file being rendered.
        markdown_text: The raw text content of the Markdown file.

    Returns:
        A string containing the generated HTML fragment.
    """
    html_lines: List[str] = []
    paragraph_buffer: List[str] = []
    source_dir = source_file.parent
    relative_dir = source_dir.relative_to(ctx.source_root)

    def flush_paragraph() -> None:
        """Combines buffered lines into a single <p> tag."""
        if paragraph_buffer:
            content = " ".join(paragraph_buffer)
            html_lines.append(f"<p>{escape_html(content)}</p>")
            paragraph_buffer.clear()

    for raw_line in markdown_text.splitlines():
        line = raw_line.rstrip()
        stripped = line.strip()
        if not stripped:
            flush_paragraph()
            continue

        # Match H1 to H5
        heading_match = re.match(r"^(#{1,5})\s+(.*)$", stripped)
        if heading_match:
            flush_paragraph()
            level = len(heading_match.group(1))
            content = escape_html(heading_match.group(2).strip())
            html_lines.append(f"<h{level}>{content}</h{level}>")
            continue

        # Match standard Markdown image ![]()
        image_match = re.match(r"^!\[(.*?)\]\((.+?)\)\s*$", stripped)
        if image_match:
            flush_paragraph()
            alt_text = escape_html(image_match.group(1))
            src_path = normalise_image_src(ctx, source_dir, relative_dir, image_match.group(2))
            html_lines.append(f'<figure><img src="{escape_html(src_path)}" alt="{alt_text}"></figure>')
            continue

        # Match Obsidian-style image ![[...]]
        obsidian_image_match = re.match(r"^!\[\[(.+?)\]\]\s*$", stripped)
        if obsidian_image_match:
            flush_paragraph()
            target = obsidian_image_match.group(1)
            # Handle aliases like ![[image.png|alt text]]
            reference = target.split("|", 1)[0]
            src_path = normalise_image_src(ctx, source_dir, relative_dir, reference)
            html_lines.append(f'<figure><img src="{escape_html(src_path)}" alt=""></figure>')
            continue

        paragraph_buffer.append(stripped)

    flush_paragraph()
    return "\n".join(html_lines)
