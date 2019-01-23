const security = {

    ROLES: {
        ADMIN: 'ADMIN',
        USER: 'USER',
        CLOUD_ADMIN: 'CLOUD_ADMIN',
    },

    // route middleware to make sure a user is logged in
    requireAuthentication: function (req, res, next) {

        if (req.isAuthenticated())
            return next();

        // if they aren't return 403
        res.status(401).send("You must login to perform this action.");
    },

    // route middleware to make sure a user has specified role
    requireRole: function (role) {
        return function (req, res, next) {
            if (!req.isAuthenticated())
                return security.requireAuthentication(req, res, next);

            if (typeof req.user.roles !== "undefined"
                && req.user.roles.split(',').includes(role)
                || req.user.roles.split(',').includes(security.ROLES.ADMIN))
                return next();

            // if they aren't return 403
            res.status(403).send("You don't have required rights to perform this action.");
        }
    }

}

module.exports = security;