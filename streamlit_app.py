from pathlib import Path

import streamlit as st
import streamlit.components.v1 as components

st.set_page_config(page_title="learn.", layout="wide")

st.markdown(
        """
        <style>
            html, body, .stApp, [data-testid="stAppViewContainer"],
            [data-testid="stMain"] {
                background: #f7f7f3 !important;
            }
            [data-testid="stMain"] { padding: 0 !important; }
            [data-testid="stHeader"], [data-testid="stToolbar"], footer, #MainMenu { display: none; }
            [data-testid="stMainBlockContainer"], [data-testid="stAppViewBlockContainer"],
            section.main > div.block-container {
                width: 100% !important;
                max-width: none !important;
                margin: 0 !important;
                padding: 0 !important;
            }
        </style>
        """,
        unsafe_allow_html=True,
)

project_dir = Path(__file__).parent
html = (project_dir / "index.html").read_text()
css = (project_dir / "styles.css").read_text()
js = (project_dir / "app.js").read_text()

html = html.replace(
    '<link rel="stylesheet" href="./styles.css" />',
    f"<style>{css}</style>",
)
html = html.replace(
    '<script src="./app.js"></script>',
    f"<script>{js}</script>",
)

components.html(html, height=1100, scrolling=False)