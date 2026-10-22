"""Command-line entry point for movie preference analysis."""
import argparse
from pathlib import Path
import pandas as pd

from src.data_processing import load_movies
from src.visualization import save_rating_distribution, save_top_movies, save_genre_counts, save_cluster_visualization


def analyze_movies(input_path: str | Path) -> dict:
    """Analyze a CSV dataset and save cleaned data, summaries, and charts."""
    movies = load_movies(input_path)

    processed_dir = Path("data/processed")
    figures_dir = Path("outputs/figures")
    processed_dir.mkdir(parents=True, exist_ok=True)
    figures_dir.mkdir(parents=True, exist_ok=True)

    cleaned_path = processed_dir / "movies_cleaned.csv"
    movies.to_csv(cleaned_path, index=False)

    summary = {
        "movie_count": int(len(movies)),
        "average_rating": float(movies["rating"].mean()),
        "median_rating": float(movies["rating"].median()),
        "highest_rating": float(movies["rating"].max()),
    }

    save_rating_distribution(movies, figures_dir / "rating_distribution.png")
    save_top_movies(movies, figures_dir / "top_movies.png")
    if "genres" in movies.columns:
        save_genre_counts(movies, figures_dir / "popular_genres.png")
    save_cluster_visualization(movies, figures_dir / "movie_clusters.png")

    summary_path = processed_dir / "summary.txt"
    summary_path.write_text(
        "\n".join(f"{key.replace('_', ' ').title()}: {value:.2f}" if isinstance(value, float)
                  else f"{key.replace('_', ' ').title()}: {value}"
                  for key, value in summary.items()),
        encoding="utf-8",
    )
    return summary


def main() -> None:
    parser = argparse.ArgumentParser(description="Analyze movie ratings and preferences.")
    parser.add_argument(
        "--input",
        default="data/raw/movies.csv",
        help="Path to a CSV with title and rating columns (optional genres column).",
    )
    args = parser.parse_args()

    try:
        summary = analyze_movies(args.input)
    except (FileNotFoundError, ValueError, pd.errors.ParserError) as exc:
        parser.error(str(exc))

    print("Movie Preference Analysis")
    print("-" * 26)
    for key, value in summary.items():
        if isinstance(value, float):
            print(f"{key.replace('_', ' ').title()}: {value:.2f}")
        else:
            print(f"{key.replace('_', ' ').title()}: {value}")
    print("\nSaved cleaned data to data/processed/")
    print("Saved charts to outputs/figures/")


if __name__ == "__main__":
    main()
