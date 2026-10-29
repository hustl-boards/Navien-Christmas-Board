# DGI Christmas Board

A static holiday slideshow for the David Gooding, Inc. office TV in Brockton, Massachusetts.

Open the GitHub Pages URL full screen on the TV browser. There is no build step. `index.html`, `styles.css`, `app.js`, and `assets/` are the whole site.

The picture is a 1920×1080 stage that scales to the screen. Slides change about every 15 seconds with a slow crossfade. Photos drift with a light Ken Burns move, and a few snowflakes fall over the picture. A countdown in the top-right corner counts days, hours, minutes, and seconds to midnight at the start of December 25 in America/New_York, no matter what timezone the TV is set to. On December 25 it reads “Merry Christmas from DGI!” After that day it counts toward the next Christmas.

The page keeps a single timer, reuses the same snowflakes, skips a slide whose photo fails to load, and reloads itself about every 6 hours when the TV is online so a browser can leave it up. Photos, type, and snow are a fixed set of elements. Nothing on the page requests the network after it loads. Photo sources are listed in `CREDITS.md`.

## Slides

1. Merry Christmas from David Gooding Inc., over a decorated tree and fireplace, with the DGI logo.
2. Thank you to our partners — line-card logos on white badges, over a snowy Boston Christmas street.
3. Keeping New England warm this season. A warm window in the snow. No product claims.
4. We Care. A holiday thank-you to customers.
5. Brockton contact: 173 Spark Street, 508-894-2000, goodingd.com. Weekdays, 7 AM to 5 PM. Closed Saturday and Sunday.

The board does not mention pricing, same-day service, or around-the-clock coverage.

Arrow keys move between slides. `?sceneMs=` changes how long each slide stays (milliseconds). `?reload=` is the number of hours between reloads (`0` turns that off). `?scene=` opens on that slide, and `?hold=1` keeps it there.

Outfit is used under the SIL Open Font License. See `assets/fonts/OFL.txt`.
