var express = require('express'),
    router = express.Router();

router.get('*', function (req, res) {
    res.setHeader('Content-Type', 'text/plain');
    res.send('Vous êtes dans le cloud : ' + req.url);
})

module.exports = router