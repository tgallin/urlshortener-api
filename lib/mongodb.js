//lets require/import the mongodb native drivers.
var mongodb = require('mongodb');
var hash = require('./hash.js');

//We need to work with "MongoClient" interface in order to connect to a mongodb server.
var mongoClient = mongodb.MongoClient;

// Connection URL. This is where your mongodb server is running.
// local db :
//var dburl = 'mongodb://' + process.env.IP + ':27017/urlshortener';
// db hosted by mLab
// export MONGOLAB_URI="mongodb://tgallin:tgallin@ds163387.mlab.com:63387/urlshortener"
var dburl = process.env.MONGOLAB_URI;

var URL_COLLECTION = "urls";
var COUNTER_COLLECTION = "counters";
var URL_COUNT = "url_count";

var getShortUrl = function(req, res, callback) {
    var prefix = req.params.prefix;
    var originalUrl = req.params.originalUrl;
    if (prefix) {
        originalUrl = prefix + '//' + originalUrl;
    }
    var urlId = 0;
    mongoClient.connect(dburl, function(err, db) {
        if (err) {
            console.log('Unable to connect to the mongoDB server. Error:', err);
            callback(err, req, res, urlId);
        }
        else {
            console.log('Connection established to', dburl);

            findUrlByUrl(db, originalUrl).toArray(function(err, urls) {
                if (err) {
                    console.log(err);
                    callback(err, req, res, urlId);
                    close(db);
                }
                else if (urls.length > 0) {
                    urlId = +(urls[0]._id);
                    callback(err, req, res, hash.encode(urlId));
                    close(db);
                }
                else {
                    // save new url
                    findUrlCount(db).toArray(function(err, counters) {
                        var urlId = -1;
                        if (err) {
                            console.log(err);
                            callback(err, req, res, urlId);
                        }
                        else if (counters.length > 0) {
                            var urlCount = counters[0];
                            urlId = urlCount.seq + 1;
                            updateUrlCount(urlId);
                        }
                        else {
                            initUrlCount();
                            urlId = 1;
                        }
                        var newurl = {
                            _id: urlId,
                            original_url: originalUrl
                        };
                        var col = db.collection(URL_COLLECTION);
                        col.insert(newurl, function(err, data) {
                            if (err) {
                                console.log(err);
                            }
                            close(db);
                        });
                        callback(null, req, res, hash.encode(urlId));
                    });
                }
            });
        }
    });
};

var getOriginalUrl = function(req, res, callback) {
    var shortUrl = req.params.shortUrl.toString();
    console.log(shortUrl);

    mongoClient.connect(dburl, function(err, db) {
        var originalUrl;
        if (err) {
            console.log('Unable to connect to the mongoDB server. Error:', err);
            callback(err, res, originalUrl);
        }
        else {
            console.log('Connection established to', dburl);
            var urlId = hash.decode(shortUrl);
            console.log('urlId = ', urlId);
            if (urlId > 0) {
                findUrlById(db, urlId).toArray(function(err, results) {

                    if (err) {
                        console.log(err);
                        callback(err, res, originalUrl);
                    }
                    else if (results.length > 0) {
                        originalUrl = results[0].original_url;
                        callback(null, res, originalUrl);
                    }
                    else {
                        callback(null, res, originalUrl);
                    }
                });
            }
            else {
                callback(null, res, originalUrl);
            }
            close(db);
        }
    });
};

var reset = function(req, res) {
    updateUrlCount(0);
    removeAllUrls();
};


module.exports.getShortUrl = getShortUrl;
module.exports.getOriginalUrl = getOriginalUrl;
module.exports.reset = reset;


function close(db) {
    //Close connection
    console.log('closing connection');
    db.close();
}

function findUrlByUrl(db, url) {
    var col = db.collection(URL_COLLECTION);
    return col.find({
        original_url: url
    });
}

function findUrlById(db, id) {
    var col = db.collection(URL_COLLECTION);
    return col.find({
        _id: id
    });
}

function findUrlCount(db) {
    var col = db.collection(COUNTER_COLLECTION);
    return col.find({
        _id: 'url_count'
    });
}

function initUrlCount() {
    mongoClient.connect(dburl, function(err, db) {
        if (err) {
            console.log('Unable to connect to the mongoDB server. Error:', err);
        }
        else {
            console.log('Connection established to', dburl);
            var col = db.collection(COUNTER_COLLECTION);
            var urlCount = {
                _id: URL_COUNT,
                seq: 1
            };
            col.insert(urlCount, function(err, data) {
                if (err) {
                    console.log(err);
                }
                close(db);
            });
        }
    });
}

function updateUrlCount(newCount) {
    mongoClient.connect(dburl, function(err, db) {
        if (err) {
            console.log('Unable to connect to the mongoDB server. Error:', err);
        }
        else {
            console.log('Connection established to', dburl);
            var col = db.collection(COUNTER_COLLECTION);
            col.update({
                _id: URL_COUNT
            }, {
                $set: {
                    seq: newCount
                }
            }, function(err, numUpdated) {
                if (err) {
                    console.log(err);
                }
                else if (numUpdated) {
                    console.log('Successfully updated url_count');
                }
                else {
                    console.log('No url_count found');
                }
                close(db);
            });
        }
    });

}


function removeAllUrls() {
    mongoClient.connect(dburl, function(err, db) {
        if (err) {
            console.log('Unable to connect to the mongoDB server. Error:', err);
        }
        else {
            console.log('Connection established to', dburl);
            var col = db.collection(URL_COLLECTION);
            col.remove();
        }
    });
}
