# BATO.TO-Reader

A web reader for reading manga from [BATO.TO](https://bato.to).

Supports basic devices such as Kindle web browsers and old browsers as it works without JavaScript support.

## Installation

0. Install Node.js.
1. Clone or download the repository.
2. Run `npm i` in the directory with all of the files.

## Usage

1. Run `node .` in the directory to start the script.
2. Visit `http://localhost:5190/chapter/{chapter}` in a web browser, replacing `{chapter}` with the chapter ID from `https://bato.to/chapter/{chapter}`.  
e.g. `https://bato.to/chapter/263974` becomes `http://localhost:5190/chapter/263974`

## Note
* The Chapter Select can be used as an alternative to the Chapter selection menu which may not be supported by some browsers (e.g. Kindle).
* This uses `cloudscraper` to bypass the Cloudflare security system to get the data.
* This program uses a lot of hardcoded regex stuff so if BATO.TO redesign or change their website, this script may stop working (although quite unlikely).
