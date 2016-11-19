var express = require('express'),
  Promise = require("bluebird"),
  request = Promise.promisify(require('request'), {multiArgs: true}),
  fs = require('fs'),
  pdf = require('html-pdf'),
  cheerio = require('cheerio');

var app = express();
var defaultRequest = request.defaults({ headers: {'User-Agent': 'Mozilla/5.0'} });

// Given a body of a full chapter page, return the important content
function makeChapterHTML(body, firstChapter) {
  let $ = cheerio.load(body);

  // Construct a new dom element
  var chapterHTML = $('<div>')
    .append(
      // Add the chapter contents
      $('.chapter-content')
      .clone()
      .addClass('page')
      // Add chapter name & book name
      .prepend($.html('div.page-container div div div h2')) // Chapter Name
  );

  if (firstChapter) {
    chapterHTML
      .prepend($.html('div.page-container div div div h1')) // Title & Author
      .prepend(`<link rel='stylesheet' href="file://${__dirname}/rrl-styling.css"/>`)
  }

  return chapterHTML.html();
}

// Given a fiction, compile all chapters into one pdf
app.get('/fiction/:fictionId', (req,res) => {
  var url = 'http://royalroadl.com/fiction/' + req.params.fictionId;
  defaultRequest(url)
    .spread( (response, body) => {
      let $ = cheerio.load(body);
      var title = $("div.fic-header h2").first().text();

      // Get all the chapter urls in order.
      var chapterURLs = $('table#chapters tbody').find('tr').map((i,tr) => {
        var url = $(tr).data('url');
        return `http://royalroadl.com${url}`;
      });

      // Get all the chapterHTML in the appropriate order
      var chapterHTML = [];
      for (var i = 0; i < chapterURLs.length; i++) {
        // Get all chapter contents asyncronously
        chapterHTML[i] = defaultRequest(chapterURLs[i])
          .spread( (response, body) => {
            var firstChapter = chapterURLs[0].localeCompare(response.request.href) === 0;
            return makeChapterHTML(body, firstChapter);
          })
          .catch( (err) => {
            console.log(err);
          });
      }

      // Reduce all the promises and make the pdf
      Promise.map(chapterHTML, (item) => {
          return item; // shorter than constructor
      }).reduce((prev, cur) => {
          return prev.concat(cur);
      }).then( (allHTML) => {
        var filename = title;

        // Make the html page
        fs.writeFile(`./tmp/${filename}.html`, allHTML, function(err) {
            if(err) return console.log(err);
            console.log(`The file (${filename}) was saved!`);
        });

        // Make the pdf
        pdf.create(allHTML).toFile(`./tmp/${filename}.pdf`, function(err, fileres) {
          if (err) return console.log(err);
          console.log(fileres);

          var file = fs.createReadStream(fileres.filename);
          var stat = fs.statSync(fileres.filename);
          res.setHeader('Content-Length', stat.size);
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename=${filename}.pdf`);
          file.pipe(res);
        });
    });
  })
  .catch( (err) => {
    console.log(err);
  });
});

// Given a chapter, return a pdf
app.get('/fiction/chapter/:chapterId', (req, res) => {
  var url = 'http://royalroadl.com/fiction/chapter/' + req.params.chapterId;
  defaultRequest(url)
    .spread((response, body) => {
      if (response.statusCode == 200) {
        let $ = cheerio.load(body);

        var title = $('div.page-container div div div h1').first().text();
        var chapter = $('div.page-container div div div h2').first().text();
        var chapterHTML = makeChapterHTML(body, true);

        var filename = `${title} - ${chapter}`;
        // Make the html page
        fs.writeFile(`./tmp/${filename}.html`, chapterHTML, function(err) {
            if(err) return console.log(err);
            console.log(`The file (${filename}) was saved!`);
        });

        // Make the pdf
        pdf.create(chapterHTML).toFile(`./tmp/${filename}.pdf`, function(err, fileres) {
          if (err) return console.log(err);
          console.log(fileres);

          var file = fs.createReadStream(fileres.filename);
          var stat = fs.statSync(fileres.filename);
          res.setHeader('Content-Length', stat.size);
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename=${filename}.pdf`);
          file.pipe(res);
        });
      }
    })
    .catch( (err) => {
      console.log(err);
    });

});

app.listen('8081');
console.log('listening on port 8081');
exports = module.exports = app;
