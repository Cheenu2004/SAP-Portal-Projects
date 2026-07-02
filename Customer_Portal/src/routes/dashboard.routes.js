const express    = require('express');
const sapService = require('../services/sap.service');
const {
  buildInquiryXml,
  buildSalesOrderXml,
  buildDeliveryXml
} = require('../services/xml-builders');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = express.Router();

// ─── Helper ────────────────────────────────────────────────────────────────

/**
 * Extract kunnr from request body, falling back to JWT payload.
 */
function getKunnr(req) {
  return (req.body.kunnr || req.user.kunnr || '').toString().trim();
}

// ─── Routes ────────────────────────────────────────────────────────────────

/**
 * POST /api/dashboard/inquiry
 * Fetch inquiry data via ZSD_INQ_FM902065.
 *
 * Body:    { kunnr }
 * Returns: { success, status, message, data: ET_INQUIRY[] }
 */
router.post('/inquiry', authenticateToken, async (req, res, next) => {
  try {
    const kunnr = getKunnr(req);

    if (!kunnr) {
      return res.status(400).json({ success: false, status: 'ERROR', message: 'kunnr is required' });
    }

    const soapBody = buildInquiryXml(kunnr);
    const endpoint = '/sap/bc/srt/rfc/sap/zsd_inq_ws902065/100/zsd_inq_ws902065/zsd_inq_b902065';
    const soapAction = 'urn:sap-com:document:sap:rfc:functions:ZSD_INQ_WS902065:ZSD_INQ_FM902065Request';

    const result       = await sapService.callSoapEndpoint(endpoint, soapBody, soapAction);
    const responseBody = sapService.extractResponseBody(result, 'ZSD_INQ_FM902065Response');

    const status  = responseBody.EV_STATUS;
    const message = responseBody.EV_MESSAGE;

    // Return raw SAP rows — field names depend on your ABAP FM definition
    const rawData = sapService.normalizeArray(responseBody.ET_INQUIRY);
    console.log('[DEBUG] Raw Inquiry Item:', JSON.stringify(rawData[0] || {}));

    
    // Helper to trim leading zeros
    const trimZeros = (val) => (val || '').toString().replace(/^0+/, '');

    // Map English fields from SAP back to standard German fields the frontend expects
    const data = rawData.map(item => ({
      VBELN:  trimZeros(item.INQ_NO      || item.VBELN),
      ERDAT:  item.DATE        || item.ERDAT || '',
      NETWR:  item.NET_VALUE   || item.NETWR || '0',
      WAERK:  item.CURRENCY    || item.WAERK || '',
      KWMENG: item.QTY         || item.KWMENG || '0',
      VRKME:  item.UNIT        || item.VRKME || '',
      MATNR:  trimZeros(item.MATERIAL    || item.MATNR),
      MAKTX:  item.MAKTX       || '',
      ERNAM:  item.CREATED_BY  || item.ERNAM || '',
      ANGDT:  item.VALID_FROM  || item.ANGDT || '',
      BNDDT:  item.VALID_TO    || item.BNDDT || '',
      AUART:  item.TYPE        || item.AUART || '',
      VKORG:  item.SALES_ORG   || item.VKORG || ''
    }));

    console.log(`[INQUIRY] KUNNR: ${kunnr} → ${data.length} row(s), Status: ${status}`);

    return res.json({ success: true, status, message, data });

  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/dashboard/sales-orders
 * Fetch sales order data via ZSD_SO_FM902065.
 *
 * Body:    { kunnr }
 * Returns: { success, status, message, data: ET_SO[] }
 */
router.post('/sales-orders', authenticateToken, async (req, res, next) => {
  try {
    const kunnr = getKunnr(req);

    if (!kunnr) {
      return res.status(400).json({ success: false, status: 'ERROR', message: 'kunnr is required' });
    }

    const soapBody = buildSalesOrderXml(kunnr);
    const endpoint = '/sap/bc/srt/rfc/sap/zsd_so_ws902065/100/zsd_so_ws902065/zsd_so_b902065';
    const soapAction = 'urn:sap-com:document:sap:rfc:functions:ZSD_SO_WS902065:ZSD_SO_FM902065Request';

    const result       = await sapService.callSoapEndpoint(endpoint, soapBody, soapAction);
    const responseBody = sapService.extractResponseBody(result, 'ZSD_SO_FM902065Response');

    const status  = responseBody.EV_STATUS;
    const message = responseBody.EV_MESSAGE;
    
    const rawData = sapService.normalizeArray(responseBody.ET_SO);
    
    const trimZeros = (val) => (val || '').toString().replace(/^0+/, '');

    // Map English fields back to standard German fields
    const data = rawData.map(item => ({
      VBELN:  trimZeros(item.SO_NO     || item.VBELN),
      ERDAT:  item.DATE      || item.ERDAT || '',
      NETWR:  item.NET_VALUE || item.NETWR || '0',
      WAERK:  item.CURRENCY  || item.WAERK || '',
      KWMENG: item.QTY       || item.KWMENG || '0',
      VRKME:  item.UNIT      || item.VRKME || '',
      MATNR:  trimZeros(item.MATERIAL  || item.MATNR),
      MAKTX:  item.MAKTX     || '',
      AUART:  item.AUART     || '',
      BSTNK:  item.BSTNK     || ''
    }));

    console.log(`[SALES_ORDERS] KUNNR: ${kunnr} → ${data.length} row(s), Status: ${status}`);

    return res.json({ success: true, status, message, data });

  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/dashboard/delivery
 * Fetch delivery data via ZSD_DEL_FM902065.
 *
 * Body:    { kunnr }
 * Returns: { success, status, message, data: ET_DEL[] }
 */
router.post('/delivery', authenticateToken, async (req, res, next) => {
  try {
    const kunnr = getKunnr(req);

    if (!kunnr) {
      return res.status(400).json({ success: false, status: 'ERROR', message: 'kunnr is required' });
    }

    const soapBody = buildDeliveryXml(kunnr);
    const endpoint = '/sap/bc/srt/rfc/sap/zsd_del_ws902065/100/zsd_del_ws902065/zsd_del_b902065';
    const soapAction = 'urn:sap-com:document:sap:rfc:functions:ZSD_DEL_WS902065:ZSD_DEL_FM902065Request';

    const result       = await sapService.callSoapEndpoint(endpoint, soapBody, soapAction);
    const responseBody = sapService.extractResponseBody(result, 'ZSD_DEL_FM902065Response');

    const status  = responseBody.EV_STATUS;
    const message = responseBody.EV_MESSAGE;
    
    const rawData = sapService.normalizeArray(responseBody.ET_DEL);

    const trimZeros = (val) => (val || '').toString().replace(/^0+/, '');

    const data = rawData.map(item => ({
      VBELN: trimZeros(item.DEL_NO   || item.VBELN),
      ERDAT: item.DATE     || item.ERDAT || '',
      MATNR: trimZeros(item.MATERIAL || item.MATNR),
      LFIMG: item.QTY      || item.LFIMG || '0',
      VRKME: item.UNIT     || item.VRKME || '',
      WBSTK: item.STATUS   || item.WBSTK || '',
      MAKTX: item.MAKTX    || ''
    }));

    console.log(`[DELIVERY] KUNNR: ${kunnr} → ${data.length} row(s), Status: ${status}`);

    return res.json({ success: true, status, message, data });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
