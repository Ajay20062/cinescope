# Movie Preference Analysis

A Python data-analysis project for exploring movie ratings, genres, and viewing preferences.

## Project structure

```text
Movie-Preference-Analysis/
├── data/
│   ├── raw/                 # Original datasets (not committed by default)
│   └── processed/           # Cleaned datasets (not committed by default)
├── notebooks/
│   └── movie_analysis.ipynb # Exploratory analysis notebook
├── src/
│   ├── __init__.py
│   ├── data_processing.py
│   ├── analysis.py
│   └── visualization.py
├── outputs/
│   └── figures/             # Generated charts
├── tests/
│   └── test_analysis.py
├── requirements.txt
├── .gitignore
└── LICENSE
```

## Features

- Load and validate a movie ratings dataset.
- Summarize ratings and genre preferences.
- Identify highly rated movies.
- Create charts for rating distributions and popular genres.
- Cluster movies with K-means using rating and genre breadth, and visualize the groups in a scatter plot.
- Export cleaned data and charts.

## Requirements

- Python 3.10 or newer recommended.

## Setup

### 1. Create and activate a virtual environment

Windows PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

macOS/Linux:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 2. Install dependencies

```bash
python -m pip install -r requirements.txt
```

## Expected dataset

Put a CSV file in `data/raw/`. By default, the analysis expects a file with a `title` column and a numeric `rating` column. An optional `genres` column can contain genres separated by `|` or commas.

Example:

```csv
title,rating,genres
The Matrix,8.7,Action|Sci-Fi
Spirited Away,8.6,Animation|Fantasy
Arrival,7.9,Drama|Sci-Fi
```

You can use a different filename with `--input path/to/file.csv`.

## Run the analysis

From the project root:

```bash
python -m src.analysis
```

Or specify a dataset:

```bash
python -m src.analysis --input data/raw/movies.csv
```

Charts and processed data are written to `outputs/figures/` and `data/processed/`. The Python workflow also creates `outputs/figures/movie_clusters.png`. The browser dashboard includes an interactive cluster scatter plot that updates when you import a CSV. Clustering uses rating and the number of listed genres; it is exploratory and does not claim to infer a viewer’s personality.

## Run tests

```bash
python -m unittest discover -s tests -v
```

## Notes

- No dataset is bundled. Add a dataset you have permission to use.
- Do not commit private, licensed, or very large datasets without checking their terms.


## Frontend dashboard

A responsive, dark-themed browser dashboard is included in `frontend/`. It provides summary cards, rating distribution, genre mix, search, sorting, genre filtering, and CSV import. The dashboard runs in the browser and does not require a server.

1. Open `frontend/index.html` in a modern browser.
2. Use **Import CSV** to load your own CSV file. The CSV should contain `title` and `rating` columns, plus an optional `genres` column. Ratings should be between 0 and 10.
3. The dashboard displays the data locally in your browser; it does not upload the CSV.

The frontend starts with illustrative sample data. It is separate from the Python analysis pipeline.
