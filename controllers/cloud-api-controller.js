var express = require('express');
var mime = require('mime-types');
const StreamZip = require('node-stream-zip');

const fileUpload = require('express-fileupload');
var app = express();
app.use(fileUpload());

const fs = require('fs');
const FILES_PATH = "C:/Users/X181539/Desktop";

app.post('/browse', function (req, res) {
    let requested_path = (typeof req.query.path === 'undefined') ? '/' : req.query.path.replace(/\.\./g, '').replace(/[\/]+/g, '/').concat(req.query.path.substr(req.query.path.length - 1) === '/' ? '' : '/');

    fs.readdir(FILES_PATH + requested_path, (err, files) => {
        if (err) {
            return res.status(404).send(`The requested url <code>${requested_path}</code> was not found in the server.`);
        }
        res.json(
            files.map((file) => {
                let file_stats = fs.statSync(FILES_PATH + requested_path + file);
                return { name: file, url: requested_path + file, mtime: file_stats.mtimeMs, size: file_stats.isDirectory() ? undefined : file_stats.size, type: file_stats.isDirectory() ? 'dir' : 'file' };
            })
        );
    });
})

app.post('/download', requireAuthentication, function (req, res) {
    let requested_file = (typeof req.query.fileurl === 'undefined') ? '/' : req.query.fileurl.replace(/\.\./g, '').replace(/[\/]+/g, '/');

    res.download(FILES_PATH + requested_file);
});

app.post('/upload', requireAuthentication, function (req, res) {
    console.log(req);
    if (typeof req.files === "undefined" || Object.keys(req.files).length == 0) {
        return res.status(400).send(`The request was send whithout files.`);
    }

    let requested_path = (typeof req.body.path === 'undefined') ? '/' : req.body.path.replace(/\.\./g, '').replace(/[\/]+/g, '/').concat(req.body.path.substr(req.body.path.length - 1) === '/' ? '' : '/');

    if (Array.isArray(req.files.files)) {
        // Multiple upload
        req.files.files.map((file) => {
            file.mv(FILES_PATH + requested_path + file.name, function (err) {
                if (err) {
                    res.status(500).send(`An error occured while uploading <code>${req.files.files.map((e) => e.name)}</code> in <code>${requested_path}</code>.`);
                }
            });
        }).then(() => {
            res.json({
                status: `success`,
                msg: `Files successfully uploaded`,
                detail: `Files <code>${req.files.files.map((e) => e.name)}</code> were successfully uploaded in <code>${requested_path}</code>.`
            });
        });
    } else {
        // Single upload
        req.files.files.mv(FILES_PATH + requested_path + req.files.files.name, function (err) {
            if (err) {
                res.status(500).send(`An error occured while uploading <code>${req.files.files.name}</code> in <code>${requested_path}</code>.`);
            } else {
                res.json({
                    status: "success",
                    msg: "File successfully uploaded",
                    detail: "The file <code>" + req.files.files.name + "</code> was successfully uploaded in <code>" + requested_path + "</code>."
                });
            }
        });
    }
});

app.post('/rename', requireAuthentication, function (req, res) {
    let fileurl = req.query.fileurl.replace(/\.\./g, '').replace(/[\/]+/g, '/');
    let newurl = req.query.newurl.replace(/\.\./g, '').replace(/[\/]+/g, '/');

    fs.rename(FILES_PATH + '/' + fileurl, FILES_PATH + '/' + newurl, function (err) {
        if (err) {
            res.status(500).send(`An error occured while trying to rename <code>${fileurl}</code> into <code>${newurl}</code>.`);
        } else {
            res.status(200).json({
                "status": "success",
                "msg": "File successfully renamed",
                "detail": "<code>" + fileurl + "</code> was successfully renamed as <code>" + newurl + "</code>."
            });
        }
    });
});

app.get('/file', requireAuthentication, function (req, res) {
    let fileurl = req.query.fileurl.replace(/\.\./g, '').replace(/[\/]+/g, '/');

    res.setHeader("content-type", mime.lookup(FILES_PATH + fileurl));
    fs.createReadStream(FILES_PATH + fileurl).pipe(res);
});

app.post('/preview', requireAuthentication, function (req, res) {
    let fileurl = req.query.fileurl.replace(/\.\./g, '').replace(/[\/]+/g, '/');
    let file_mime = mime.lookup(FILES_PATH + '/' + fileurl);

    switch (file_mime) {
        case 'image/png': case 'image/jpeg': case 'image/x-icon': case 'image/svg+xml': case 'image/tiff': case 'image/webp':
            res.status(200).json({
                "status": "success",
                "type": "image",
                "url": req.baseUrl + '/file?fileurl=' + fileurl
            });
            break;
        case 'application/zip':
            const zip = new StreamZip({ file: FILES_PATH + fileurl, storeEntries: true });
            let array = [];
            let contents = [];
            zip.on('ready', () => {
                for (const entry of Object.values(zip.entries())) {
                    if (entry.isDirectory) {
                        let path = entry.name.slice(0, -1);
                        let splitname = path.split(/\/(?=[^\/]+$)/);

                        // create dir obj
                        let dir = { name: splitname[splitname.length - 1], type: "dir", content: [] };
                        // save content attribute reference
                        contents[path] = dir.content;
                        // add dir obj to parent dir
                        splitname.length > 1 ? contents[splitname[0]].push(dir) : array.push(dir);
                    } else {
                        let splitname = entry.name.split(/\/(?=[^\/]+$)/);
                        // create file obj
                        let file = { name: splitname[splitname.length - 1], type: "file", size: entry.size, mtime: entry.time };
                        // add file obj to parent dir
                        splitname.length > 1 ? contents[splitname[0]].push(file) : array.push(file);
                    }
                }
                // Do not forget to close the file once you're done
                zip.close();
                res.status(200).json({
                    "status": "success",
                    "type": "zip",
                    "content": array
                });
            });
            zip.on('error', () => res.status(500).send('An error occured while reading <code>' + fileurl + '</code>.'));
            break;
        case 'application/pdf':
            fs.readFile(FILES_PATH + fileurl, { encoding: 'utf-8' }, function (err, data) {
                res.status(200).json({
                    "status": "success",
                    "type": "pdf",
                    "url": req.baseUrl + '/file?fileurl=' + fileurl
                });
            });
            break;

        case 'text/markdown':
            fs.readFile(FILES_PATH + fileurl, { encoding: 'utf-8' }, function (err, data) {
                res.status(200).json({
                    "status": "success",
                    "type": "markdown",
                    "content": data
                });
            });
            break;

        case 'text/html':
            fs.readFile(FILES_PATH + fileurl, { encoding: 'utf-8' }, function (err, data) {
                res.status(200).json({
                    "status": "success",
                    "type": "html",
                    "content": data
                });
            });
            break;

        case 'inode/x-empty': case 'application/xml':
            fs.readFile(FILES_PATH + fileurl, { encoding: 'utf-8' }, function (err, data) {
                res.status(200).json({
                    "status": "success",
                    "type": "text",
                    "content": data
                });
            });
            break;

        default:
            if (file_mime.startsWith('text/')) {
                fs.readFile(FILES_PATH + fileurl, { encoding: 'utf-8' }, function (err, data) {
                    res.status(200).json({
                        "status": "success",
                        "type": "text",
                        "content": data
                    });
                });
                break;
            } else {
                res.status(500).send("An error occured while trying to render <code>" + fileurl + "</code>. Mime <code>" + file_mime + "</code> not implemented.");
            }
    }
});

app.post('/delete', requireAdminAuthentication, function (req, res) {
    let files = JSON.parse(req.query.files).map((e) => e.replace(/\.\./g, '').replace(/[\/]+/g, '/').concat(e.substr(e.length - 1) === '/' ? '' : '/'));

    files.map((path, index, array) => {
        fs.lstat(FILES_PATH + path, (err, stats) => {
            if (err) {
                return res.status(500).send("An error occured while deleting some files.");
            } else if (stats.isFile()) {
                fs.unlinkSync(FILES_PATH + path);
            } else {
                deleteFolderRecursive(FILES_PATH + path);
            }
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

app.post('/newfile', requireAuthentication, function (req, res) {
    let name = req.query.name.replace(/\.\./g, '').replace(/[\/]+/g, '/');
    let path = req.query.path.replace(/\.\./g, '').replace(/[\/]+/g, '/').concat(req.query.path.substr(req.query.path.length - 1) === '/' ? '' : '/');

    fs.open(FILES_PATH + path + name, 'ax', (err) => {
        if (err) {
            res.status(500).send("An error occured while trying to create <code>" + name + "</code> into <code>" + path + "</code>.");
        } else {
            res.status(200).json({
                "status": "success",
                "msg": "File successfully created",
                "detail": "<code>" + name + "</code> was successfully created in <code>" + path + "</code>."
            });
        }
    });
});

app.post('/newfolder', requireAuthentication, function (req, res) {
    let name = req.query.name.replace(/\.\./g, '').replace(/[\/]+/g, '/');
    let path = req.query.path.replace(/\.\./g, '').replace(/[\/]+/g, '/').concat(req.query.path.substr(req.query.path.length - 1) === '/' ? '' : '/');

    fs.mkdir(FILES_PATH + path + name, { recursive: true }, (err) => {
        if (err) {
            res.status(500).send("An error occured while trying to create <code>" + name + "</code> into <code>" + path + "</code>.");
        } else {
            res.status(200).json({
                "status": "success",
                "msg": "Folder successfully created",
                "detail": "<code>" + name + "</code> was successfully created in <code>" + path + "</code>."
            });
        }
    });
});

// route middleware to make sure a user is logged in
function requireAuthentication(req, res, next) {

    //if (req.isAuthenticated())
    return next();

    // if they aren't return 403
    res.status(401).send("You must login to perform this action.");
}

// route middleware to make sure a user is logged in as admin
function requireAdminAuthentication(req, res, next) {
    if (!req.isAuthenticated())
        return requireAuthentication(req, res, next);

    if (typeof req.user.role !== "undefined" && req.user.role.includes('ROLE_CLOUD_ADMIN'))
        return next();

    // if they aren't return 403
    res.status(403).send("You don't have required rights to perform this action.");
}

module.exports = app