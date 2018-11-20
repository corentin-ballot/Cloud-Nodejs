var express = require('express');
var mime = require('mime-types');

const fileUpload = require('express-fileupload');
var app = express();
app.use(fileUpload());

const fs = require('fs');
const FILES_PATH = "C:/Users/X181539/Desktop";
const PUBLIC_FILES_PATH = "/cloudlink";

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

app.post('/upload', requireAuthentication, function (req, res) {
    if (typeof req.files === "undefined" || Object.keys(req.files).length == 0) {
        return res.status(400).json({
            status: "error",
            msg: "No files were uploaded",
            detail: "The request was send whthout files."
        });
    }

    let requested_path = (typeof req.body.path === 'undefined') ? '/' : req.body.path.replace(/\.\./g, '').replace(/[\/]+/g, '/');

    if (Array.isArray(req.files.files)) {
        // Multiple upload
        req.files.files.map((file) => {
            file.mv(FILES_PATH + requested_path + "/" + file.name, function (err) {
                if (err) {
                    res.status(500).json({
                        status: "error",
                        msg: "Fail to upload file",
                        detail: "An error occured while uploading <code>" + req.files.files.map((e) => e.name) + "</code> in <code>" + requested_path + "</code>."
                    });
                }
            });
        }).then(() => {
            res.json({
                status: "success",
                msg: "Files successfully uploaded",
                detail: "Files <code>" + req.files.files.map((e) => e.name) + "</code> were successfully uploaded in <code>" + requested_path + "</code>."
            });
        });
    } else {
        // Single upload
        req.files.files.mv(FILES_PATH + requested_path + "/" + req.files.files.name, function (err) {
            if (err)
                return res.status(500).json({
                    status: "error",
                    msg: "Fail to upload file",
                    detail: "An error occured while uploading <code>" + req.files.files.name + "</code> in <code>" + requested_path + "</code>."
                });

            res.json({
                status: "success",
                msg: "File successfully uploaded",
                detail: "The file <code>" + req.files.files.name + "</code> was successfully uploaded in <code>" + requested_path + "</code>."
            });
        });
    }
});

app.post('/rename', requireAuthentication, function (req, res) {
    let fileurl = req.query.fileurl.replace(/\.\./g, '').replace(/[\/]+/g, '/');
    let newurl = req.query.newurl.replace(/\.\./g, '').replace(/[\/]+/g, '/');

    fs.rename(FILES_PATH + '/' + fileurl, FILES_PATH + '/' + newurl, function (err) {
        if (err) {
            res.status(500).json({
                "status": "error",
                "msg": "Fail to rename file",
                "detail": "An error occured while trying to rename <code>" + fileurl + "</code> into <code>" + newurl + "</code>."
            });
        } else {
            res.status(200).json({
                "status": "success",
                "msg": "File successfully renamed",
                "detail": "<code>" + fileurl + "</code> was successfully renamed as <code>" + newurl + "</code>."
            });
        }
    });
});

app.post('/preview', requireAuthentication, function (req, res) {
    let fileurl = req.query.fileurl.replace(/\.\./g, '').replace(/[\/]+/g, '/');
    let file_mime = mime.lookup(FILES_PATH + '/' + fileurl);

    switch (file_mime) {
        case 'application/pdf':
            fs.readFile(FILES_PATH + '/' + fileurl, { encoding: 'utf-8' }, function (err, data) {
                res.status(200).json({
                    "status": "success",
                    "type": "pdf",
                    "url": PUBLIC_FILES_PATH + fileurl
                });
            });
            break;

        case 'text/plain': case 'inode/x-empty': case 'text/x-c':
            fs.readFile(FILES_PATH + '/' + fileurl, { encoding: 'utf-8' }, function (err, data) {
                res.status(200).json({
                    "status": "success",
                    "type": "text",
                    "content": data
                });
            });
            break;

        case 'text/markdown':
            fs.readFile(FILES_PATH + '/' + fileurl, { encoding: 'utf-8' }, function (err, data) {
                res.status(200).json({
                    "status": "success",
                    "type": "markdown",
                    "content": data
                });
            });
            break;

        case 'text/html':
            fs.readFile(FILES_PATH + '/' + fileurl, { encoding: 'utf-8' }, function (err, data) {
                res.status(200).json({
                    "status": "success",
                    "type": "html",
                    "content": data
                });
            });
            break;

        default: res.status(500).json({
            "status": "error",
            "msg": "Fail to render file",
            "detail": "An error occured while trying to render <code>" + fileurl + "</code>. Mime <code>" + file_mime + "</code> not implemented."
        });
    }
});

app.post('/delete', requireAdminAuthentication, function (req, res) {
    let files = JSON.parse(req.query.files).map((e) => e.replace(/\.\./g, '').replace(/[\/]+/g, '/'));

    files.map((path, index, array) => {
        fs.lstat(FILES_PATH + '/' + path, (err, stats) => {
            if (err) {
                console.log(err);
                return res.json({
                    status: "error",
                    msg: "Fail to delete files",
                    detail: "An error occured while deleting some files."
                });
            } else if (stats.isFile()) {
                fs.unlinkSync(FILES_PATH + '/' + path);
            } else {
                deleteFolderRecursive(FILES_PATH + '/' + path);
            }
            console.log(index, array.length);
            if (index >= array.length - 1) {
                return res.json({
                    status: "success",
                    msg: "Files successfully deleted",
                    detail: "Files <code>" + files + "</code> were successfully deleted."
                });
            }
        });
    });

    var deleteFolderRecursive = function (path) {
        if (fs.existsSync(path)) {
            fs.readdirSync(path).forEach(function (file, index) {
                var curPath = path + "/" + file;
                if (fs.lstatSync(curPath).isDirectory()) { // recurse
                    deleteFolderRecursive(curPath);
                } else { // delete file
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(path);
        }
    };
});

app.post('/newfile', function (req, res) {
    let name = req.query.name.replace(/\.\./g, '').replace(/[\/]+/g, '/');
    let path = req.query.path.replace(/\.\./g, '').replace(/[\/]+/g, '/');

    fs.open(FILES_PATH + '/' + path + '/' + name, 'ax', (err) => {
        if (err) {
            res.status(500).json({
                "status": "error",
                "msg": "Fail to create file",
                "detail": "An error occured while trying to create <code>" + name + "</code> into <code>" + path + "</code>."
            });
        } else {
            res.status(200).json({
                "status": "success",
                "msg": "File successfully created",
                "detail": "<code>" + name + "</code> was successfully created in <code>" + path + "</code>."
            });
        }
    });
});

app.post('/newfolder', function (req, res) {
    let name = req.query.name.replace(/\.\./g, '').replace(/[\/]+/g, '/');
    let path = req.query.path.replace(/\.\./g, '').replace(/[\/]+/g, '/');

    fs.mkdir(FILES_PATH + '/' + path + '/' + name, { recursive: true }, (err) => {
        if (err) {
            res.status(500).json({
                "status": "error",
                "msg": "Fail to create folder",
                "detail": "An error occured while trying to create <code>" + name + "</code> into <code>" + path + "</code>."
            });
        } else {
            res.status(200).json({
                "status": "success",
                "msg": "Folder successfully created",
                "detail": "<code>" + name + "</code> was successfully created in <code>" + path + "</code>."
            });
        }
    });
});

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