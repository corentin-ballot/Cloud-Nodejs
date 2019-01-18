var express = require('express');

var app = express();

var nunjucks = require('nunjucks');
nunjucks.configure('views', {
    autoescape: true,
    express: app
});

app.get('/', function (req, res) {
    res.render('cloud/api/index.html', {
        section: "introduction",
    });
})

app.get('/:endpoint', function (req, res) {
    res.render('cloud/api/index.html', { section: req.params.endpoint }, function (err, html) {
        if (err) {
            return res.status(404).send('No documentation found for <code>' + req.params.endpoint + "</code>");
        }
        res.send(html);
    });
})

module.exports = app