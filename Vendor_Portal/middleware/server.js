const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

const SAP_BASE_URL = 'http://AZKTLDS5CP.kcloud.com:8000/sap/opu/odata/sap/Z26_VEND_PORTAL_ODATA_SRV';
const AXIOS_TIMEOUT = 30000; // 30 seconds timeout for slow SAP responses
// IMPORTANT: Replace these with your actual SAP NetWeaver System credentials
// Do NOT use your Vendor ID here. This must be the system integration user.
const SAP_USER = 'K902065';
const SAP_PASSWORD = 'Srini@0611';
const auth = Buffer.from(`${SAP_USER}:${SAP_PASSWORD}`).toString('base64');

let csrfToken = '';
let sapCookie = '';

async function fetchCsrfToken() {
  console.log('Fetching new CSRF token and establishing SAP session...');
  try {
    const response = await axios({
      method: 'GET',
      url: SAP_BASE_URL,
      headers: {
        'Authorization': `Basic ${auth}`,
        'X-CSRF-Token': 'Fetch'
      },
      timeout: AXIOS_TIMEOUT
    });
    csrfToken = response.headers['x-csrf-token'];
    if (response.headers['set-cookie']) {
      sapCookie = response.headers['set-cookie'].join('; ');
    }
    console.log('SAP session established successfully.');
  } catch (err) {
    console.error('Failed to establish SAP session:', err.message);
  }
}

// Helper: update sapCookie from any SAP response
function captureCookies(response) {
  if (response && response.headers && response.headers['set-cookie']) {
    sapCookie = response.headers['set-cookie'].join('; ');
  }
}

// Generic route to proxy all requests to SAP OData
app.all('/api/*', async (req, res) => {
  const sapPath = req.originalUrl.replace('/api', '');
  const url = `${SAP_BASE_URL}${sapPath}`;
  const isBinaryRequest = sapPath.includes('$value');

  console.log(`[PROXY] ${req.method} -> ${url}`);

  const makeRequest = async (retry = false) => {
    // Re-establish session if cookie is missing or on retry
    if (!sapCookie || retry) {
      await fetchCsrfToken();
    }

    const headers = {
      'Authorization': `Basic ${auth}`,
      'Accept': isBinaryRequest ? 'application/pdf, */*' : 'application/json',
      'Content-Type': 'application/json'
    };

    if (sapCookie) headers['Cookie'] = sapCookie;

    if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
      if (!csrfToken || retry) await fetchCsrfToken();
      headers['X-CSRF-Token'] = csrfToken;
    }

    return axios({
      method: req.method,
      url: url,
      data: req.body,
      headers: headers,
      responseType: isBinaryRequest ? 'arraybuffer' : 'json',
      timeout: AXIOS_TIMEOUT
    });
  };

  try {
    let response;
    try {
      response = await makeRequest();
      captureCookies(response);
    } catch (err) {
      // Retry on 401 (Unauthorized) or 403 (Forbidden) for ANY method
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        console.log(`[RETRY] Auth error (${err.response.status}). Re-establishing SAP session and retrying...`);
        response = await makeRequest(true);
        captureCookies(response);
      } else {
        throw err;
      }
    }
    
    if (isBinaryRequest) {
      console.log(`[DEBUG] Received ${response.data.length} bytes for PDF.`);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=invoice.pdf');
      return res.send(Buffer.from(response.data));
    }

    if (!response.data) {
      return res.status(response.status).json({});
    }

    // Process Dates in JSON
    let dataStr = JSON.stringify(response.data);
    dataStr = dataStr.replace(/\/Date\((-?\d+)\)\//g, (match, timestamp) => {
      return new Date(parseInt(timestamp, 10)).toISOString();
    });
    
    return res.status(response.status).json(JSON.parse(dataStr));
  } catch (err) {
    let errorMessage = err.message;
    let errorStatus = err.response?.status || 500;
    let sapErrorBody = err.response?.data;

    if (err.code === 'ETIMEDOUT') {
      errorMessage = 'SAP Server Unreachable (Connection Timeout). Please check your VPN.';
    } else if (err.code === 'ECONNREFUSED') {
      errorMessage = 'SAP Server Refused Connection. The system might be down.';
    }

    console.error(`[PROXY ERROR] ${err.code || 'SAP'}: ${errorMessage}`);
    
    return res.status(errorStatus).json({ 
      error: 'Connectivity Issue', 
      details: errorMessage,
      sapError: sapErrorBody,
      code: err.code 
    });
  }
});

const PORT = 3001;
app.listen(PORT, async () => {
  console.log(`Middleware server running on port ${PORT}`);
  // Pre-establish SAP session on startup so the first request doesn't fail
  await fetchCsrfToken();
});
