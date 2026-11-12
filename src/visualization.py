"""Chart creation helpers for movie analysis."""
import re
from pathlib import Path

import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt


def _split_genres(value: object) -> list[str]:
    """Split a genre field across common separators and trim whitespace."""
    if pd.isna(value):
        return []
    return [part.strip() for part in re.split(r"[|,;]", str(value)) if part.strip()]


def save_rating_distribution(movies: pd.DataFrame, output: str | Path) -> None:
    """Save a histogram of movie ratings."""
    output = Path(output)
    output.parent.mkdir(parents=True, exist_ok=True)
    fig, ax = plt.subplots(figsize=(8, 5))
    ax.hist(movies["rating"], bins=10, edgecolor="black")
    ax.set(title="Movie Rating Distribution", xlabel="Rating", ylabel="Number of movies")
    fig.tight_layout()
    fig.savefig(output, dpi=160)
    plt.close(fig)


def save_top_movies(movies: pd.DataFrame, output: str | Path, limit: int = 10) -> None:
    """Save a horizontal bar chart of the highest-rated movies."""
    output = Path(output)
    output.parent.mkdir(parents=True, exist_ok=True)
    top = movies.nlargest(limit, "rating").sort_values("rating")
    fig, ax = plt.subplots(figsize=(9, max(4, 0.45 * len(top))))
    ax.barh(top["title"].astype(str), top["rating"])
    ax.set(title=f"Top {len(top)} Highest-Rated Movies", xlabel="Rating", ylabel="Movie")
    fig.tight_layout()
    fig.savefig(output, dpi=160)
    plt.close(fig)


def save_genre_counts(movies: pd.DataFrame, output: str | Path, limit: int = 12) -> None:
    """Save a chart of most frequently listed genres."""
    output = Path(output)
    output.parent.mkdir(parents=True, exist_ok=True)
    genres = (
        movies["genres"]
        .fillna("")
        .map(_split_genres)
        .explode()
        .dropna()
        .astype(str)
        .str.strip()
    )
    genres = genres[genres != ""].value_counts().head(limit).sort_values()
    fig, ax = plt.subplots(figsize=(8, max(4, 0.4 * len(genres))))
    ax.barh(genres.index, genres.values)
    ax.set(title="Most Common Genres", xlabel="Number of listings", ylabel="Genre")
    fig.tight_layout()
    fig.savefig(output, dpi=160)
    plt.close(fig)


def save_cluster_visualization(movies: pd.DataFrame, output: str | Path, clusters: int = 3) -> None:
    """Cluster movies by rating and genre breadth, then save a scatter plot.

    This compact, interpretable feature set works with the project's title/rating
    dataset and optionally uses the genres column when present.
    """
    from sklearn.cluster import KMeans
    from sklearn.preprocessing import StandardScaler

    output = Path(output)
    output.parent.mkdir(parents=True, exist_ok=True)
    frame = movies.copy()
    frame["rating"] = pd.to_numeric(frame["rating"], errors="coerce")
    frame = frame.dropna(subset=["rating"]).reset_index(drop=True)
    if "genres" in frame.columns:
        frame["genre_breadth"] = frame["genres"].fillna("Unknown").astype(str).apply(
            lambda value: len({_part.strip() for _part in _split_genres(value)})
        )
    else:
        frame["genre_breadth"] = 1

    fig, ax = plt.subplots(figsize=(8, 5))
    if len(frame) < 2:
        ax.text(0.5, 0.5, "At least two rated movies are needed for clustering",
                ha="center", va="center", transform=ax.transAxes)
        ax.set_axis_off()
    else:
        features = frame[["rating", "genre_breadth"]].astype(float)
        scaled = StandardScaler().fit_transform(features)
        k = min(max(2, clusters), len(frame))
        labels = KMeans(n_clusters=k, random_state=42, n_init=10).fit_predict(scaled)
        for label in sorted(set(labels)):
            group = frame.loc[labels == label]
            ax.scatter(group["rating"], group["genre_breadth"], s=65, alpha=0.85, label=f"Cluster {label + 1}")
        ax.set(title="Movie Preference Clusters (K-Means)", xlabel="Movie rating", ylabel="Number of genres")
        ax.legend(frameon=False)
        ax.grid(alpha=0.2)
    fig.tight_layout()
    fig.savefig(output, dpi=160)
    plt.close(fig)
