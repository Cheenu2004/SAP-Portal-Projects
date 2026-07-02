module.exports = function ({ resources, options }) {
    return function (req, res, next) {
        if (req.url.startsWith('/sap')) {
            // Replace with your actual SAP username and password
            const username = 'K902065';
            const password = 'Srini@0611';

            const auth = 'Basic ' + Buffer.from(username + ':' + password).toString('base64');
            req.headers['authorization'] = auth;
            console.log('Added Authorization header for ' + req.url);
        }
        next();
    };
};
