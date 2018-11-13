var express = require('express'),
    router = express.Router();
var app = express();

const fs = require('fs');
const files_path = ".";

var nunjucks = require('nunjucks');
nunjucks.configure('views', {
    autoescape: true,
    express: app
});

router.get('/', function (req, res) {
    // res.setHeader('Content-Type', 'text/plain');
    // res.send('Documentation de l\'API');
    res.render('cloud/api/index.html');
})

router.get('/browse', function (req, res) {
    res.setHeader('Content-Type', 'application/json');

    let requested_path = (typeof req.query.path === 'undefined') ? '/' : req.query.path.replace(/\.\./g, '').replace(/[\/]+/g, '/');

    fs.readdir(files_path + requested_path, (err, files) => {
        res.send(
            files.map((file) => {
                let file_stats = fs.statSync(files_path + requested_path + '/' + file);
                return { name: file, url: requested_path + file, mtime: file_stats.mtime, size: file_stats.size, type: file_stats.isDirectory() ? 'dir' : 'file' };
            })
        );
    });
})

module.exports = router