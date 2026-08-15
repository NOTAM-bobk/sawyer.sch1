Drop your two Mixamo-style animation exports directly in this folder,
renamed exactly like this (no spaces — `AnimalCompanion.jsx` already
points at these paths):

- running.fbx
- low-crawl.fbx   (rename from "low crawl.fbx")

That's it — no conversion needed. The site loads FBX directly in the
browser using three.js's FBXLoader, so there's nothing to run on a
computer.

If a file is missing or fails to load, the animal component just quietly
renders nothing; it won't break the rest of the page.

## A note on file size

FBX exports (especially from Mixamo) can be a few MB each, uncompressed.
That's fine for a personal site, but if load time ever bugs you and you
get access to a computer later, converting to `.glb` (with something like
Blender or an online FBX→GLB converter) and swapping `FBXLoader` for
`GLTFLoader` in `AnimalCompanion.jsx` will shrink it a lot. Not required
to ship this — just an optional future optimization.

This README can be deleted once your two files are in place.
