# RoyalRoadL-Scraper
Stand up a lightweight server to serve pdf renderings of chapters / novels from royalroadl.com.
>NOTE: this is just a basic screen-scraper. If there are significant changes to RRL's DOM then this will break. Should be pretty simple to fix though.

There are a lot of niceties that could be implemented. Additional query parameters for formatting, splitting up the pdfs into multiple files, caching, etc. However this is more or less just a quick, dirty, and lightweight way to save some novels offline.

> NOTE: I'm currently in the process of making a CLI version of this.

## Installation
```
git clone https://github.com/dmk255/RoyalRoadL-Scraper.git
cd RoyalRoadL-Scraper && npm install
npm start
```
This will start the server on port 8081.

## Usage
There are two exposed endpoints. Both id's can be found in RRL's url.

- `/fiction/<:fictionID>` - Returns a compiled PDF of all chapters for the given fiction.
  - `http://royalroadl.com/fiction/9179` - 9179 is the *fictionID*
- `/fiction/chapter/<:chapterID>` - Returns a PDF of a single chapter.
  - `http://royalroadl.com/fiction/chapter/75087` - 75087 is the *chapterID*

## Development
Feel free to make improvements! As a note you can run `npm run dev` to start this with a demon (the server will restart on every file change)
