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

app.get('/users', function (req, res) {
    db.all('SELECT * FROM users', function (err, rows) {
        res.render('security/admin/users.html', { users: rows });
    });
});

app.get('/user/:id', function (req, res) {
    db.get('SELECT * FROM users WHERE id = ?', req.params.id, function (err, row) {
        res.render('security/admin/user.html', { userinfo: row });
    });
});

app.post('/user/:id/update-username', function (req, res) {
    db.get('UPDATE users SET username = ? WHERE id = ?', req.body.username, req.params.id, function (err, row) {
        // redirect user
        res.redirect('.');
    });
});

app.post('/user/:id/update-email', function (req, res) {
    db.get('UPDATE users SET email = ? WHERE id = ?', req.body.email, req.params.id, function (err, row) {
        // redirect user
        res.redirect('.');
    });
});

app.post('/user/:id/update-roles', function (req, res) {
    db.get('UPDATE users SET roles = ? WHERE id = ?', req.body.roles, req.params.id, function (err, row) {
        // redirect user
        res.redirect('.');
    });
});

app.post('/user/:id/update-enable', function (req, res) {
    db.get('UPDATE users SET enable = ? WHERE id = ?', req.body.enable ? 1 : 0, req.params.id, function (err, row) {
        // redirect user
        res.redirect('.');
    });
});

app.post('/user/:id/delete-user', function (req, res) {
    db.run('DELETE FROM users WHERE id = ?', req.params.id, function (err, row) {
        // redirect users
        res.redirect('../../users');
    });
});

module.exports = app