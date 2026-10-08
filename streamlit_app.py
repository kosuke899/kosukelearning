from pathlib import Path

import streamlit as st
import streamlit.components.v1 as components

st.set_page_config(page_title="learn.", layout="wide")

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

components.html(html, height=900, scrolling=True)