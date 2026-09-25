ETERNAL SMP WEBSITE

Pages:
- index.html — Eternal SMP home, team, God Armour, features, ranks
- client.html — Eternal Client product/download page

Artwork:
- hero.webp — generated Eternal SMP hero artwork
- team.webp — generated Admins & Builders artwork
- god-armour.webp — generated God Armour artwork
- celestial.webp / pycraft.webp / dragon.webp / aljenral.webp — generated team emblems
- client-showcase.webp — generated Eternal Client product artwork
- studio-preview.webp — rendered launcher UI with a demo profile and simulated Electron bridge

UI:
- Bootstrap 5.3.3
- Bootstrap Icons 1.11.3
- styles.css — base theme and compact desktop density
- refresh.css — shared visual refresh, responsive client sections and focus styles
- app.js — reveal, navigation, lightbox, release downloads and loadout previews
- combat-presets.json — copy of ../shared/combat-presets.json; keep these identical

Local preview: serve this directory with an HTTP server, then open index.html.
Checks: node --test tests/website.test.mjs (from the repository root).
Client downloads fall back to v1.1.1 if GitHub is unavailable or a release is incomplete.
