# Eternal Client Website

Official static marketing site for Eternal Client.

The site is dependency-free and deploys directly through GitHub Pages. Release/download metadata is loaded from the public GitHub Releases API with a v1.1.0 fallback so the primary download path remains usable if the API is temporarily unavailable.

Local preview:

```powershell
cd website
python -m http.server 8080
```

Then open `http://localhost:8080`.
