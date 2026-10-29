# DGI Christmas Board

A static holiday slideshow for an office TV. It is a gift from Ross Hunt at 3R Plumbing & Mechanical for David Gooding, Inc. in Brockton, Massachusetts.

Open the GitHub Pages URL full screen on the TV browser. There is no build step. `index.html`, `styles.css`, `app.js`, and `assets/` are the whole site.

The picture is a 1920×1080 stage that scales to the screen. Scenes change about every 14 seconds. A countdown in the top-right corner counts days, hours, minutes, and seconds to midnight at the start of December 25 in America/New_York, no matter what timezone the TV is set to. On December 25 it reads “Merry Christmas from DGI!” After that day it counts toward the next Christmas.

The page keeps a single timer, reuses the same snowflakes, and reloads itself every few hours so a TV browser can leave it up. Scene motion is CSS on a fixed set of elements, and it pauses when a scene is hidden.

## Scenes

1. Merry Christmas from David Gooding Inc.
2. Christmas tree with line-card logos as ornaments
3. Santa, sleigh, and reindeer, with logos on the gift sack
4. Wrapped presents with partner logos
5. Stockings by the fire
6. Thanks to our partners — the New England line card
7. Navien, one scene
8. We Care. — a thank-you to customers
9. Brockton contact: 508-894-2000 and goodingd.com

Partner marks are the line-card logos, each on a white badge. The board does not mention pricing or after-hours coverage. Customer service on the contact scene is weekdays, 7 AM to 5 PM, closed Saturday and Sunday.

Arrow keys move between scenes. `?sceneMs=` changes how long each scene stays (milliseconds). `?reload=` is the number of hours between reloads (`0` turns that off). `?scene=` opens on that scene, and `?hold=1` keeps it there.

Outfit is used under the SIL Open Font License. See `assets/fonts/OFL.txt`. Logos are the David Gooding, Inc. mark and the manufacturers' line-card marks used for this office display.
