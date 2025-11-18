# Survey Dashboard

## How to Run Locally
1. Unzip the package.
2. Open a terminal and navigate to the folder.
3. Run:
   ```bash
   python -m http.server 8000
   ```
4. Open your browser and go to:
   ```
   http://localhost:8000/index.html
   ```

## How to Host Online
- Upload these files to GitHub Pages, Netlify, or any web server.
- Ensure your Google Sheet is shared as **Anyone with link → Viewer**.

## Features
- Dynamic aggregation from Google Sheets JSON.
- Fallback sample data if live fetch fails.
- Interactive filters for question categories.
- Expandable charts using Chart.js.
