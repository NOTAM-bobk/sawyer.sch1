Drop the logo images for each social link in this folder using these exact
filenames (App.jsx already points at these paths):

- instagram.svg
- strava.svg
- brawlstars.svg
- athleticnet.svg
- gmail.svg

SVG is preferred (crisp at any size), but PNG works too — if you use PNG,
update the `icon` path for that link in the `PROFILE.links` array at the top
of `src/App.jsx` to match (e.g. `/logos/instagram.png`).

Until a file is uploaded, that link just shows its bracket code (e.g. [IG])
instead of breaking — the fallback lives in the `LinkIcon` component.

This file itself does nothing and can be deleted once your logos are in.
