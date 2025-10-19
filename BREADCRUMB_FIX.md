# Breadcrumb Fix Summary

## Problem
Breadcrumbs were displaying extremely long text from H6 headings (e.g., "Asynchronous programming allows the app to complete time-consuming tasks...") instead of concise page titles.

## Root Cause
1. The Markdown parser was extracting **any first heading** (H1-H6) as the page title
2. Many Obsidian notes use H6 for descriptive text/summaries rather than titles
3. For non-README pages, the first H1 was often a section heading, not a page title

## Solution Implemented

### 1. Prefer H1/H2 for Titles (build.py line 131)
```python
if first_heading is None and level <= 2:
    # Only use H1 or H2 as title to avoid long descriptive text
    first_heading = self._strip_html(rendered)
```

### 2. Use Filename for Regular Pages (build.py lines 418-428)
```python
# For README files, prefer heading over filename for directory representation
if is_readme:
    if not first_heading and rel_path.stem:
        first_heading = self._title_from_directory(directory)
    title = first_heading or self._title_from_filename(path.name)
else:
    # For regular pages, prefer short filenames over long headings for breadcrumbs
    # Use filename as primary title, heading is available in page content
    title = self._title_from_filename(path.name)
```

## Result
- **README files**: Use first H1/H2 heading (or directory name if missing)
- **Regular pages**: Use filename converted to title case (e.g., "Async.md" → "Async")
- **Breadcrumbs**: Now show clean, concise names like "Root / Flutter Cookbook Simone / Async"

## Example Before/After
**Before**: `Root / Flutter Cookbook Simone / Asynchronous programming allows the app to complete time-consuming tasks (writing data to a server, retrieving web data, opening then reading/writing to a file), while running other tasks concurrently.`

**After**: `Root / Flutter Cookbook Simone / Async`
