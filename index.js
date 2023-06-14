require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const BodyParser = require('body-parser');
const DNS = require('dns');

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// TODO: URL Shortener Microservice

// BodyParser configured for POST methods
// Returns midleware that only parses urlencoded bodies.
// Extended option allows to choose between parsing the URL-encoded data with 
// the querystring (when false).
app.use(BodyParser.urlencoded(
  {
    extended: false
  }
));

const URLs = [];    // URL object array
let id = 0;         // ID variable for mapping

// POST route on path '/api/shorturl' to create the shorturl
app.post('/api/shorturl', (req, rsp) => {
  // creates a URL object set to the request's body URL
  const { url: _url } = req.body;

  // if the request url is empty, respond with 'invalud url'
  if (_url === "") {
    res.json({
      "error": "invalid url"
    });
  }

  // create the shortened URL by removing common URL variations
  const shortenedURL = _url.replace(/(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/, '');

  // create a new URL object based on the request URL received
  // if this fails, respond with "invalid url"
  let testURL;
  try {
    testURL = new URL(_url);
  } catch (err) {
    rsp.json({
      "error": "invalid url"
    });
  }

  // resolves the IP address of the shortenedURL
  DNS.lookup(shortenedURL, (err) => {
    // return "invalid url" if an error is returned from the DNS lookup
    if (err) {
      rsp.json({
        "error": "invalid url"
      });
    } else {
      // if the modified URL is resolved, find the URL in the array of URLs
      const urlIdExists = URLs.find(l => l.original_url === _url)

      // if the modified URL is found, return the original and shortened URL
      // if it is not found, add it to the array and return it
      if (urlIdExists) {
        rsp.json({
          "original_url": _url,
          "short_url": id
        });
      } else {
        // for each new URL, increment the id 
        ++id;

        // create object for the new URL
        const urlObj = {
          "original_url": _url,
          "short_url": `${id}`
        };

        // add the new URL to the array of URLs
        URLs.push(urlObj);

        // respond with the new request URL
        rsp.json({
          "original_url": _url,
          "short_url": id
        });
      }
    }
  });
});

// GET route on path '/api/shorturl/:id' to navigate to the URL when clicked
app.get('/api/shorturl/:id', (req, rsp) => {
  // create and id object set to the id in the requested params
  const { id: _id } = req.params;

  // check if the id for the shorturl already exists
  const shorturlLinkExists = URLs.find(sl => sl.short_url === _id);

  // if the id exists, then go to the respective original URL
  // else return invalid url"
  if (shorturlLinkExists) {
    rsp.redirect(shorturlLinkExists.original_url);
  } else {
    rsp.json({
      "error": "invalid url"
    });
  }
});

// Given: Express App listens on the port
app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});