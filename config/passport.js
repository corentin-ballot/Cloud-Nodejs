// load all the things we need
var LocalStrategy = require('passport-local').Strategy;

var crypto = require('crypto');
var sqlite3 = require('sqlite3');

var db = new sqlite3.Database('./config/sqlite.db');

const DEFAULT_ROLES = "USER";
const DEFAULT_ENABLE = 0; // 1: true, 0: false

// expose this function to our app using module.exports
module.exports = function (passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function (id, done) {
        db.get('SELECT * FROM users WHERE id = ?', id, function (err, row) {
            if (!row) return done(null, false);
            return done(null, row);
        });
    });

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-login', new LocalStrategy({
        usernameField: 'username',
        passwordField: 'password',
        passReqToCallback: true // allows us to pass back the entire request to the callback
    },
        function (req, username, password, done) { // callback with email and password from our form
            if (req.body.register === 'true') register(req, username, password, done);
            else login(req, username, password, done);
        }
    ));

    function register(req, username, password, done) {
        db.get('SELECT * FROM users WHERE username = ?', username, function (err, row) {
            if (row) return done(null, false, req.flash('signupMessage', 'That username is already taken.'));
            var salt = Date.now().toString();
            var hash = hashPassword(password, salt);
            db.run('INSERT INTO users (username, password, email, salt, roles, enable) VALUES (?, ?, ?, ?, ?, ?)', username, hash, req.body.email, salt, DEFAULT_ROLES, DEFAULT_ENABLE, function (err, row) {
                if (err) return done(null, false, err.message);
                return done(null, row);
            });
        });
    }

    function login(req, username, password, done) { // callback with email and password from our form
        db.get('SELECT salt, enable FROM users WHERE username = ?', username, function (err, row) {
            if (!row) return done(null, false, req.flash('loginMessage', 'User not found.'));
            var hash = hashPassword(password, row.salt);
            db.get('SELECT username, id FROM users WHERE username = ? AND password = ?', username, hash, function (err, row) {
                if (!row) return done(null, false, 'Wrong password.');
                else if (row.enable < 1) return done(null, false, req.flash('loginMessage', 'Your account is not enable yet or have been disabled.'));
                else return done(null, row);
            });
        });
    }

    function hashPassword(password, salt) {
        var hash = crypto.createHash('sha256');
        hash.update(password);
        hash.update(salt);
        return hash.digest('hex');
    }

};