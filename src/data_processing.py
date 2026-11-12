"""Utilities for loading and validating movie preference data."""
from pathlib import Path
import pandas as pd


REQUIRED_COLUMNS = {"title", "rating"}


def load_movies(path: str | Path) -> pd.DataFrame:
    """Load a CSV and validate required columns and numeric ratings."""
    path = Path(path)
    if not path.exists():
        raise FileNotFoundError(
            f"Dataset not found: {path}. Add a CSV to data/raw/ or pass --input."
        )

    df = pd.read_csv(path)
    df.columns = [str(column).strip().lower() for column in df.columns]

    missing = REQUIRED_COLUMNS - set(df.columns)
    if missing:
        raise ValueError(
            "Dataset must include columns: title, rating. "
            f"Missing: {', '.join(sorted(missing))}"
        )

    df["title"] = df["title"].astype("string").str.strip()
    df["rating"] = pd.to_numeric(df["rating"], errors="coerce")
    df = df.dropna(subset=["title", "rating"])
    df = df[df["title"] != ""]
    df = df[df["rating"].between(0, 10, inclusive="both")]

    if "genres" in df.columns:
        df["genres"] = df["genres"].fillna("").astype("string").str.strip()

    return df.reset_index(drop=True)
