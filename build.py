#!/usr/bin/env python3
"""Build the static Obsidian-style SPA from a vault folder."""
from __future__ import annotations

import argparse
import datetime as _dt
import json
import re
import shutil
import sys
from dataclasses import dataclass, field
from html import escape as html_escape
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple

ROOT = Path(__file__).resolve().parent
TEMPLATES_DIR = ROOT / "templates"
DEFAULT_OUTPUT_DIR = ROOT / "docs"

README_BASENAMES = {"readme.md", "readme.html"}
ALLOWED_MD_EXTENSIONS = {".md", ".markdown"}
SKIP_DIR_NAMES = {".git", "__pycache__", ".obsidian", ".DS_Store"}
GRAPHICS_DIR_NAME = "graphics"


@dataclass
class PageRecord:
    """Represents a page that will be emitted to site-data."""

    page_id: str
    title: str
    rel_path: str
    dir_path: str
    page_type: str
    html: str
    aliases: List[str] = field(default_factory=list)
    wiki_links: List[str] = field(default_factory=list)
    local_links: List[str] = field(default_factory=list)
    external_links: List[str] = field(default_factory=list)
    markdown: Optional[str] = None
    excalidraw_data: Optional[Dict[str, Any]] = None

    def as_dict(self) -> Dict[str, object]:
        data = {
            "id": self.page_id,
            "title": self.title,
            "relPath": self.rel_path,
            "dirPath": self.dir_path,
            "type": self.page_type,
            "html": self.html,
            "aliases": self.aliases,
            "links": {
                "wiki": self.wiki_links,
                "local": self.local_links,
                "external": self.external_links,
            },
        }

        if self.markdown is not None:
            data["markdown"] = self.markdown
        
        if self.excalidraw_data is not None:
            data["excalidrawData"] = self.excalidraw_data

        return data


class MarkdownConverter:
    """Very small Markdown renderer with Obsidian-style wiki link support."""

    fence_pattern = re.compile(r"^```(\w+)?\s*$")
    heading_pattern = re.compile(r"^(#{1,6})\s*(.+?)\s*$")
    ulist_pattern = re.compile(r"^(?P<indent>\s*)[-+*]\s+(?P<content>.+)$")
    olist_pattern = re.compile(r"^(?P<indent>\s*)(?P<index>\d+)[\.)]\s+(?P<content>.+)$")
    blockquote_pattern = re.compile(r"^(?P<indent>\s*)>\s?(?P<content>.+)$")

    def convert(self, text: str) -> Tuple[str, Dict[str, List[str]]]:
        lines = text.splitlines()
        lines.append("")  # sentinel to flush buffers

        html_lines: List[str] = []
        list_stack: List[Tuple[str, int]] = []  # (tag, indent)

        wiki_links: List[str] = []
        local_links: List[str] = []
        external_links: List[str] = []
        code_lang: Optional[str] = None
        in_code_block = False
        current_paragraph: List[str] = []
        blockquote_stack: List[int] = []
        first_heading: Optional[str] = None

        def close_paragraph() -> None:
            nonlocal current_paragraph
            if current_paragraph:
                paragraph_text = " ".join(current_paragraph).strip()
                if paragraph_text:
                    html_lines.append(f"<p>{self._render_inline(paragraph_text, wiki_links, local_links, external_links)}</p>")
                current_paragraph = []

        def close_lists(target_indent: int = -1) -> None:
            while list_stack and list_stack[-1][1] > target_indent:
                tag, indent = list_stack.pop()
                html_lines.append(" " * indent + f"</{tag}>")

        def close_blockquotes(target_indent: int = -1) -> None:
            while blockquote_stack and blockquote_stack[-1] > target_indent:
                blockquote_stack.pop()
                html_lines.append("</blockquote>")

        for raw_line in lines:
            line = raw_line.rstrip("\n")

            fence_match = self.fence_pattern.match(line)
            if fence_match:
                close_paragraph()
                close_lists()
                close_blockquotes()
                if in_code_block:
                    html_lines.append("</code></pre>")
                    in_code_block = False
                    code_lang = None
                else:
                    in_code_block = True
                    code_lang = fence_match.group(1)
                    lang_attr = f" class=\"language-{html_escape(code_lang)}\"" if code_lang else ""
                    html_lines.append(f"<pre><code{lang_attr}>")
                continue

            if in_code_block:
                html_lines.append(html_escape(line) + "\n")
                continue

            heading_match = self.heading_pattern.match(line)
            if heading_match:
                close_paragraph()
                close_lists()
                close_blockquotes()
                level = len(heading_match.group(1))
                content = heading_match.group(2).strip()
                rendered = self._render_inline(content, wiki_links, local_links, external_links)
                html_lines.append(f"<h{level}>{rendered}</h{level}>")
                if first_heading is None and level <= 2:
                    # Only use H1 or H2 as title to avoid long descriptive text
                    first_heading = self._strip_html(rendered)
                continue

            if not line.strip():
                close_paragraph()
                close_lists()
                close_blockquotes()
                continue

            ulist_match = self.ulist_pattern.match(line)
            if ulist_match:
                close_paragraph()
                close_blockquotes()
                indent = len(ulist_match.group("indent"))
                content = ulist_match.group("content")
                while list_stack and indent < list_stack[-1][1]:
                    close_lists(indent - 1)
                if not list_stack or indent > list_stack[-1][1] or list_stack[-1][0] != "ul":
                    list_stack.append(("ul", indent))
                    html_lines.append(" " * indent + "<ul>")
                rendered_item = self._render_inline(content.strip(), wiki_links, local_links, external_links)
                html_lines.append(" " * (indent + 2) + f"<li>{rendered_item}</li>")
                continue

            olist_match = self.olist_pattern.match(line)
            if olist_match:
                close_paragraph()
                close_blockquotes()
                indent = len(olist_match.group("indent"))
                content = olist_match.group("content")
                while list_stack and indent < list_stack[-1][1]:
                    close_lists(indent - 1)
                if not list_stack or indent > list_stack[-1][1] or list_stack[-1][0] != "ol":
                    list_stack.append(("ol", indent))
                    html_lines.append(" " * indent + "<ol>")
                rendered_item = self._render_inline(content.strip(), wiki_links, local_links, external_links)
                html_lines.append(" " * (indent + 2) + f"<li>{rendered_item}</li>")
                continue

            blockquote_match = self.blockquote_pattern.match(line)
            if blockquote_match:
                indent = len(blockquote_match.group("indent"))
                content = blockquote_match.group("content")
                close_paragraph()
                while blockquote_stack and indent < blockquote_stack[-1]:
                    close_blockquotes(indent - 1)
                if not blockquote_stack or indent > blockquote_stack[-1]:
                    blockquote_stack.append(indent)
                    html_lines.append("<blockquote>")
                current_paragraph.append(content)
                continue

            current_paragraph.append(line)

        close_paragraph()
        close_lists()
        close_blockquotes()

        html_output = "\n".join(html_lines)
        metadata = {
            "headings": [first_heading] if first_heading else [],
            "wiki_links": wiki_links,
            "local_links": local_links,
            "external_links": external_links,
        }
        return html_output, metadata

    @staticmethod
    def _render_inline(
        text: str,
        wiki_links: List[str],
        local_links: List[str],
        external_links: List[str],
    ) -> str:
        code_spans: List[str] = []
        math_spans: List[str] = []

        def stash_code(match: re.Match[str]) -> str:
            code_spans.append(html_escape(match.group(1)))
            return f"\u0000CODE{len(code_spans) - 1}\u0000"

        text = re.sub(r"`([^`]+)`", stash_code, text)

        def stash_math(match: re.Match[str]) -> str:
            math_spans.append(match.group(1))
            return f"\u0000MATH{len(math_spans) - 1}\u0000"

        text = re.sub(r"\$\$([\s\S]+?)\$\$", stash_math, text)
        escaped = html_escape(text)

        def restore_code_segments(rendered: str) -> str:
            for idx, code in enumerate(code_spans):
                rendered = rendered.replace(f"\u0000CODE{idx}\u0000", f"<code>{code}</code>")
            return rendered

        def restore_math_segments(rendered: str) -> str:
            for idx, expression in enumerate(math_spans):
                expr = expression.strip()
                if not expr:
                    replacement = ""
                else:
                    expr_html = html_escape(expr)
                    data_attr = html_escape(expr, quote=True)
                    replacement = (
                        f"<span class=\"math-latex\" data-latex=\"{data_attr}\">\\({expr_html}\\)</span>"
                    )
                rendered = rendered.replace(f"\u0000MATH{idx}\u0000", replacement)
            return rendered

        def replace_bold(match: re.Match[str]) -> str:
            return f"<strong>{match.group(1)}</strong>"

        def replace_italic(match: re.Match[str]) -> str:
            return f"<em>{match.group(1)}</em>"

        def replace_underline(match: re.Match[str]) -> str:
            return f"<u>{match.group(1)}</u>"

        def replace_strike(match: re.Match[str]) -> str:
            return f"<del>{match.group(1)}</del>"

        def replace_image(match: re.Match[str]) -> str:
            alt = match.group(1)
            url = match.group(2)
            if url and not url.lower().startswith(("http://", "https://", "mailto:")):
                local_links.append(url)
            return (
                f"<img src=\"{html_escape(url, quote=True)}\" alt=\"{html_escape(alt)}\" "
                "loading=\"lazy\" decoding=\"async\">"
            )

        def replace_link(match: re.Match[str]) -> str:
            label = match.group(1)
            url = match.group(2)
            if url.lower().startswith(("http://", "https://", "mailto:")):
                external_links.append(url)
            else:
                local_links.append(url)
            return f"<a href=\"{html_escape(url, quote=True)}\">{label}</a>"

        def replace_wiki_image(match: re.Match[str]) -> str:
            """Handle Obsidian-style image embeds: ![[image.png]] or ![[image.png|alt text]]"""
            target = match.group(1).strip()
            alias = match.group(2).strip() if match.group(2) else ""
            
            # Check if this is an Excalidraw embed
            if target.endswith('.excalidraw') or target.endswith('.excalidraw.md'):
                # Track as local link for potential asset resolution
                local_links.append(target)
                # Create a placeholder div for Excalidraw rendering
                return (
                    f"<div class=\"excalidraw-embed\" "
                    f"data-excalidraw-target=\"{html_escape(target, quote=True)}\"></div>"
                )
            
            # Extract just the filename if it's a path
            filename = target.split('/')[-1]
            # Track as local link for potential asset resolution
            local_links.append(target)
            # Use alias as alt text if provided, otherwise use filename without extension
            alt_text = alias if alias else Path(filename).stem
            return (
                f"<img src=\"{html_escape(target, quote=True)}\" "
                f"alt=\"{html_escape(alt_text)}\" "
                f"class=\"wiki-image\" loading=\"lazy\" decoding=\"async\">"
            )

        def replace_wiki(match: re.Match[str]) -> str:
            target = match.group(1).strip()
            alias = match.group(2).strip() if match.group(2) else target
            wiki_links.append(target)
            return (
                f"<a class=\"wikilink\" data-wikilink-target=\"{html_escape(target, quote=True)}\" href=\"#\">"
                f"{html_escape(alias)}</a>"
            )

        # Process wiki-style images first: ![[image.png]] or ![[image.png|alt text]]
        rendered = re.sub(r"!\[\[([^\]|]+)(?:\|([^\]]+))?\]\]", replace_wiki_image, escaped)
        # Then standard Markdown images: ![alt](url)
        rendered = re.sub(r"!\[([^\]]*)\]\(([^)]+)\)", replace_image, rendered)
        rendered = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", replace_link, rendered)
        rendered = re.sub(r"\*\*([^*]+)\*\*", replace_bold, rendered)
        rendered = re.sub(r"__([^_]+)__", replace_bold, rendered)
        rendered = re.sub(r"(?<!\*)\*([^*]+)\*(?!\*)", replace_italic, rendered)
        rendered = re.sub(r"(?<!_)_([^_]+)_(?!_)", replace_italic, rendered)
        rendered = re.sub(r"~~([^~]+)~~", replace_strike, rendered)
        rendered = re.sub(r"<u>([^<]+)</u>", replace_underline, rendered)
        rendered = re.sub(r"\[\[([^\]|]+)(?:\|([^\]]+))?\]\]", replace_wiki, rendered)

        rendered = restore_math_segments(rendered)
        rendered = restore_code_segments(rendered)
        return rendered

    @staticmethod
    def _strip_html(text: str) -> str:
        return re.sub(r"<[^>]+>", "", text).strip()


class VaultBuilder:
    """Create docs output for a vault."""

    def __init__(self, source: Path, output: Path) -> None:
        self.source = source
        self.output = output
        self.converter = MarkdownConverter()
        self.pages: Dict[str, PageRecord] = {}
        self.directories: Dict[str, Dict[str, Any]] = {}
        self.alias_index: Dict[str, str] = {}
        self.path_index: Dict[str, str] = {}
        self.site_title: Optional[str] = None
        self.home_page_id: Optional[str] = None
        self.about_page_id: Optional[str] = None

    def build(self) -> None:
        self._validate_paths()
        self._prepare_output_dir()
        self._scan_directory(self.source)
        if not self.home_page_id:
            raise RuntimeError("No home page detected; ensure the vault root includes a README.md")
        site_title = self.site_title or self.source.name
        data = {
            "generatedAt": _dt.datetime.now(tz=_dt.timezone.utc).isoformat(),
            "sourcePath": str(self.source),
            "siteTitle": site_title,
            "homePageId": self.home_page_id,
            "aboutPageId": self.about_page_id,
            "pages": {pid: record.as_dict() for pid, record in self.pages.items()},
            "directories": self.directories,
            "aliasIndex": self.alias_index,
            "pathIndex": self.path_index,
        }
        dest = self.output / "site-data.json"
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(json.dumps(data, indent=2, sort_keys=True), encoding="utf-8")
        print(f"Wrote {dest}")

    def _validate_paths(self) -> None:
        if not self.source.exists():
            raise FileNotFoundError(f"Vault path not found: {self.source}")
        if not self.source.is_dir():
            raise NotADirectoryError(f"Vault path must be a directory: {self.source}")
        if not TEMPLATES_DIR.is_dir():
            raise FileNotFoundError(f"Missing templates directory: {TEMPLATES_DIR}")

    def _prepare_output_dir(self) -> None:
        self.output.mkdir(parents=True, exist_ok=True)
        for template_path in TEMPLATES_DIR.glob("**/*"):
            if template_path.is_dir():
                continue
            rel = template_path.relative_to(TEMPLATES_DIR)
            dest = self.output / rel
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(template_path, dest)

    def _scan_directory(self, directory: Path) -> bool:
        """Scan a directory and return True if it should be published."""
        rel_dir = directory.relative_to(self.source)
        rel_dir_str = "." if str(rel_dir) == "." else rel_dir.as_posix()
        if directory.name in SKIP_DIR_NAMES and directory != self.source:
            return False

        entries = sorted(directory.iterdir(), key=lambda p: (p.is_file(), p.name.lower()))
        readme_md = next((p for p in entries if p.is_file() and p.name.lower() == "readme.md"), None)
        readme_html = next((p for p in entries if p.is_file() and p.name.lower() == "readme.html"), None)

        # Check if this directory should be published
        if directory.name != GRAPHICS_DIR_NAME and rel_dir_str != ".":
            if readme_md is None and readme_html is None:
                print(f"Skipping directory '{rel_dir_str}' (no README found)")
                # Still scan subdirectories in case they have READMEs
                for path in entries:
                    if path.is_dir() and path.name not in SKIP_DIR_NAMES:
                        self._scan_directory(path)
                return False

        # Create directory entry
        dir_entry = self.directories.setdefault(
            rel_dir_str,
            {
                "path": rel_dir_str,
                "name": "Root" if rel_dir_str == "." else directory.name,
                "parent": self._parent_dir_str(rel_dir_str),
                "readmeId": None,
                "subdirectories": [],
                "pageIds": [],
                "assetPaths": [],
            },
        )

        if readme_md:
            page = self._process_markdown_file(readme_md, directory, is_readme=True)
            dir_entry["readmeId"] = page.page_id
        elif readme_html:
            page = self._process_html_readme(readme_html, directory)
            dir_entry["readmeId"] = page.page_id

        if rel_dir_str == "." and dir_entry["readmeId"] and not self.home_page_id:
            self.home_page_id = dir_entry["readmeId"]  # type: ignore[assignment]

        for path in entries:
            if path.name.startswith(".") and path.name not in {".obsidian"}:
                continue
            if path.is_dir():
                if path.name in SKIP_DIR_NAMES:
                    continue
                child_rel = path.relative_to(self.source)
                # Only add subdirectory if it successfully publishes
                if self._scan_directory(path):
                    dir_entry["subdirectories"].append(child_rel.as_posix())
                continue

            lowered = path.name.lower()
            if lowered == "readme.md" or lowered == "readme.html":
                continue

            if path.suffix.lower() in ALLOWED_MD_EXTENSIONS:
                page = self._process_markdown_file(path, directory, is_readme=False)
                dir_entry["pageIds"].append(page.page_id)
                continue

            if path.suffix.lower() == ".html":
                page = self._process_html_page(path)
                dir_entry["pageIds"].append(page.page_id)
                continue

            self._copy_asset(path)
            dir_entry["assetPaths"].append(path.relative_to(self.source).as_posix())

        return True

    def _process_markdown_file(self, path: Path, directory: Path, *, is_readme: bool) -> PageRecord:
        rel_path = path.relative_to(self.source)
        page_id = rel_path.as_posix()
        markdown_text = path.read_text(encoding="utf-8")
        
        # Check if this is an Excalidraw file
        is_excalidraw = path.name.endswith('.excalidraw.md') or path.name.endswith('.excalidraw')
        excalidraw_data = None
        
        if is_excalidraw:
            # Extract JSON data from code block
            excalidraw_data = self._extract_excalidraw_json(markdown_text)
        
        html_body, metadata = self.converter.convert(markdown_text)

        first_heading = metadata["headings"][0] if metadata["headings"] else None
        
        # For README files, prefer heading over filename for directory representation
        if is_readme:
            if not first_heading and rel_path.stem:
                first_heading = self._title_from_directory(directory)
            title = first_heading or self._title_from_filename(path.name)
        else:
            # For regular pages, prefer short filenames over long headings for breadcrumbs
            # Use filename as primary title, heading is available in page content
            title = self._title_from_filename(path.name)

        # Set site title to vault name, not README heading
        if is_readme and rel_path.as_posix().lower() == "readme.md":
            # Use the vault directory name as site title
            self.site_title = self.source.name

        aliases = self._default_aliases(rel_path, title, is_readme=is_readme)
        
        # Determine page type
        if is_excalidraw:
            page_type = "excalidraw"
        elif is_readme:
            page_type = "readme"
        else:
            page_type = "page"
        
        page = PageRecord(
            page_id=page_id,
            title=title,
            rel_path=rel_path.as_posix(),
            dir_path=(rel_path.parent.as_posix() if rel_path.parent != Path(".") else "."),
            page_type=page_type,
            html=html_body,
            aliases=aliases,
            wiki_links=metadata["wiki_links"],
            local_links=metadata["local_links"],
            external_links=metadata["external_links"],
            markdown=markdown_text,
            excalidraw_data=excalidraw_data,
        )

        self._register_page(page)
        self._maybe_set_about(page)
        return page

    def _process_html_readme(self, path: Path, directory: Path) -> PageRecord:
        rel_path = path.relative_to(self.source)
        page_id = rel_path.as_posix()
        html_body = path.read_text(encoding="utf-8")
        title = self._infer_title_from_html(html_body) or self._title_from_directory(directory)
        aliases = self._default_aliases(rel_path, title, is_readme=True)
        page = PageRecord(
            page_id=page_id,
            title=title,
            rel_path=rel_path.as_posix(),
            dir_path=(rel_path.parent.as_posix() if rel_path.parent != Path(".") else "."),
            page_type="readme",
            html=html_body,
            aliases=aliases,
        )
        self._register_page(page)
        self._maybe_set_about(page)
        return page

    def _process_html_page(self, path: Path) -> PageRecord:
        rel_path = path.relative_to(self.source)
        page_id = rel_path.as_posix()
        html_body = path.read_text(encoding="utf-8")
        title = self._infer_title_from_html(html_body) or self._title_from_filename(path.name)
        aliases = self._default_aliases(rel_path, title, is_readme=False)
        page = PageRecord(
            page_id=page_id,
            title=title,
            rel_path=rel_path.as_posix(),
            dir_path=(rel_path.parent.as_posix() if rel_path.parent != Path(".") else "."),
            page_type="page",
            html=html_body,
            aliases=aliases,
        )
        self._register_page(page)
        self._maybe_set_about(page)
        return page

    def _register_page(self, page: PageRecord) -> None:
        self.pages[page.page_id] = page
        self.path_index[page.rel_path] = page.page_id
        if page.rel_path.lower().endswith("readme.md"):
            dir_key = page.dir_path if page.dir_path != "." else "."
            # Additional alias to directory names without README filename for easier linking
            self.path_index[dir_key + "/README.md" if dir_key != "." else "README.md"] = page.page_id
        for alias in page.aliases:
            key = alias.lower().strip()
            if not key:
                continue
            self.alias_index.setdefault(key, page.page_id)

    def _copy_asset(self, path: Path) -> None:
        rel_path = path.relative_to(self.source)
        dest = self.output / rel_path
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(path, dest)

    def _default_aliases(self, rel_path: Path, title: str, *, is_readme: bool) -> List[str]:
        aliases = {title}
        aliases.add(rel_path.stem)
        aliases.add(rel_path.name)
        if is_readme:
            dir_name = rel_path.parent.name if rel_path.parent != Path(".") else "Root"
            aliases.add(dir_name)
            if rel_path.parent == Path("."):
                aliases.add("home")
        cleaned = [alias for alias in (alias.strip() for alias in aliases) if alias]
        return sorted(set(cleaned), key=lambda a: a.lower())

    def _maybe_set_about(self, page: PageRecord) -> None:
        if self.about_page_id:
            return
        path_obj = Path(page.rel_path)
        base_name = path_obj.stem.lower()
        file_name = path_obj.name.lower()
        parts = {segment.lower() for segment in path_obj.parts}
        if "about" in parts or base_name.startswith("about") or file_name.startswith("about"):
            self.about_page_id = page.page_id

    @staticmethod
    def _parent_dir_str(rel_dir_str: str) -> Optional[str]:
        if rel_dir_str in {"", "."}:
            return None
        parent = Path(rel_dir_str).parent
        return "." if str(parent) == "." else parent.as_posix()

    @staticmethod
    def _title_from_filename(name: str) -> str:
        stem = Path(name).stem
        words = re.sub(r"[_-]+", " ", stem)
        return words.title() if words else stem

    @staticmethod
    def _title_from_directory(directory: Path) -> str:
        if directory == directory.parent:
            return "Root"
        stem = directory.name
        words = re.sub(r"[_-]+", " ", stem)
        return words.title() if words else stem

    @staticmethod
    def _infer_title_from_html(html_body: str) -> Optional[str]:
        match = re.search(r"<h1[^>]*>(.*?)</h1>", html_body, flags=re.IGNORECASE | re.DOTALL)
        if match:
            content = re.sub(r"<[^>]+>", "", match.group(1))
            return content.strip()
        match = re.search(r"<title>(.*?)</title>", html_body, flags=re.IGNORECASE | re.DOTALL)
        if match:
            return match.group(1).strip()
        return None
    
    @staticmethod
    def _extract_excalidraw_json(markdown_text: str) -> Optional[Dict[str, Any]]:
        """Extract Excalidraw JSON data from a markdown file.
        
        Looks for a ```json code block and attempts to parse it as Excalidraw data.
        """
        # Match code blocks with optional 'json' language specifier
        code_block_pattern = re.compile(r'^```(?:json)?\s*\n(.*?)\n```', re.MULTILINE | re.DOTALL)
        matches = code_block_pattern.findall(markdown_text)
        
        for block_content in matches:
            try:
                data = json.loads(block_content.strip())
                # Validate that it looks like Excalidraw data
                if isinstance(data, dict) and ('elements' in data or 'type' in data):
                    return data
            except json.JSONDecodeError:
                continue
        
        return None


def parse_args(argv: Optional[Iterable[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build the Obsidian vault SPA")
    parser.add_argument("source", type=Path, help="Path to the source vault directory")
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT_DIR,
        help="Destination directory for the built site (default: ./docs)",
    )
    return parser.parse_args(list(argv) if argv is not None else None)


def main(argv: Optional[Iterable[str]] = None) -> int:
    args = parse_args(argv)
    builder = VaultBuilder(source=args.source.resolve(), output=args.output.resolve())
    builder.build()
    return 0


if __name__ == "__main__":  # pragma: no cover
    try:
        sys.exit(main())
    except (KeyboardInterrupt, FileNotFoundError, NotADirectoryError, RuntimeError, ValueError) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        sys.exit(1)
