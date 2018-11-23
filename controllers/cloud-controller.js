var express = require('express');
var app = express();

var nunjucks = require('nunjucks');
nunjucks.configure('views', {
    autoescape: true,
    express: app
});

app.get('*', function (req, res) {
    res.render('cloud/index.html');
})

module.exports = app