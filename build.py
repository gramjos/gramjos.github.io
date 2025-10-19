#!/usr/bin/env python3
"""Build a static SPA shell around an exported Obsidian vault."""

from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path, PurePosixPath
from typing import Dict, Iterable, List, Optional, Sequence, Tuple
from urllib.parse import quote
import html


class MarkdownParser:
    """Convert a subset of Obsidian flavored Markdown into HTML fragments."""

    def __init__(self) -> None:
        self._code_counter = 0

    def parse(self, markdown_text: str) -> str:
        lines = markdown_text.splitlines()
        blocks: List[str] = []
        paragraph_lines: List[str] = []
        list_stack: List[Tuple[int, str]] = []  # (indent, tag)
        in_code_block = False
        code_lines: List[str] = []
        code_language = ""

        def flush_paragraph() -> None:
            nonlocal paragraph_lines
            if not paragraph_lines:
                return
            content = " ".join(paragraph_lines)
            blocks.append(f"<p>{self._apply_inlines(content)}</p>")
            paragraph_lines = []

        def close_all_lists() -> None:
            while list_stack:
                _, tag = list_stack.pop()
                blocks.append(f"</{tag}>")

        def adjust_list(indent: int, tag: str) -> None:
            while list_stack and indent < list_stack[-1][0]:
                _, close_tag = list_stack.pop()
                blocks.append(f"</{close_tag}>")
            if list_stack and indent == list_stack[-1][0] and list_stack[-1][1] != tag:
                _, close_tag = list_stack.pop()
                blocks.append(f"</{close_tag}>")
            if not list_stack or indent > list_stack[-1][0] or (list_stack and indent == list_stack[-1][0] and list_stack[-1][1] != tag):
                list_stack.append((indent, tag))
                blocks.append(f"<{tag}>")

        iterator: Sequence[str] = list(lines)
        for raw_line in iterator:
            line = raw_line.rstrip("\n")
            stripped = line.strip()

            if in_code_block:
                if stripped.startswith("```"):
                    blocks.append(self._render_code_block(code_lines, code_language))
                    code_lines = []
                    code_language = ""
                    in_code_block = False
                else:
                    code_lines.append(line)
                continue

            if stripped.startswith("```"):
                flush_paragraph()
                close_all_lists()
                in_code_block = True
                code_language = stripped[3:].strip()
                continue

            if not stripped:
                flush_paragraph()
                continue

            image_html = self._maybe_render_image(stripped)
            if image_html:
                flush_paragraph()
                close_all_lists()
                blocks.append(image_html)
                continue

            heading = self._match_heading(stripped)
            if heading:
                flush_paragraph()
                close_all_lists()
                level, heading_text = heading
                blocks.append(f"<h{level}>{self._apply_inlines(heading_text)}</h{level}>")
                continue

            list_item = self._match_list_item(line)
            if list_item:
                indent, tag, content = list_item
                flush_paragraph()
                adjust_list(indent, tag)
                blocks.append(f"<li>{self._apply_inlines(content)}</li>")
                continue

            paragraph_lines.append(stripped)

        if in_code_block:
            blocks.append(self._render_code_block(code_lines, code_language))

        flush_paragraph()
        close_all_lists()
        return "\n".join(block for block in blocks if block)

    def _render_code_block(self, lines: List[str], language: str) -> str:
        self._code_counter += 1
        code_text = "\n".join(lines)
        escaped = html.escape(code_text)
        lang_class = f" language-{language}" if language else ""
        pre_id = f"code-block-{self._code_counter}"
        language_attr = f' data-language="{html.escape(language)}"' if language else ""
        pre = f'<pre id="{pre_id}"{language_attr}><code class="code-block{lang_class}">{escaped}</code></pre>'
        return f'<figure class="code-block">{pre}</figure>'

    def _match_heading(self, line: str) -> Optional[Tuple[int, str]]:
        match = re.match(r"^(#{1,6})\s+(.*)$", line)
        if not match:
            return None
        level = len(match.group(1))
        text = match.group(2).strip()
        return level, text

    def _match_list_item(self, line: str) -> Optional[Tuple[int, str, str]]:
        unordered = re.match(r"^(\s*)([-*+])\s+(.*)$", line)
        if unordered:
            indent = len(unordered.group(1))
            content = unordered.group(3).strip()
            return indent, "ul", content
        ordered = re.match(r"^(\s*)(\d+)\.\s+(.*)$", line)
        if ordered:
            indent = len(ordered.group(1))
            content = ordered.group(3).strip()
            return indent, "ol", content
        return None

    def _maybe_render_image(self, line: str) -> Optional[str]:
        web_image = re.match(r"^!\[(.*?)\]\((.+)\)$", line)
        if web_image:
            size_spec = web_image.group(1).strip()
            source = web_image.group(2).strip()
            width, height = self._parse_size(size_spec)
            attrs = self._image_attrs(source, width, height)
            return f"<figure class=\"image-block\"><img {attrs} /></figure>"

        local_image = re.match(r"^!\[\[(.*?)(?:\|(.*?))?\]\]$", line)
        if local_image:
            path = local_image.group(1).strip()
            size_spec = (local_image.group(2) or "").strip()
            width, height = self._parse_size(size_spec)
            attrs = self._image_attrs(path, width, height, alt=Path(path).stem)
            return f"<figure class=\"image-block\"><img {attrs} /></figure>"
        return None

    def _parse_size(self, size_spec: str) -> Tuple[Optional[int], Optional[int]]:
        if not size_spec:
            return None, None
        if "x" in size_spec.lower():
            parts = size_spec.lower().split("x", 1)
            try:
                height = int(parts[0])
                width = int(parts[1])
                return width, height
            except ValueError:
                return None, None
        try:
            width = int(size_spec)
            return width, None
        except ValueError:
            return None, None

    def _image_attrs(
        self,
        source: str,
        width: Optional[int],
        height: Optional[int],
        alt: Optional[str] = None,
    ) -> str:
        attributes = [f'src="{self._escape_attr(source)}"']
        if alt:
            attributes.append(f'alt="{self._escape_attr(alt)}"')
        else:
            attributes.append('alt=""')
        if width:
            attributes.append(f'width="{width}"')
        if height:
            attributes.append(f'height="{height}"')
        return " ".join(attributes)

    def _apply_inlines(self, text: str) -> str:
        escaped = html.escape(text, quote=False)

        escaped = re.sub(
            r"`([^`]+)`",
            lambda match: f"<code>{match.group(1)}</code>",
            escaped,
        )

        escaped = re.sub(
            r"\*\*([^*]+)\*\*",
            lambda match: f"<strong>{match.group(1)}</strong>",
            escaped,
        )

        escaped = re.sub(
            r"\*([^*]+)\*",
            lambda match: f"<em>{match.group(1)}</em>",
            escaped,
        )

        escaped = re.sub(
            r"\[\[([^\]|]+)(?:\|([^\]]+))?\]\]",
            lambda match: self._render_wikilink(match.group(1), match.group(2)),
            escaped,
        )

        escaped = re.sub(
            r"\[([^\]]+)\]\(([^)]+)\)",
            lambda match: (
                f'<a href="{self._escape_attr(match.group(2))}" target="_blank" rel="noopener">{match.group(1)}</a>'
            ),
            escaped,
        )

        return escaped

    def _escape_attr(self, value: str) -> str:
        return html.escape(value, quote=True)

    def _render_wikilink(self, target: Optional[str], alias: Optional[str]) -> str:
        raw_target = html.unescape(target or "").strip()
        if not raw_target:
            fallback = alias or ""
            return html.escape(fallback, quote=False)
        raw_alias = html.unescape(alias or "").strip()
        display = raw_alias or raw_target
        href = self._escape_attr(self._wikilink_href(raw_target))
        label = html.escape(display, quote=False)
        return f'<a href="{href}">{label}</a>'

    def _wikilink_href(self, target: str) -> str:
        cleaned = target.strip()
        lower = cleaned.lower()
        if lower.endswith(".md"):
            cleaned = cleaned[:-3]
        elif lower.endswith(".html"):
            cleaned = cleaned[:-5]
        cleaned = cleaned.lstrip("./")
        return quote(cleaned, safe="/")


@dataclass
class PageRecord:
    page_id: str
    title: str


@dataclass
class FileEntry:
    stem: str
    html: Optional[Path]
    md: Optional[Path]


class VaultSiteBuilder:
    def __init__(self, source_dir: Path, output_dir: Path) -> None:
        self.source_dir = source_dir
        self.output_dir = output_dir
        self.pages: Dict[str, Dict[str, object]] = {}
        self.assets: List[PurePosixPath] = []
        self.home_id: Optional[str] = None
        self.about_id: Optional[str] = None
        self.parser = MarkdownParser()

    def build(self) -> None:
        self._validate_source()
        self._reset_output()
        self._collect_site()
        self._emit_site_data()
        self._copy_template_files()
        self._copy_assets()

    def _validate_source(self) -> None:
        if not self.source_dir.exists() or not self.source_dir.is_dir():
            raise FileNotFoundError(f"Source directory not found: {self.source_dir}")

    def _reset_output(self) -> None:
        if self.output_dir.exists():
            shutil.rmtree(self.output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def _collect_site(self) -> None:
        self._walk_directory(self.source_dir, PurePosixPath("."))
        if not self.home_id:
            raise RuntimeError("Root README.md (or README.html) is required but was not found.")

    def _walk_directory(self, directory: Path, rel_path: PurePosixPath) -> Optional[PageRecord]:
        entries = list(directory.iterdir())
        files = sorted((entry for entry in entries if entry.is_file()), key=lambda path: path.name.lower())
        dirs = sorted((entry for entry in entries if entry.is_dir()), key=lambda path: path.name.lower())

        readme_html = next((f for f in files if f.name.lower() == "readme.html"), None)
        readme_md = next((f for f in files if f.name.lower() == "readme.md"), None)
        is_graphics_dir = directory.name == "graphics"

        child_dir_refs: List[Tuple[str, str]] = []
        for child_dir in dirs:
            child_rel = rel_path / child_dir.name
            record = self._walk_directory(child_dir, child_rel)
            if record:
                child_dir_refs.append((record.title.lower(), record.page_id))

        file_index: Dict[str, FileEntry] = {}
        file_refs: List[Tuple[str, str]] = []

        for file_path in files:
            lower_name = file_path.name.lower()
            suffix = file_path.suffix.lower()
            if lower_name in {"readme.md", "readme.html"}:
                continue
            if suffix in {".html", ".md"}:
                key = file_path.stem.lower()
                entry = file_index.get(key)
                if entry is None:
                    entry = FileEntry(stem=file_path.stem, html=None, md=None)
                    file_index[key] = entry
                if suffix == ".html":
                    entry.html = file_path
                    entry.stem = file_path.stem
                else:
                    entry.md = file_path
                    if entry.html is None:
                        entry.stem = file_path.stem
                continue
            self._register_asset(file_path, rel_path)

        for entry in file_index.values():
            page_id, title = self._collect_file_page(
                stem=entry.stem,
                rel_path=rel_path,
                html_path=entry.html,
                md_path=entry.md,
            )
            file_refs.append((title.lower(), page_id))

        if readme_html or readme_md:
            child_dir_refs.sort(key=lambda pair: pair[0])
            file_refs.sort(key=lambda pair: pair[0])
            directories = [identifier for _, identifier in child_dir_refs]
            files_list = [identifier for _, identifier in file_refs]
            return self._collect_directory_page(
                directory=directory,
                rel_path=rel_path,
                readme_html=readme_html,
                readme_md=readme_md,
                child_dirs=directories,
                child_files=files_list,
            )

        if not is_graphics_dir:
            for file_path in files:
                if file_path.suffix.lower() not in {".html", ".md"}:
                    self._register_asset(file_path, rel_path)
        return None

    def _collect_directory_page(
        self,
        directory: Path,
        rel_path: PurePosixPath,
        readme_html: Optional[Path],
        readme_md: Optional[Path],
        child_dirs: List[str],
        child_files: List[str],
    ) -> PageRecord:
        page_id = self._rel_to_id(rel_path)
        parent_id = None if page_id == "root" else self._rel_to_id(rel_path.parent)
        base_path = self._rel_to_base(rel_path)
        # For root page, always use "Home" instead of extracting from markdown
        if page_id == "root":
            title = "Home"
        else:
            title = self._title_from_markdown(readme_md) or self._default_title(directory, page_id)
        content, source_path, aliases = self._resolve_page_content(
            rel_dir=rel_path,
            html_path=readme_html,
            md_path=readme_md,
            stem="README",
        )

        page_payload = {
            "id": page_id,
            "type": "directory",
            "title": title,
            "content": content,
            "directories": child_dirs,
            "files": child_files,
            "parent": parent_id,
            "basePath": base_path,
            "sourcePath": source_path,
            "aliases": aliases,
        }
        self.pages[page_id] = page_payload
        if page_id == "root":
            self.home_id = page_id
        return PageRecord(page_id=page_id, title=title)

    def _collect_file_page(
        self,
        stem: str,
        rel_path: PurePosixPath,
        html_path: Optional[Path],
        md_path: Optional[Path],
    ) -> Tuple[str, str]:
        page_id = self._rel_to_id(rel_path / stem)
        parent_id = self._rel_to_id(rel_path)
        base_path = self._rel_to_base(rel_path)
        title = self._title_from_markdown(md_path) or self._humanize(stem)
        content, source_path, aliases = self._resolve_page_content(
            rel_dir=rel_path,
            html_path=html_path,
            md_path=md_path,
            stem=stem,
        )
        slug_lower = stem.lower()

        page_payload = {
            "id": page_id,
            "type": "file",
            "title": title,
            "content": content,
            "directories": [],
            "files": [],
            "parent": parent_id,
            "basePath": base_path,
            "sourcePath": source_path,
            "aliases": aliases,
        }
        self.pages[page_id] = page_payload
        if parent_id == "root" and slug_lower == "about":
            self.about_id = page_id
        return page_id, title

    def _register_asset(self, file_path: Path, rel_path: PurePosixPath) -> None:
        rel_file = rel_path / file_path.name
        rel_clean = PurePosixPath(self._strip_leading_dot(rel_file.as_posix()))
        if rel_clean not in self.assets:
            self.assets.append(rel_clean)

    def _emit_site_data(self) -> None:
        site_title = self.pages[self.home_id]["title"] if self.home_id else "Vault"
        payload = {
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "source": str(self.source_dir),
            "siteTitle": site_title,
            "homePageId": self.home_id,
            "aboutPageId": self.about_id,
            "pages": self.pages,
        }
        data_path = self.output_dir / "site-data.json"
        data_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    def _copy_template_files(self) -> None:
        template_dir = Path(__file__).parent / "templates"
        if not template_dir.exists():
            raise FileNotFoundError(f"Template directory missing: {template_dir}")
        for template in template_dir.iterdir():
            if template.is_file():
                shutil.copyfile(template, self.output_dir / template.name)

    def _copy_assets(self) -> None:
        for asset_rel in sorted(self.assets, key=lambda path: path.as_posix()):
            source_path = self.source_dir / asset_rel
            target_path = self.output_dir / asset_rel
            target_path.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source_path, target_path)

    def _rel_to_id(self, relative: PurePosixPath) -> str:
        text = relative.as_posix()
        return "root" if text in {"", "."} else text

    def _rel_to_base(self, relative: PurePosixPath) -> str:
        text = relative.as_posix()
        return "" if text in {"", "."} else text

    def _rel_to_source_path(self, rel_dir: PurePosixPath, filename: str) -> str:
        path = rel_dir / filename
        return self._strip_leading_dot(path.as_posix())

    def _strip_leading_dot(self, value: str) -> str:
        while value.startswith("./"):
            value = value[2:]
        return value.lstrip("/")

    def _title_from_markdown(self, md_path: Optional[Path]) -> Optional[str]:
        if not md_path or not md_path.exists():
            return None
        try:
            with md_path.open("r", encoding="utf-8") as handle:
                for raw_line in handle:
                    line = raw_line.strip()
                    if not line:
                        continue
                    if line.startswith("#"):
                        return line.lstrip("#").strip()
        except UnicodeDecodeError:
            return None
        return None

    def _read_html_fragment(self, html_path: Path) -> str:
        text = html_path.read_text(encoding="utf-8")
        lower = text.lower()
        if "<body" not in lower:
            return text.strip()
        start = lower.find("<body")
        start = text.find(">", start)
        if start == -1:
            return text.strip()
        start += 1
        end = lower.find("</body>", start)
        if end == -1:
            end = len(text)
        return text[start:end].strip()

    def _resolve_page_content(
        self,
        rel_dir: PurePosixPath,
        html_path: Optional[Path],
        md_path: Optional[Path],
        stem: str,
    ) -> Tuple[str, str, List[str]]:
        aliases: List[str] = []
        if html_path and html_path.exists():
            content = self._read_html_fragment(html_path)
            source_path = self._rel_to_source_path(rel_dir, html_path.name)
            if md_path and md_path.exists():
                md_alias = self._rel_to_source_path(rel_dir, md_path.name)
                if md_alias != source_path:
                    aliases.append(md_alias)
            return content, source_path, aliases

        if md_path and md_path.exists():
            markdown_text = md_path.read_text(encoding="utf-8", errors="ignore")
            content = self.parser.parse(markdown_text)
            source_path = self._rel_to_source_path(rel_dir, md_path.name)
            html_alias = self._rel_to_source_path(rel_dir, f"{stem}.html")
            if html_alias not in aliases and html_alias != source_path:
                aliases.append(html_alias)
            return content, source_path, aliases

        raise FileNotFoundError("No content source found for page")

    def _default_title(self, directory: Path, page_id: str) -> str:
        if page_id == "root":
            return "Home"
        return self._humanize(directory.name)

    def _humanize(self, token: str) -> str:
        if not token:
            return "Untitled"
        translated = token.replace("_", " ").replace("-", " ")
        return " ".join(part.capitalize() for part in translated.split())


def parse_args(argv: Iterable[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build the vault SPA shell.")
    parser.add_argument("source", type=Path, help="Path to the exported Obsidian vault root.")
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        default=Path("docs"),
        help="Directory to write the generated site (defaults to ./docs).",
    )
    return parser.parse_args(list(argv))


def main(argv: Optional[List[str]] = None) -> None:
    args = parse_args(argv or sys.argv[1:])
    builder = VaultSiteBuilder(args.source.resolve(), args.output.resolve())
    builder.build()


if __name__ == "__main__":
    main()
