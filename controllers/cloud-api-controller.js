var express = require('express');

var app = express();

const fs = require('fs');
const FILES_PATH = "C:/Users/X181539/Desktop";

var nunjucks = require('nunjucks');
nunjucks.configure('views', {
    autoescape: true,
    express: app
});

app.get('/', function (req, res) {
    res.render('cloud/api/index.html', {
        apis: ['browse', 'downloadfile', 'uploadfile', 'renamefile', 'filecontent', 'savetextfile', 'extractzip', 'zip', 'delete', 'newfile', 'newdir']
    });
})

app.post('/browse', function (req, res) {
    let requested_path = (typeof req.query.path === 'undefined') ? '/' : req.query.path.replace(/\.\./g, '').replace(/[\/]+/g, '/');

    fs.readdir(FILES_PATH + requested_path, (err, files) => {
        res.json(
            files.map((file) => {
                let file_stats = fs.statSync(FILES_PATH + requested_path + '/' + file);
                return { name: file, url: requested_path + file, mtime: file_stats.mtime, size: file_stats.size, type: file_stats.isDirectory() ? 'dir' : 'file' };
            })
        );
    });
})

app.post('/download', requireAuthentication, function (req, res) {
    let requested_file = (typeof req.query.fileurl === 'undefined') ? '/' : req.query.fileurl.replace(/\.\./g, '').replace(/[\/]+/g, '/');

    res.download(FILES_PATH + requested_file);
});

app.get('/upload', function (req, res) {
})

app.get('/delete', requireAdminAuthentication, function (req, res) {
    res.status(200).send('OK : Authenticated as admin !');
});

app.get('/:endpoint', function (req, res) {
    res.render('cloud/api/index.html', { apis: [req.params.endpoint] });
})

// route middleware to make sure a user is logged in
function requireAuthentication(req, res, next) {

    if (req.isAuthenticated())
        return next();

    // if they aren't return 403
    res.status(403).json({ "status": "error", "msg": "Access denied", "detail": "You must login to perform this action." });
}

// route middleware to make sure a user is logged in as admin
function requireAdminAuthentication(req, res, next) {
    if (!req.isAuthenticated())
        return requireAuthentication(req, res, next);

    if (typeof req.user.role !== "undefined" && req.user.role.includes('ROLE_CLOUD_ADMIN'))
        return next();

    // if they aren't return 403
    res.status(403).json({ "status": "error", "msg": "Access denied", "detail": "You don't have required rights to perform this action." });
}

module.exports = app