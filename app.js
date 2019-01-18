var express = require('express');
var app = express();

var nunjucks = require('nunjucks');

nunjucks.configure('views', {
    autoescape: true,
    express: app
});

app.use(express.static('public'));
app.use('/', shareUserData, require('./controllers/security-controller'));
app.use('/cloud', shareUserData, require('./controllers/cloud-controller'));
app.use('/api/cloud', shareUserData, require('./controllers/cloud-api-controller'));
app.use('/api/doc/cloud', shareUserData, require('./controllers/cloud-api-doc-controller'));


app.get('/', shareUserData, function (req, res) {
    res.render('index.html');
});

function shareUserData(req, res, next) {
    res.locals.user = req.user;
    next();
}

app.listen(3000, () => console.log("http://localhost:3000"));