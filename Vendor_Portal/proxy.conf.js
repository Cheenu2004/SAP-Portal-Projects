module.exports = {
  "/sap/opu/odata": {
    "target": "http://AZKTLDS5CP.kcloud.com:8000",
    "secure": false,
    "changeOrigin": true,
    "logLevel": "debug",
    "onProxyRes": function (proxyRes, req, res) {
      console.log('Intercepted response with status:', proxyRes.statusCode);
      if (proxyRes.statusCode === 401) {
        proxyRes.statusCode = 403;
        delete proxyRes.headers['www-authenticate'];
      }
    }
  }
};
