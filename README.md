# Navien Christmas Board

A static holiday slideshow for an office TV. It is a gift from Ross Hunt at 3R Plumbing & Mechanical for David Gooding, Inc. in Brockton, Massachusetts, the manufacturers' representative that carries Navien on its New England line card.

Open the GitHub Pages URL full screen on the TV browser. There is no build step. `index.html`, `styles.css`, `app.js`, and `assets/` are the whole site.

The picture is a 1920×1080 stage that scales to the screen. Scenes change about every 14 seconds. A countdown in the top-right corner counts days, hours, minutes, and seconds to midnight at the start of December 25 in America/New_York, no matter what timezone the TV is set to. On December 25 it reads “Merry Christmas from DGI!” After that day it counts toward the next Christmas.

The page keeps a single timer, reuses the same snowflakes, and reloads itself every few hours so a TV browser can leave it up.

## Scenes

1. Merry Christmas from David Gooding Inc., with the DGI and Navien logos
2. Navien-blue winter wonderland
3. Santa's warm because he went tankless
4. Navien Tankless
5. Navien Combi
6. Navien Water Heaters
7. Navien Condensing Hydronic Furnace
8. Twelve days of Christmas lights
9. We Care. — a thank-you to customers
10. Brockton contact: 508-894-2000 and goodingd.com

Arrow keys move between scenes. `?sceneMs=` changes how long each scene stays (milliseconds). `?reload=` is the number of hours between reloads (`0` turns that off).

Outfit is used under the SIL Open Font License. See `assets/fonts/OFL.txt`. Logos are David Gooding, Inc. and Navien marks used for this office display.
