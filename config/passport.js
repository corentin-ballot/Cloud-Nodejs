// load all the things we need
var LocalStrategy = require('passport-local').Strategy;

var crypto = require('crypto');
var sqlite3 = require('sqlite3');

var db = new sqlite3.Database('./config/sqlite.db');

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
        db.get('SELECT id, username FROM users WHERE id = ?', id, function (err, row) {
            if (!row) return done(null, false);
            return done(null, row);
        });
    });


    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-signup', new LocalStrategy({
        usernameField: 'username',
        passwordField: 'password',
        passReqToCallback: true // allows us to pass back the entire request to the callback
    },
        function (req, username, password, done) {
            db.get('SELECT * FROM users WHERE username = ?', username, function (err, row) {
                if (row) return done(null, false, req.flash('signupMessage', 'That username is already taken.'));
                var salt = Date.now().toString();
                var hash = hashPassword(password, salt);
                db.run('INSERT INTO users (username, password, salt, enable) VALUES (?, ?, ?, ?)', username, hash, salt, 0, function (err, row) {
                    if (err) return done(null, false, err.message);
                    return done(null, row);
                });
            });
        }
    ));

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
            db.get('SELECT salt FROM users WHERE username = ?', username, function (err, row) {
                if (!row) return done(null, false, req.flash('loginMessage', 'User not found.'));
                var hash = hashPassword(password, row.salt);
                db.get('SELECT username, id FROM users WHERE username = ? AND password = ?', username, hash, function (err, row) {
                    if (!row) return done(null, false, 'Wrong password.');
                    return done(null, row);
                });
            });
        }
    ));

    function hashPassword(password, salt) {
        var hash = crypto.createHash('sha256');
        hash.update(password);
        hash.update(salt);
        return hash.digest('hex');
    }

};