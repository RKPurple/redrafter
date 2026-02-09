#!/usr/bin/env python3
"""Run basketball-reference and Wikipedia draft scrapers for a given year."""

import argparse

from scrape_bb import scrape_draft as scrape_bb_draft
from scrape_w import scrape_draft as scrape_w_draft


def main():
    parser = argparse.ArgumentParser(description="Run draft scrapers (basketball-reference and Wikipedia).")
    parser.add_argument(
        "-y", "--year",
        type=int,
        default=2025,
        help="Draft year to scrape (default: 2025)",
    )
    args = parser.parse_args()

    year = args.year
    print(f"Scraping draft year {year}...")

    print("  Running basketball-reference scraper...")
    scrape_bb_draft(year)

    print("  Running Wikipedia scraper...")
    scrape_w_draft(year)

    print("Done.")


if __name__ == "__main__":
    main()
