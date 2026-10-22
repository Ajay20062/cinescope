"""Basic tests for movie data loading."""
import tempfile
import unittest
from pathlib import Path
import pandas as pd

from src.data_processing import load_movies


class LoadMoviesTests(unittest.TestCase):
    def test_loads_and_cleans_valid_data(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "movies.csv"
            pd.DataFrame({
                "title": [" The Matrix ", "Spirited Away", None],
                "rating": ["8.7", "8.6", "bad"],
                "genres": ["Action|Sci-Fi", "Animation|Fantasy", "Drama"],
            }).to_csv(path, index=False)

            result = load_movies(path)
            self.assertEqual(len(result), 2)
            self.assertEqual(result.loc[0, "title"], "The Matrix")
            self.assertAlmostEqual(result.loc[0, "rating"], 8.7)

    def test_rejects_missing_required_columns(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "movies.csv"
            pd.DataFrame({"name": ["The Matrix"]}).to_csv(path, index=False)
            with self.assertRaises(ValueError):
                load_movies(path)


if __name__ == "__main__":
    unittest.main()
