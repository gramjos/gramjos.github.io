#!/usr/bin/env python3
"""
Convert a subset of an Obsidian vault into static HTML fragments plus a
navigable manifest for the Notes tab of the SPA.

Usage:
    python build.py /path/to/vault [--out /path/to/output]

Rules implemented here mirror the product requirements:
- A directory is eligible only when it contains a README.md (case-insensitive),
  except directories literally named "graphics" which are always copied.
- Only headings (H1-H5) and image syntaxes are rendered from Markdown. The rest
  of the text is wrapped in paragraphs with basic HTML escaping.
- README files act as directory home pages. Other Markdown files become
  individual content pages. Both are emitted as HTML alongside the original
  Markdown for inspection.
- A manifest.json file captures the navigable tree so the SPA can hydrate the
  Notes routes without additional build tooling.
"""

import argparse
import json
import os
import posixpath
import re
import shutil
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional

MARKDOWN_SUFFIX = ".md"
README_NAME = "README.md"
MANIFEST_FILENAME = "manifest.json"
DEFAULT_OUTPUT_SUFFIX = "_ready_2_serve"


@dataclass
class BuildContext:
    source_root: Path
    output_root: Path


def main() -> None:
    parser = argparse.ArgumentParser(description="Convert an Obsidian vault into SPA-friendly content.")
    parser.add_argument("vault_root", type=Path, help="Path to the Obsidian vault root directory")
    parser.add_argument("--out", type=Path, help="Optional output directory (defaults to <vault>_ready_2_serve)")
    parser.add_argument("--keep", action="store_true", help="Keep an existing output directory instead of replacing it")
    args = parser.parse_args()

    source_root = args.vault_root.expanduser().resolve()
    if not source_root.exists() or not source_root.is_dir():
        raise SystemExit(f"Vault root does not exist or is not a directory: {source_root}")

    output_root = (args.out.expanduser().resolve() if args.out
                    else (Path.cwd() / f"{source_root.name}{DEFAULT_OUTPUT_SUFFIX}").resolve())

    if output_root.exists() and not args.keep:
        shutil.rmtree(output_root)
    output_root.mkdir(parents=True, exist_ok=True)

    ctx = BuildContext(source_root=source_root, output_root=output_root)

    manifest_root = build_directory(ctx, directory=source_root, slug_segments=[], ancestor_chain=[])
    if manifest_root is None:
        raise SystemExit("Root directory must contain a README.md to seed the Notes content.")

    manifest = {
        "source": str(source_root),
        "output": str(output_root),
        "publicPath": f"/{output_root.name}",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "version": 1,
        "root": manifest_root,
    }

    manifest_path = output_root / MANIFEST_FILENAME
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")

    print(f"Written manifest to {manifest_path}")


def build_directory(ctx: BuildContext, directory: Path, slug_segments: List[str], ancestor_chain: List[Dict[str, str]]) -> Optional[Dict]:
    """Process a directory and return a manifest node when eligible."""
    relative_dir = directory.relative_to(ctx.source_root)
    is_root = not slug_segments
    dir_name_lower = directory.name.lower()

    if dir_name_lower == "graphics":
        copy_graphics_directory(ctx, directory, relative_dir)
        return None

    readme_path = find_readme(directory)
    if readme_path is None:
        if is_root:
            return None
        # Skip directories without a README, but continue to remove any previous outputs.
        return None

    output_dir = ctx.output_root / relative_dir
    output_dir.mkdir(parents=True, exist_ok=True)

    copy_file(readme_path, ctx, relative_dir)
    readme_html_rel = convert_markdown_file(ctx, readme_path)

    title = derive_title(directory.name if not is_root else "Notes")
    slug_path = "/".join(slug_segments)

    current_crumb = {
        "title": title,
        "slugPath": slug_path,
    }

    directory_children: List[Dict] = []
    files: List[Dict] = []

    for child in sorted(directory.iterdir(), key=lambda p: p.name.lower()):
        if child.is_dir():
            child_slug_segments = slug_segments + [slugify(child.name)]
            child_manifest = build_directory(
                ctx,
                directory=child,
                slug_segments=child_slug_segments,
                ancestor_chain=ancestor_chain + [current_crumb]
            )
            if child_manifest:
                directory_children.append(child_manifest)
        elif child.is_file():
            lower_name = child.name.lower()
            if lower_name == README_NAME.lower():
                continue
            if child.suffix.lower() == MARKDOWN_SUFFIX:
                copy_file(child, ctx, relative_dir)
                html_rel = convert_markdown_file(ctx, child)
                file_slug_segments = slug_segments + [slugify(child.stem)]
                files.append({
                    "type": "file",
                    "name": child.name,
                    "title": derive_title(child.stem),
                    "slug": slugify(child.stem),
                    "slugPath": "/".join(file_slug_segments),
                    "source": posix_path(relative_dir / child.name),
                    "html": html_rel,
                    "breadcrumbs": build_breadcrumbs(ancestor_chain + [current_crumb]),
                })
            else:
                copy_file(child, ctx, relative_dir)

    return {
        "type": "directory",
        "name": directory.name,
        "title": title,
        "slug": slugify(directory.name) if not is_root else "",
        "slugPath": slug_path,
        "readme": {
            "source": posix_path(relative_dir / README_NAME),
            "html": readme_html_rel,
        },
        "breadcrumbs": build_breadcrumbs(ancestor_chain),
        "directories": directory_children,
        "files": files,
    }


def build_breadcrumbs(chain: List[Dict[str, str]]) -> List[Dict[str, str]]:
    return [crumb for crumb in chain if crumb.get("slugPath") is not None]


def copy_graphics_directory(ctx: BuildContext, directory: Path, relative_dir: Path) -> None:
    destination = ctx.output_root / relative_dir
    if destination.exists():
        shutil.rmtree(destination)
    shutil.copytree(directory, destination)


def copy_file(source: Path, ctx: BuildContext, relative_dir: Path) -> None:
    destination = ctx.output_root / relative_dir / source.name
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, destination)


def convert_markdown_file(ctx: BuildContext, source: Path) -> str:
    relative_dir = source.parent.relative_to(ctx.source_root)
    destination = ctx.output_root / relative_dir / f"{source.stem}.html"
    html = render_markdown(ctx, source, source.read_text(encoding="utf-8"))
    destination.write_text(html, encoding="utf-8")
    return posix_path(destination.relative_to(ctx.output_root))


def render_markdown(ctx: BuildContext, source: Path, text: str) -> str:
    html_lines: List[str] = []
    paragraph_buffer: List[str] = []
    source_dir = source.parent
    relative_dir = source_dir.relative_to(ctx.source_root)

    def flush_paragraph() -> None:
        if paragraph_buffer:
            content = " ".join(paragraph_buffer)
            html_lines.append(f"<p>{escape_html(content)}</p>")
            paragraph_buffer.clear()

    for raw_line in text.splitlines():
        line = raw_line.rstrip()
        stripped = line.strip()
        if not stripped:
            flush_paragraph()
            continue

        heading_match = re.match(r"^(#{1,5})\s+(.*)$", stripped)
        if heading_match:
            flush_paragraph()
            level = len(heading_match.group(1))
            content = escape_html(heading_match.group(2).strip())
            html_lines.append(f"<h{level}>{content}</h{level}>")
            continue

        image_match = re.match(r"^!\[(.*?)\]\((.+?)\)\s*$", stripped)
        if image_match:
            flush_paragraph()
            alt = escape_html(image_match.group(1))
            src = normalise_image_src(ctx, source_dir, relative_dir, image_match.group(2))
            html_lines.append(f'<figure><img src="{escape_html(src)}" alt="{alt}"></figure>')
            continue

        obsidian_image_match = re.match(r"^!\[\[(.+?)\]\]\s*$", stripped)
        if obsidian_image_match:
            flush_paragraph()
            target = obsidian_image_match.group(1)
            reference = target.split("|", 1)[0]
            src = normalise_image_src(ctx, source_dir, relative_dir, reference)
            html_lines.append(f'<figure><img src="{escape_html(src)}" alt=""></figure>')
            continue

        paragraph_buffer.append(stripped)

    flush_paragraph()
    return "\n".join(html_lines)


def normalise_image_src(ctx: BuildContext, source_dir: Path, relative_dir: Path, raw_reference: str) -> str:
    reference = (raw_reference or "").strip()
    if not reference:
        return ""

    resolved = resolve_asset_reference(ctx, source_dir, reference)
    if not resolved:
        return reference

    asset_relative = resolved.relative_to(ctx.source_root)
    try:
        relative_path = posix_relpath(asset_relative, relative_dir)
    except ValueError:
        relative_path = asset_relative.as_posix()
    return relative_path


def resolve_asset_reference(ctx: BuildContext, source_dir: Path, reference: str) -> Optional[Path]:
    normalised = reference.replace("\\", "/")
    source_dir = source_dir.resolve()

    direct_candidate = (source_dir / normalised).resolve()
    if direct_candidate.exists() and direct_candidate.is_file() and is_within(direct_candidate, ctx.source_root):
        return direct_candidate

    if "/" in normalised:
        return None

    candidate = (source_dir / normalised).resolve()
    if candidate.exists() and candidate.is_file() and is_within(candidate, ctx.source_root):
        return candidate

    current = source_dir
    while True:
        graphics_dir = current / "graphics"
        candidate = (graphics_dir / normalised).resolve()
        if candidate.exists() and candidate.is_file() and is_within(candidate, ctx.source_root):
            return candidate
        if current == ctx.source_root:
            break
        current = current.parent

    return None


def is_within(path: Path, ancestor: Path) -> bool:
    try:
        path.relative_to(ancestor)
        return True
    except ValueError:
        return False


def posix_relpath(target: Path, start: Path) -> str:
    target_str = target.as_posix()
    start_str = start.as_posix()
    if not start_str or start_str == ".":
        start_str = "."
    result = posixpath.relpath(target_str, start_str)
    return result.replace("\\", "/")


def escape_html(value: str) -> str:
    return (value.replace("&", "&amp;")
                 .replace("<", "&lt;")
                 .replace(">", "&gt;")
                 .replace('"', "&quot;")
                 .replace("'", "&#39;"))


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower())
    slug = slug.strip("-")
    return slug or "section"


def derive_title(value: str) -> str:
    words = [w for w in re.split(r"[-_\s]+", value.strip()) if w]
    if not words:
        return value
    return " ".join(word.capitalize() for word in words)


def posix_path(path: Path) -> str:
    return "/".join(path.parts)


def find_readme(directory: Path) -> Optional[Path]:
    for entry in directory.iterdir():
        if entry.is_file() and entry.name.lower() == README_NAME.lower():
            return entry
    return None


if __name__ == "__main__":
    main()
