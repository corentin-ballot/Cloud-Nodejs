var express = require('express');
var app = express();

var sqlite3 = require('sqlite3');
var crypto = require('crypto');
var db = new sqlite3.Database('./config/sqlite.db');

var nunjucks = require('nunjucks');
nunjucks.configure('views', {
    autoescape: true,
    express: app
});

app.get('/', function (req, res) {
    res.render('security/profile.html', {
        user: req.user // get the user out of session and pass to template
    });
});

app.post('/update-email', function (req, res) {
    db.get('SELECT * FROM users WHERE id = ?', req.user.id, function (err, row) {
        if (row.password === hashPassword(req.body.password, row.salt)) {
            db.get('UPDATE users SET email = ? WHERE id = ?', req.body.email, req.user.id, function (err, row) {
                // redirect user
                res.redirect('.');
            });
        } else {
            res.status(403).send("Wrong password.");
        }
    });
});

app.post('/update-password', function (req, res) {
    db.get('SELECT * FROM users WHERE id = ?', req.user.id, function (err, row) {
        if (row.password === hashPassword(req.body.password, row.salt)) {
            db.get('UPDATE users SET password = ? WHERE id = ?', hashPassword(req.body['new-password'], row.salt), req.user.id, function (err, row) {
                // redirect user
                res.redirect('.');
            });
        } else {
            res.status(403).send("Wrong password.");
        }
    });
});

function hashPassword(password, salt) {
    var hash = crypto.createHash('sha256');
    hash.update(password);
    hash.update(salt);
    return hash.digest('hex');
}

module.exports = app