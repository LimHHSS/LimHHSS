"""Reference immutable graph files so a new render gets a new image URL."""
from pathlib import Path
import re
import sys

revision = sys.argv[1]
if not re.fullmatch(r'[0-9a-f]{40}', revision):
    raise ValueError('Expected a full commit SHA')
readme = Path('README.md')
text = readme.read_text(encoding='utf-8')
text, count = re.subn(
    r'https://raw\.githubusercontent\.com/LimHHSS/LimHHSS/(?:output|[0-9a-f]{40})/(bomberman-contribution-graph(?:-dark)?\.svg)(?:\?[^"\s]*)?',
    lambda match: f'https://raw.githubusercontent.com/LimHHSS/LimHHSS/{revision}/{match[1]}',
    text,
)
if count != 3:
    raise ValueError(f'Expected 3 image references, found {count}')
readme.write_text(text, encoding='utf-8')
