require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3002;
const SAP_BASE_URL = process.env.SAP_BASE_URL || 'http://AZKTLDS5CP.kcloud.com:8000';
const SAP_USER = process.env.SAP_USER;
const SAP_PASSWORD = process.env.SAP_PASSWORD;

// Email configuration (HR sender — never exposed to end users)
const HR_EMAIL = process.env.HR_EMAIL || 'srinidhis0611@gmail.com';
const HR_EMAIL_APP_PASSWORD = process.env.HR_EMAIL_APP_PASSWORD;
const HR_DISPLAY_NAME = process.env.HR_DISPLAY_NAME || 'HR Team - Employee Portal';

if (!SAP_USER || !SAP_PASSWORD) {
  console.error('CRITICAL WARNING: SAP_USER or SAP_PASSWORD environment variables are not defined in .env!');
}

if (!HR_EMAIL_APP_PASSWORD) {
  console.warn('[EMAIL] WARNING: HR_EMAIL_APP_PASSWORD is not set in .env. Email sending will not work.');
}

const authHeaderValue = `Basic ${Buffer.from(`${SAP_USER}:${SAP_PASSWORD}`).toString('base64')}`;
const AXIOS_TIMEOUT = 30000; // 30 seconds for slow SAP systems

// ─── Nodemailer transporter (Gmail SMTP via smtp.googlemail.com fallback) ─────
const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.googlemail.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER || HR_EMAIL,
    pass: process.env.SMTP_PASSWORD || HR_EMAIL_APP_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verify SMTP credentials at startup
emailTransporter.verify()
  .then(() => {
    console.log('[EMAIL] ✅ SMTP connection verified — Gmail transporter is ready to send.');
  })
  .catch((err) => {
    console.error('[EMAIL] ❌ SMTP verification FAILED at startup:', err.message);
    console.error('[EMAIL]    Full error:', JSON.stringify({ code: err.code, command: err.command, response: err.response }, null, 2));
  });

// ─── Helper: month number -> month name ───────────────────────────────────────
function getMonthName(monthStr) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const idx = parseInt(monthStr, 10) - 1;
  return months[idx] || monthStr;
}

// Helper to fetch CSRF token on demand for modification calls (POST/PUT/DELETE)
async function fetchCsrfToken(incomingCookie) {
  console.log('[MIDDLEWARE] Fetching new CSRF token from SAP...');
  const tokenUrl = `${SAP_BASE_URL}/sap/opu/odata/sap/Z26_EMP_PORTAL_902065_SRV/`;
  
  const headers = {
    'Authorization': authHeaderValue,
    'X-CSRF-Token': 'Fetch'
  };
  if (incomingCookie) {
    headers['Cookie'] = incomingCookie;
  }
  
  try {
    const response = await axios({
      method: 'GET',
      url: tokenUrl,
      headers: headers,
      timeout: AXIOS_TIMEOUT
    });
    
    const token = response.headers['x-csrf-token'];
    let cookie = incomingCookie || '';
    if (response.headers['set-cookie']) {
      cookie = response.headers['set-cookie'].join('; ');
    }
    console.log('[MIDDLEWARE] CSRF token successfully retrieved.');
    return { token, cookie };
  } catch (error) {
    console.error('[MIDDLEWARE] Error fetching CSRF token:', error.message);
    throw error;
  }
}

// ─── /api/payslip/email  ──────────────────────────────────────────────────────
// Fetches payslip PDF from SAP and emails it to the provided recipient address.
app.post('/api/payslip/email', async (req, res) => {
  const { empId, month, year, email: recipientEmail } = req.body;

  // --- Validate inputs ---
  if (!empId || !month || !year || !recipientEmail) {
    return res.status(400).json({ error: 'Missing required fields: empId, month, year, email.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(recipientEmail)) {
    return res.status(400).json({ error: 'Invalid email address provided.' });
  }

  if (!HR_EMAIL_APP_PASSWORD) {
    return res.status(500).json({ error: 'Email service is not configured on the server. Please contact IT support.' });
  }

  const monthName = getMonthName(month);
  const pdfUrl = `${SAP_BASE_URL}/sap/opu/odata/sap/Z26_EMP_PORTAL_902065_SRV/PaySlipPdfSet(EmpId='${empId}',Month='${month}',Year='${year}')/$value`;

  console.log(`[EMAIL] Request received: empId=${empId}, period=${monthName} ${year}, recipient=${recipientEmail}`);
  console.log(`[EMAIL] Fetching PDF from SAP: ${pdfUrl}`);

  try {
    // --- Step 1: Fetch PDF from SAP ---
    const pdfResponse = await axios({
      method: 'GET',
      url: pdfUrl,
      headers: {
        'Authorization': authHeaderValue,
        'Accept': 'application/pdf, */*',
        'X-Requested-With': 'XMLHttpRequest'
      },
      responseType: 'arraybuffer',
      timeout: 25000
    });

    const pdfBuffer = Buffer.from(pdfResponse.data);
    console.log(`[EMAIL] PDF fetched successfully (${pdfBuffer.length} bytes). Preparing email...`);

    // --- Step 2: Build & send email ---
    const displayEmpId = String(empId).replace(/^0+/, '') || empId;

    const mailOptions = {
      from: `"${HR_DISPLAY_NAME}" <${HR_EMAIL}>`,
      to: recipientEmail,
      subject: `Your Payslip for ${monthName} ${year} – Employee Portal`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Payslip ${monthName} ${year}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

          <!-- Header Banner -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a237e 0%,#283593 60%,#3949ab 100%);padding:36px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:0.5px;">Employee Portal</h1>
              <p style="margin:8px 0 0;color:#c5cae9;font-size:14px;">Human Resources Department</p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:36px 40px 0;">
              <p style="margin:0;font-size:16px;color:#1a237e;font-weight:600;">Dear Employee (ID: ${displayEmpId}),</p>
              <p style="margin:16px 0 0;font-size:15px;color:#37474f;line-height:1.7;">
                Please find attached your <strong>official salary statement</strong> for the period of
                <strong>${monthName} ${year}</strong>, issued by the HR &amp; Payroll team.
              </p>
            </td>
          </tr>

          <!-- Info Box -->
          <tr>
            <td style="padding:28px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#e8eaf6;border-radius:10px;padding:20px 24px;">
                <tr>
                  <td>
                    <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#3949ab;text-transform:uppercase;letter-spacing:0.8px;">Payslip Details</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:14px;color:#546e7a;padding:4px 0;width:140px;">Employee ID</td>
                        <td style="font-size:14px;color:#263238;font-weight:600;">${displayEmpId}</td>
                      </tr>
                      <tr>
                        <td style="font-size:14px;color:#546e7a;padding:4px 0;">Pay Period</td>
                        <td style="font-size:14px;color:#263238;font-weight:600;">${monthName} ${year}</td>
                      </tr>
                      <tr>
                        <td style="font-size:14px;color:#546e7a;padding:4px 0;">Document Type</td>
                        <td style="font-size:14px;color:#263238;font-weight:600;">Salary Statement (PDF)</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Instructions -->
          <tr>
            <td style="padding:0 40px 28px;">
              <p style="margin:0;font-size:14px;color:#546e7a;line-height:1.8;">
                The payslip PDF is attached to this email. You can open it with any standard PDF viewer.
                Please keep this document safe for your personal records — it may be required for
                loan applications, tax filings, and other financial processes.
              </p>
              <p style="margin:16px 0 0;font-size:14px;color:#546e7a;line-height:1.8;">
                If you have any queries regarding your salary or deductions, please reach out to the
                HR department through the official Employee Portal or contact your HR Business Partner.
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <hr style="border:none;border-top:1px solid #eceff1;margin:0;" />
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#90a4ae;">
                This is an auto-generated email from the <strong>Employee Self-Service Portal</strong>.<br/>
                Please do not reply to this email. For support, log in to your Employee Portal.
              </p>
              <p style="margin:12px 0 0;font-size:11px;color:#b0bec5;">
                &copy; ${year} HR &amp; Payroll Department &bull; Confidential
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
      attachments: [
        {
          filename: `Payslip_${displayEmpId}_${year}_${month}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    try {
      await emailTransporter.sendMail(mailOptions);
      console.log(`[EMAIL] ✅ Payslip email sent successfully to: ${recipientEmail}`);
      return res.status(200).json({
        success: true,
        message: `Payslip for ${monthName} ${year} has been sent to ${recipientEmail} successfully.`
      });
    } catch (err) {
      console.error(`[EMAIL] ⚠️ SMTP send failed:`, err.message);
      console.error(`[EMAIL]    Error code: ${err.code}, Command: ${err.command}`);
      console.error(`[EMAIL]    Response: ${err.response}`);
      console.error(`[EMAIL]    ResponseCode: ${err.responseCode}`);
      return res.status(500).json({ 
        error: 'Email delivery failed: ' + err.message,
        code: err.code,
        response: err.response
      });
    }

  } catch (err) {
    console.error('[EMAIL] ❌ Error sending payslip email:', err.message);

    if (err.response && err.response.status === 404) {
      return res.status(404).json({ error: `Payslip PDF not found in SAP for the period ${monthName} ${year}.` });
    }
    if (err.code === 'EAUTH') {
      return res.status(500).json({ error: 'Email authentication failed. Please check the HR email configuration.' });
    }
    if (err.code === 'ETIMEDOUT' || err.code === 'ECONNABORTED') {
      return res.status(504).json({ error: 'SAP server timed out while fetching the payslip PDF. Please try again.' });
    }

    return res.status(500).json({ error: 'Failed to send payslip email. Please try again later.' });
  }
});

// Intercept all requests under /sap
app.all('/sap/*', async (req, res) => {
  const targetUrl = `${SAP_BASE_URL}${req.originalUrl}`;
  const isBinaryRequest = req.originalUrl.includes('$value');

  console.log(`[MIDDLEWARE PROXY] ${req.method} -> ${targetUrl}`);

  const makeRequest = async (token = null, cookie = null) => {
    const headers = {
      'Authorization': authHeaderValue,
      'Accept': isBinaryRequest ? 'application/pdf, */*' : 'application/json',
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    };

    // Use cookies provided by the client (browser), or the fetched fallback cookies
    const reqCookie = cookie || req.headers.cookie;
    if (reqCookie) {
      headers['Cookie'] = reqCookie;
    }

    // Forward CSRF token if sent by the client, or use the fetched fallback token
    const reqToken = token || req.headers['x-csrf-token'];
    if (reqToken) {
      headers['X-CSRF-Token'] = reqToken;
    }

    return axios({
      method: req.method,
      url: targetUrl,
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
    } catch (err) {
      // If CSRF token is invalid/expired (status 403), retry fetching a new token once using current cookie context
      if (err.response && err.response.status === 403 && ['POST', 'PUT', 'DELETE'].includes(req.method)) {
        console.log('[MIDDLEWARE] CSRF token rejected. Retrying once with a new token...');
        const { token, cookie } = await fetchCsrfToken(req.headers.cookie);
        response = await makeRequest(token, cookie);
      } else {
        throw err;
      }
    }

    // Pass set-cookie from SAP back to the browser
    if (response.headers['set-cookie']) {
      res.setHeader('Set-Cookie', response.headers['set-cookie']);
    }

    // Pass x-csrf-token from SAP back to the browser
    if (response.headers['x-csrf-token']) {
      res.setHeader('X-CSRF-Token', response.headers['x-csrf-token']);
    }

    if (isBinaryRequest) {
      console.log(`[MIDDLEWARE] Received binary data of length ${response.data.length} bytes.`);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=form_document.pdf');
      return res.send(Buffer.from(response.data));
    }

    if (!response.data) {
      return res.status(response.status).json({});
    }

    // Process dates in JSON format (convert SAP /Date(12345678)/ to standard ISO dates)
    let dataStr = JSON.stringify(response.data);
    dataStr = dataStr.replace(/\/Date\((-?\d+)\)\//g, (match, timestamp) => {
      return new Date(parseInt(timestamp, 10)).toISOString();
    });

    return res.status(response.status).json(JSON.parse(dataStr));

  } catch (err) {
    let errorMessage = err.message;
    let errorStatus = err.response?.status || 500;
    let sapErrorBody = err.response?.data;

    // Remove www-authenticate headers to avoid browser prompts
    if (err.response && err.response.headers) {
      delete err.response.headers['www-authenticate'];
    }

    if (err.code === 'ETIMEDOUT') {
      errorMessage = 'SAP Server Connection Timeout. Check your connection or VPN.';
    } else if (err.code === 'ECONNREFUSED') {
      errorMessage = 'SAP Server Refused Connection. The system might be offline.';
    }

    console.error(`[MIDDLEWARE ERROR] Status ${errorStatus}: ${errorMessage}`);

    return res.status(errorStatus).json({
      error: 'SAP Integration Error',
      details: errorMessage,
      sapError: sapErrorBody,
      code: err.code
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'UP', message: 'Employee Portal SAP Middleware is active.' });
});

app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`Employee Portal Middleware Server running`);
  console.log(`Port: ${PORT}`);
  console.log(`Target SAP Host: ${SAP_BASE_URL}`);
  console.log(`Email sender: ${HR_EMAIL}`);
  console.log(`=========================================`);
});
