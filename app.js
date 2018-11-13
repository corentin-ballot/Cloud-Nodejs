var express = require('express');
var app = express();

var nunjucks = require('nunjucks');

nunjucks.configure('views', {
    autoescape: true,
    express: app
});

app.use(express.static('public'));
app.use('/', require('./controllers/security-controller'));
app.use('/cloud', require('./controllers/cloud-controller'));
app.use('/api/cloud', require('./controllers/cloud-api-controller'));

// share user data with all templates
app.use(function (req, res, next) {
    res.locals.user = req.user;
    next();
});

app.get('/', function (req, res) {
    res.render('index.html');
});

app.listen(3000);