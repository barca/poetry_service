import requests
from bs4 import BeautifulSoup
import time
import re
import json
import os
from urllib.parse import unquote

BASE_URL = "https://www.public-domain-poetry.com"
LIST_URL = BASE_URL + "/listpoetry.php?letter=All"
RATE_LIMIT_SECONDS = 1

PROGRESS_FILE = "progress.json"
OUTPUT_FILE = "poems.ndjson"

def get_total_pages():
    """Fetch the first listing page and determine the total number of pages."""
    response = requests.get(LIST_URL)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")
    
    # Look for a text pattern like "(771 Pages, 50 Poems Shown)"
    pagination_text = soup.find(text=re.compile(r"\(\s*\d+\s+Pages"))
    if pagination_text:
        match = re.search(r"\(\s*(\d+)\s+Pages", pagination_text)
        if match:
            total_pages = int(match.group(1))
            print(f"Total pages found: {total_pages}")
            return total_pages

    # Fallback: use digit-only page links
    page_numbers = [int(a.get_text(strip=True)) for a in soup.find_all("a", href=True)
                    if a.get_text(strip=True).isdigit()]
    if page_numbers:
        total_pages = max(page_numbers)
        print(f"Total pages determined from links: {total_pages}")
        return total_pages

    return 1

def parse_poem_page(relative_url, poem_id):
    """Fetch and parse a single poem page to extract title, author, and poem text."""
    full_url = relative_url if relative_url.startswith("http") else BASE_URL + "/" + relative_url
    response = requests.get(full_url)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")
    
    # Extract title: try <font class="t0"> first; fallback to <title>
    title_el = soup.find("font", class_="t0")
    title = title_el.get_text(strip=True) if title_el else (soup.title.get_text(strip=True) if soup.title else "No Title")
    
    # Remove the unwanted prefix from the title if present.
    unwanted_prefix = "Public Domain Poetry - "
    if title.startswith(unwanted_prefix):
        title = title[len(unwanted_prefix):]
    
    # Extract author: look for <font class="t1"> with an <a> tag
    author = ""
    author_el = soup.find("font", class_="t1")
    if author_el:
        a_author = author_el.find("a")
        author = a_author.get_text(strip=True) if a_author else author_el.get_text(strip=True)
    
    # Extract the poem text from <font class="t3a">
    poem_text = ""
    text_el = soup.find("font", class_="t3a")
    if text_el:
        poem_text = text_el.get_text(separator="\n", strip=False)
    
    return {
        "id": poem_id,
        "title": title,
        "author": author,
        "text": poem_text
    }

def load_progress():
    """Load progress from file, if it exists. Returns a tuple: (last_page, next_poem_id)."""
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE, "r", encoding="utf-8") as f:
            try:
                progress = json.load(f)
                last_page = progress.get("last_page", 0)
                next_poem_id = progress.get("next_poem_id", 1)
                print(f"Resuming from page {last_page + 1} with next poem ID {next_poem_id}.")
                return last_page, next_poem_id
            except Exception as e:
                print(f"Error loading progress file: {e}")
    return 0, 1

def save_progress(last_page, next_poem_id):
    """Save current progress to the progress file."""
    progress = {"last_page": last_page, "next_poem_id": next_poem_id}
    with open(PROGRESS_FILE, "w", encoding="utf-8") as f:
        json.dump(progress, f)
    print(f"Progress saved: Last page = {last_page}, Next poem ID = {next_poem_id}")

def poem_generator(start_page, next_poem_id, total_pages):
    """
    Generator that processes one listing page at a time.
    Yields poem data as soon as it is scraped.
    """
    current_poem_id = next_poem_id
    for page in range(start_page, total_pages + 1):
        page_url = LIST_URL if page == 1 else f"{LIST_URL}&page={page}"
        print(f"Processing listing page: {page_url}")
        response = requests.get(page_url)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")
        
        # Find poem links using a heuristic and ensure they're internal.
        poem_links = []
        for a in soup.find_all("a", href=True):
            raw_link = a["href"]
            # Decode URL to remove any %20 and strip whitespace.
            decoded_link = unquote(raw_link).strip()
            if "/" in decoded_link and "-" in decoded_link:
                # Check that the link is internal
                if not decoded_link.startswith("http") or BASE_URL in decoded_link:
                    poem_links.append(decoded_link)
        
        for link in poem_links:
            try:
                poem = parse_poem_page(link, current_poem_id)
                yield poem
                current_poem_id += 1
            except Exception as e:
                print(f"Error processing {link}: {e}")
            time.sleep(RATE_LIMIT_SECONDS)
        
        # Update progress after finishing this listing page.
        save_progress(page, current_poem_id)
        time.sleep(RATE_LIMIT_SECONDS)
    print("All pages processed.")

def main():
    total_pages = get_total_pages()
    last_page, next_poem_id = load_progress()
    
    with open(OUTPUT_FILE, "a", encoding="utf-8") as out_file:
        for poem in poem_generator(last_page + 1, next_poem_id, total_pages):
            json_line = json.dumps(poem, ensure_ascii=False)
            out_file.write(json_line + "\n")
            out_file.flush()
    print("Scraping complete.")

if __name__ == "__main__":
    main()
