# Velmora

A demo fashion website that Trizen Technologies uses to pitch clothing brands. Velmora is a fictional brand.

## Run it

```
npm install
npm run dev       # work on the site at http://localhost:5173
npm run build     # create the finished site in dist/
npm run preview   # view the finished site
```

## Where things live

| Path | What it holds |
| --- | --- |
| `index.html` | The Home page content |
| `src/styles/main.css` | Colours, fonts and layout, with the colours and fonts at the top |
| `src/home/` | The animation for each Home section |
| `src/ui/` | The menu, search, bag and pointer label |
| `src/data/products.js` | Product names and prices |
| `media/home/` | Source photos and videos, kept as they came from Google Flow |
| `public/media/` | Web-ready media, generated from `media/home/` |

## Changing media

Replace a file in `media/home/photo` or `media/home/vedio-clean`, then run `npm run media`. This needs ffmpeg and Python with Pillow and numpy. It rebuilds everything in `public/media`, so never edit that folder by hand.

## Re-skinning for a client

The colours and fonts are set in one block at the top of `src/styles/main.css`. To make the site look like a client's brand, change those values, the name in `index.html`, the product list, and the media.
