const express    = require('express');
const sapService = require('../services/sap.service');
const { buildProfileXml } = require('../services/xml-builders');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * POST /api/profile
 * Fetch customer profile from SAP via ZSD_PRF_FM902065.
 *
 * Body:    { kunnr }
 * Returns: { success, status, message, data: ES_PROFILE fields }
 */
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    // Accept kunnr from body, or fall back to JWT payload
    const kunnr = (req.body.kunnr || req.user.kunnr || '').toString().trim();

    if (!kunnr) {
      return res.status(400).json({
        success: false,
        status:  'ERROR',
        message: 'Customer number (kunnr) is required'
      });
    }

    const soapBody = buildProfileXml(kunnr);
    const endpoint = '/sap/bc/srt/rfc/sap/zsd_prf_ws902065/100/zsd_prf_ws902065/zsd_prf_b902065';
    const soapAction = 'urn:sap-com:document:sap:rfc:functions:ZSD_PRF_WS902065:ZSD_PRF_FM902065Request';

    const result       = await sapService.callSoapEndpoint(endpoint, soapBody, soapAction);
    const responseBody = sapService.extractResponseBody(result, 'ZSD_PRF_FM902065Response');

    const status  = responseBody.EV_STATUS;
    const message = responseBody.EV_MESSAGE;
    const profile = responseBody.ES_PROFILE || {};

    console.log(`[PROFILE] KUNNR: ${kunnr} → Status: ${status}`);
    console.log('[DEBUG] ES_PROFILE keys:', Object.keys(profile));

    // Mapping based on user's specific FM structure
    const mappedData = {
      KUNNR:     profile.CUSTOMER_ID || profile.CUSTOMER || profile.KUNNR || kunnr,
      NAME1:     profile.NAME || profile.NAME1 || '',
      ORT01:     profile.CITY || profile.ORT01 || '',
      LAND1:     profile.COUNTRY || profile.LAND1 || '',
      TELF1:     profile.PHONE || profile.TELF1 || '',
      SMTP_ADDR: profile.EMAIL || profile.SMTP_ADDR || '',
      // Placeholders for missing fields in current FM structure
      STRAS:     profile.STREET || profile.STRAS || '',
      PSTLZ:     profile.POSTAL_CODE || profile.PSTLZ || '',
      REGIO:     profile.REGION || profile.REGIO || '',
      ADRNR:     profile.ADDRESS_NO || profile.ADRNR || ''
    };

    return res.json({
      success: true,
      status:  status,
      message: message,
      data:    mappedData
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
