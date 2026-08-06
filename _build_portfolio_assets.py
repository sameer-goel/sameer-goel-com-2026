from __future__ import annotations

import html as html_module
import io
import json
import re
import shutil
import subprocess
import tempfile
import urllib.parse
import urllib.request
from pathlib import Path

from bs4 import BeautifulSoup
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent
ASSETS = ROOT / "portfolio-assets"
SPEAKING_DIR = ASSETS / "speaking"
WRITING_DIR = ASSETS / "writing"
DATA_FILE = ROOT / "portfolio-data.js"
USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
SPEAKING_URL = "https://sameer-publicspeaker.pages.dev/"
WRITING_URL = "https://sameer-thoughtleader.pages.dev/"

CATEGORY_LABELS = {
    "speaking": "Public Speaking",
    "teaching": "Teaching & Mindfulness",
    "hackathons": "Hackathons & Competitions",
    "hackathon": "Hackathons & Competitions",
    "conferences": "Conferences & Community",
    "conference": "Conferences & Community",
    "agentic": "Agentic AI",
    "ml": "Machine Learning",
    "data": "Data Science",
    "cloud": "AWS Cloud",
    "responsible": "Responsible AI",
}


def fetch(url: str) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=60) as response:
        return response.read()


def clean_text(node) -> str:
    if not node:
        return ""
    return " ".join(node.get_text(" ", strip=True).split())


def slug(value: str, fallback: str) -> str:
    normalized = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return (normalized[:64] or fallback).strip("-")


def save_webp(raw: bytes, destination: Path, max_size=(1200, 820)) -> None:
    with Image.open(io.BytesIO(raw)) as source:
        image = ImageOps.exif_transpose(source)
        if image.mode not in ("RGB", "RGBA"):
            image = image.convert("RGB")
        image.thumbnail(max_size, Image.Resampling.LANCZOS)
        destination.parent.mkdir(parents=True, exist_ok=True)
        image.save(destination, "WEBP", quality=80, method=6)


def download_image(base_url: str, remote_path: str, destination: Path) -> bool:
    try:
        save_webp(fetch(urllib.parse.urljoin(base_url, remote_path)), destination)
        return True
    except Exception as error:
        print(f"warning: image failed {remote_path}: {error}")
        return False


def extract_video_poster(video_url: str, destination: Path) -> bool:
    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as temp:
        temp_path = Path(temp.name)
    try:
        result = subprocess.run(
            [
                "ffmpeg", "-loglevel", "error", "-y",
                "-user_agent", USER_AGENT,
                "-ss", "2", "-i", video_url,
                "-frames:v", "1", "-q:v", "3", str(temp_path),
            ],
            capture_output=True,
            timeout=90,
        )
        if result.returncode != 0 or temp_path.stat().st_size == 0:
            return False
        save_webp(temp_path.read_bytes(), destination)
        return True
    except Exception as error:
        print(f"warning: video poster failed {video_url}: {error}")
        return False
    finally:
        temp_path.unlink(missing_ok=True)


def scrape_speaking() -> list[dict]:
    soup = BeautifulSoup(fetch(SPEAKING_URL), "html.parser")
    cards = soup.select("article.photo-card")
    items: list[dict] = []

    for index, card in enumerate(cards, start=1):
        thumb = card.select_one(".thumb")
        image = thumb.select_one("img") if thumb else None
        source = thumb.select_one("video source") if thumb else None
        video_path = (thumb.get("data-video") if thumb else None) or (source.get("src") if source else None)
        if video_path:
            video_path = video_path.split("#", 1)[0]
        title = clean_text(card.select_one("h4"))
        subtitle = clean_text(card.select_one(".sub"))
        meta = card.select(".meta > *")
        category_key = card.get("data-cat", "speaking")
        category = clean_text(meta[0]) if meta else CATEGORY_LABELS.get(category_key, category_key.title())
        date = clean_text(meta[-1]) if meta else ""
        caption = (thumb.get("data-caption", "") if thumb else "") or subtitle or title
        alt = image.get("alt", "") if image else caption
        stem = slug(title + "-" + subtitle, f"speaking-{index}")
        local_path = SPEAKING_DIR / f"{index:02d}-{stem}.webp"
        local_web = f"portfolio-assets/speaking/{local_path.name}"

        if image and image.get("src"):
            ok = download_image(SPEAKING_URL, image["src"], local_path)
            if not ok:
                local_web = ""

        item = {
            "category": category,
            "date": date,
            "title": title,
            "subtitle": subtitle,
            "caption": caption,
            "alt": alt,
            "image": local_web if image else "",
            "video": urllib.parse.urljoin(SPEAKING_URL, video_path) if video_path else "",
        }
        items.append(item)

    # Video cards borrow a still from the same event where possible. If the
    # event has no still, extract a single local poster without copying the video.
    for index, item in enumerate(items, start=1):
        if not item["video"]:
            continue
        sibling = next(
            (
                candidate for candidate in items
                if not candidate["video"] and candidate["title"] == item["title"] and candidate["image"]
            ),
            None,
        )
        if sibling:
            item["image"] = sibling["image"]
            continue
        stem = slug(item["title"] + "-video", f"video-{index}")
        poster = SPEAKING_DIR / f"{index:02d}-{stem}.webp"
        if extract_video_poster(item["video"], poster):
            item["image"] = f"portfolio-assets/speaking/{poster.name}"

    return items


def scrape_writing() -> list[dict]:
    soup = BeautifulSoup(fetch(WRITING_URL), "html.parser")
    items: list[dict] = []

    for index, card in enumerate(soup.select("section.cat-section article.blog-card"), start=1):
        section = card.find_parent("section", class_="cat-section")
        category_key = section.get("data-cat", "") if section else ""
        category = CATEGORY_LABELS.get(category_key, category_key.title())
        thumb_link = card.select_one("a.thumb")
        title_link = card.select_one("h4 a")
        link = (thumb_link or title_link)
        image = card.select_one(".thumb img")
        meta = card.select(".meta > *")
        tags = [clean_text(tag) for tag in card.select(".tags .tag")]
        authors_node = card.select_one(".co-authors, .co-author, .authors")
        title = clean_text(card.select_one("h4"))
        local_web = ""

        if image and image.get("src"):
            stem = slug(title, f"writing-{index}")
            destination = WRITING_DIR / f"{index:02d}-{stem}.webp"
            if download_image(WRITING_URL, image["src"], destination):
                local_web = f"portfolio-assets/writing/{destination.name}"

        items.append({
            "category": category,
            "publication": clean_text(meta[0]) if meta else "",
            "date": clean_text(meta[-1]) if meta else "",
            "title": title,
            "summary": clean_text(card.select_one(".summary")),
            "authors": clean_text(authors_node),
            "tags": [tag for tag in tags if tag and tag != category],
            "image": local_web,
            "url": html_module.unescape(link.get("href", "")) if link else "",
        })

    return items


def main() -> None:
    ASSETS.mkdir(exist_ok=True)
    SPEAKING_DIR.mkdir(exist_ok=True)
    WRITING_DIR.mkdir(exist_ok=True)

    speaking = scrape_speaking()
    writing = scrape_writing()
    payload = {
        "sources": {"speaking": SPEAKING_URL, "writing": WRITING_URL},
        "speaking": speaking,
        "writing": writing,
    }
    data = json.dumps(payload, ensure_ascii=False, indent=2)
    DATA_FILE.write_text("window.PORTFOLIO_DATA = " + data + ";\n", encoding="utf-8")

    speaking_images = sum(1 for item in speaking if item["image"])
    writing_images = sum(1 for item in writing if item["image"])
    videos = sum(1 for item in speaking if item["video"])
    print(f"speaking={len(speaking)} images={speaking_images} videos={videos}")
    print(f"writing={len(writing)} images={writing_images}")
    print(f"data={DATA_FILE.name} bytes={DATA_FILE.stat().st_size}")


if __name__ == "__main__":
    main()
