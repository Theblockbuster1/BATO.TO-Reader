# BATO.TO-Reader

A web reader for reading manga from [BATO.TO](https://bato.to).

Supports basic devices such as Kindle web browsers and old browsers as it works without JavaScript support.

![GIF Preview (may take a few seconds to load...)](preview.gif)

## Installation

0. Install Node.js.
1. Clone or download the repository.
2. Run `npm i` in the directory with all of the files.

## Usage

1. Run `node .` in the directory to start the script.
2. Visit `http://localhost:5190/chapter/{chapter}` in a web browser, replacing `{chapter}` with the chapter ID from `https://bato.to/chapter/{chapter}`.  
e.g. `https://bato.to/chapter/263974` becomes `http://localhost:5190/chapter/263974`

## Note
* There is also support for [v2.mangapark.net](https://v2.mangapark.net) (`https://v2.mangapark.net/manga/{chapter}`)  
e.g. `https://v2.mangapark.net/manga/phantom-blood/i1364094` becomes `http://localhost:5190/chapter/park/phantom-blood/i1364094`
* You can split up chapters into shorter numbers of pages, to make it easier to bookmark longer chapters, with "Split pages" (append `?p=1` to the URL if you can't access the UI)
* The Chapter Select can be used as an alternative to the Chapter selection menu which may not be supported by some browsers (e.g. Kindle).
* This uses `cloudscraper` to bypass the Cloudflare security system to get the data.
* This program uses a lot of hardcoded regex stuff so if a manga reader redesigns or changes their website, this script may stop working (although quite unlikely).
