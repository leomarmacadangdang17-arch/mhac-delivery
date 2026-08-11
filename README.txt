# MHAC Delivery - Fixed GitHub Pages Upload

This ZIP is intentionally standalone and does not depend on a build tool.

## Upload
Upload these three files to the root of the GitHub Pages repository:
- index.html
- app.js
- style.css

The important fix is that `index.html` directly loads `app.js`, and the app is wrapped so a JavaScript failure is less likely to leave the page completely empty.

GitHub Pages should publish from the repository root (or the selected Pages branch/folder).

GPS works only when the browser grants location permission. Exact address-to-coordinate geocoding is not faked; when exact distance cannot be determined, the checkout shows Admin approval instead of a bogus distance.
