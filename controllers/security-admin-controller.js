var express = require('express');
var app = express();

var sqlite3 = require('sqlite3');
var db = new sqlite3.Database('./config/sqlite.db');

var nunjucks = require('nunjucks');
nunjucks.configure('views', {
    autoescape: true,
    express: app
});

app.get('/', function (req, res) {
    db.all('SELECT * FROM users', function (err, rows) {
        res.render('security/admin/users.html', { users: rows });
    });
});

app.get('/user/:id', function (req, res) {
    db.get('SELECT * FROM users WHERE id = ?', req.params.id, function (err, row) {
        res.render('security/admin/user.html', { userinfo: row });
    });
});

module.exports = app