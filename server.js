var express = require('express');
var db = require('./lib/mongodb.js');

var app = express();

app.set('views', './views');
app.set('view engine', 'pug');

app.use(express.static('public'));

function sendShortUrl(err, req, res, shortUrl) {
    if (err) {
        res.end('there was a problem trying to shorten the url. ' + err);
    }
    else {
        var url = {
            shortened_url: req.get('x-forwarded-proto') + '://' + req.get('host') + '/' + shortUrl
        };
        res.json(url);
    }
}

app.get('/shorten/:prefix//:originalUrl', function(req, res) {
    db.getShortUrl(req, res, sendShortUrl);
});

app.get('/shorten/:originalUrl', function(req, res) {
    db.getShortUrl(req, res, sendShortUrl);
});

app.get('/reset', function(req, res) {
    db.reset();
    res.render('index', {
        title: 'Url shortener microservice',
        message: 'Url shortener microservice'
    });
});

app.get('/:prefix//:shortUrl', function(req, res) {
    db.getOriginalUrl(req, res, redirect);
});

app.get('/:shortUrl', function(req, res) {
    db.getOriginalUrl(req, res, redirect);
});

function redirect(err, res, originalUrl) {
    if (err) {
        res.end('there was a problem trying to find the original url. ' + err);
    }
    else {
        if (originalUrl && originalUrl.length > 0) {
            if (!originalUrl.includes('http')) {
                originalUrl = "http://" + originalUrl;
            }
            res.redirect(originalUrl);
        }
        else {
            res.end('We could not find any url matching the shorten url you provided.');
        }
    }
}

app.get('/', function(req, res) {
    res.render('index', {
        title: 'Url shortener microservice',
        message: 'Url shortener microservice'
    });
});

var port = process.env.PORT || 8080;

app.listen(port, function() {
    console.log('app listening on port ' + port);
});
