const express    = require('express');
const sapService = require('../services/sap.service');
const {
  buildInvoiceXml,
  buildInvoiceDetailsXml,
  buildPaymentsXml,
  buildMemoXml,
  buildSalesSummaryXml
} = require('../services/xml-builders');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = express.Router();

// ─── Helper ────────────────────────────────────────────────────────────────

function getKunnr(req) {
  return (req.body.kunnr || req.user.kunnr || '').toString().trim();
}

// ─── Routes ────────────────────────────────────────────────────────────────

/**
 * POST /api/financial/invoices
 * Fetch invoice list via ZSD_INV_FM902065.
 *
 * Body:    { kunnr }
 * Returns: { success, status, message, data: ET_INV[] }
 */
router.post('/invoices', authenticateToken, async (req, res, next) => {
  try {
    const kunnr = getKunnr(req);

    if (!kunnr) {
      return res.status(400).json({ success: false, status: 'ERROR', message: 'kunnr is required' });
    }

    const soapBody = buildInvoiceXml(kunnr);
    const endpoint = '/sap/bc/srt/rfc/sap/zsd_inv_ws902065/100/zsd_inv_ws902065/zsd_inv_b902065';
    const soapAction = 'urn:sap-com:document:sap:rfc:functions:ZSD_INV_WS902065:ZSD_INV_FM902065Request';

    const result       = await sapService.callSoapEndpoint(endpoint, soapBody, soapAction);
    const responseBody = sapService.extractResponseBody(result, 'ZSD_INV_FM902065Response');

    const status  = responseBody.EV_STATUS;
    const message = responseBody.EV_MESSAGE;
    const rawData = sapService.normalizeArray(responseBody.ET_INV);
    
    // Helpers for zero-padding/trimming
    const trimZeros = (val) => (val || '').toString().replace(/^0+/, '');

    // Map English fields back to standard German fields
    const data = rawData.map(item => ({
      VBELN: trimZeros(item.INV_NO || item.VBELN),
      FKDAT: item.INV_DATE || item.FKDAT || '',
      NETWR: item.NET_VALUE || item.NETWR || '0',
      WAERK: item.CURRENCY || item.WAERK || '',
      FKART: item.INV_TYPE || item.FKART || '',
      ZTERM: item.PAY_TERM || item.ZTERM || '',
      MATNR: trimZeros(item.MATERIAL || item.MATNR),
      QTY:   item.QTY || '',
      UNIT:  item.UNIT || ''
    }));

    console.log(`[INVOICES] KUNNR: ${kunnr} → ${data.length} row(s), Status: ${status}`);

    return res.json({ success: true, status, message, data });

  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/financial/invoice-details
 * Generate/download invoice PDF via ZSD_INVDET_FM902065.
 */
router.post('/invoice-details', authenticateToken, async (req, res, next) => {
  try {
    let vbeln = (req.body.vbeln || '').toString().trim();

    if (!vbeln) {
      return res.status(400).json({ success: false, status: 'ERROR', message: 'vbeln is required' });
    }

    // Pad vbeln to 10 digits for SAP RFC compatibility
    const paddedVbeln = vbeln.padStart(10, '0');

    const soapBody = buildInvoiceDetailsXml(paddedVbeln);
    const endpoint = '/sap/bc/srt/rfc/sap/zsd_invdet_ws902065/100/zsd_invdet_ws902065/zsd_invdet_b902065';
    const soapAction = 'urn:sap-com:document:sap:rfc:functions:ZSD_INVDET_WS902065:ZSD_INVDET_FM902065Request';

    const result       = await sapService.callSoapEndpoint(endpoint, soapBody, soapAction);
    const responseBody = sapService.extractResponseBody(result, 'ZSD_INVDET_FM902065Response');
    console.log('[DEBUG] Invoice Detail Full Response:', JSON.stringify(responseBody));

    const pdfBase64Raw = responseBody.EV_PDF_BASE64 || responseBody.EV_PDF_XSTRING || '';
    const pdfBase64 = pdfBase64Raw.replace(/\s/g, ''); // Remove any whitespace/newlines

    console.log(`[INVOICE-PDF] VBELN: ${vbeln} → Base64 length: ${pdfBase64.length}`);

    if (!pdfBase64) {
      return res.status(404).json({
        success: false,
        status:  'ERROR',
        message: 'No PDF data received from SAP'
      });
    }

    return res.json({
      success:   true,
      status:    'SUCCESS',
      message:   'Invoice PDF generated successfully',
      pdfBase64: pdfBase64,
      fileName:  `invoice_${vbeln}.pdf`,
      rawData:   responseBody
    });

  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/financial/payments
 * Fetch payment and aging data via ZSD_PAY_FM902065.
 */
router.post('/payments', authenticateToken, async (req, res, next) => {
  try {
    const kunnr    = getKunnr(req);
    const dateFrom = (req.body.dateFrom || '2000-01-01').toString().trim();
    const dateTo   = (req.body.dateTo   || '2099-12-31').toString().trim();

    if (!kunnr) {
      return res.status(400).json({
        success: false,
        status:  'ERROR',
        message: 'kunnr is required'
      });
    }

    const soapBody = buildPaymentsXml(kunnr, dateFrom, dateTo);
    const endpoint = '/sap/bc/srt/rfc/sap/zsd_pay_ws902065/100/zsd_pay_ws902065/zsd_pay_b902065';
    const soapAction = 'urn:sap-com:document:sap:rfc:functions:ZSD_PAY_WS902065:ZSD_PAY_FM902065Request';

    const result       = await sapService.callSoapEndpoint(endpoint, soapBody, soapAction);
    const responseBody = sapService.extractResponseBody(result, 'ZSD_PAY_FM902065Response');

    const status  = responseBody.EV_STATUS;
    const message = responseBody.EV_MESSAGE;
    const rawData = sapService.normalizeArray(responseBody.ET_PAY);

    // Helper for zero-trimming
    const trimZeros = (val) => (val || '').toString().replace(/^0+/, '');

    // Map English fields back to standard German fields
    const data = rawData.map(item => ({
      BUKRS: item.COMP_CODE  || item.BUKRS      || '',
      BELNR: trimZeros(item.DOC_NO || item.BELNR),
      GJAHR: item.FISC_YEAR  || item.GJAHR      || '',
      BLDAT: item.DOC_DATE   || item.BLDAT      || '',
      BUDAT: item.POST_DATE  || item.BUDAT      || '',
      WAERS: item.CURRENCY   || item.WAERS      || item.WAERS || '',
      DMBTR: item.AMOUNT     || item.DMBTR      || '0',
      XBLNR: item.REFERENCE  || item.XBLNR      || '',
      USNAM: item.USER_NAME  || item.USNAM      || '',
      AGING: item.AGING_DAYS || item.AGING      || '0',
      STATUS: item.STATUS    || ''
    }));

    console.log(`[PAYMENTS] KUNNR: ${kunnr} → ${data.length} row(s), Status: ${status}`);

    return res.json({ success: true, status, message, data });

  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/financial/memo
 * Fetch credit/debit memo data via ZSD_MEM_FM902065.
 */
router.post('/memo', authenticateToken, async (req, res, next) => {
  try {
    const kunnr    = getKunnr(req);
    const dateFrom = (req.body.dateFrom || '2000-01-01').toString().trim();
    const dateTo   = (req.body.dateTo   || '2099-12-31').toString().trim();

    if (!kunnr) {
      return res.status(400).json({
        success: false,
        status:  'ERROR',
        message: 'kunnr is required'
      });
    }

    const soapBody = buildMemoXml(kunnr, dateFrom, dateTo);
    const endpoint = '/sap/bc/srt/rfc/sap/zsd_mem_ws902065/100/zsd_mem_ws902065/zsd_mem_b902065';
    const soapAction = 'urn:sap-com:document:sap:rfc:functions:ZSD_MEM_WS902065:ZSD_MEM_FM902065Request';

    const result       = await sapService.callSoapEndpoint(endpoint, soapBody, soapAction);
    const responseBody = sapService.extractResponseBody(result, 'ZSD_MEM_FM902065Response');

    const status  = responseBody.EV_STATUS;
    const message = responseBody.EV_MESSAGE;
    const rawData = sapService.normalizeArray(responseBody.ET_MEM);

    // Helper for zero-trimming
    const trimZeros = (val) => (val || '').toString().replace(/^0+/, '');

    // Map English fields back to standard German fields
    const data = rawData.map(item => {
      let memoType = item.MEMO_TYPE || item.DOC_TYPE || item.FKART || '';
      if (memoType === 'CREDIT MEM') memoType = 'CREDIT MEMO';

      return {
        VBELN: trimZeros(item.DOC_NO || item.VBELN),
        FKDAT: item.DOC_DATE || item.FKDAT || '',
        NETWR: item.AMOUNT || item.NET_VALUE || item.NETWR || '0',
        WAERK: item.CURRENCY || item.WAERK || '',
        FKART: memoType,
        KUNRG: item.PAYER || item.KUNRG || '',
        MATNR: item.MATERIAL || item.MATNR || ''
      };
    });

    console.log(`[MEMO] KUNNR: ${kunnr} → ${data.length} row(s), Status: ${status}`);

    return res.json({ success: true, status, message, data });

  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/financial/sales-summary
 * Fetch sales summary totals via ZSD_SUM_FM902065.
 */
router.post('/sales-summary', authenticateToken, async (req, res, next) => {
  try {
    // We still extract kunnr from token for normal ops, but if dates are empty 
    // and they want overall summary, maybe we shouldn't send kunnr?
    // Let's only pass kunnr if we are actively filtering. Or just pass it.
    // Actually, the user says "I HAVE SHARED THE REQUEST AND RESPONSE FOR OVERALL SUMMARY DATA"
    // and the request was totally empty. So we'll pass empty dates.
    const dateFrom = (req.body.dateFrom || '').toString().trim();
    const dateTo   = (req.body.dateTo   || '').toString().trim();
    
    // If they provided dates, we probably should send the kunnr too, otherwise we just want overall.
    // Let's just always pass the kunnr we have, but if they want the empty request, 
    // maybe they don't even want kunnr. I'll pass null for kunnr if no dates are provided.
    // "NOW KEEP THE DASTE FILTER BUT STILL FETCH THE FULL DATA,THE FILETR SHOULD WHEN APPLIED."
    // Let's pass kunnr only if dates are provided, or maybe we shouldn't pass kunnr at all for summary? 
    // Let's just pass kunnr if the user has one, but the XML builder handles it. 
    // Wait, the user showed an EMPTY request. Let's pass null for kunnr if dates are not provided to match the empty request.
    const kunnr = (dateFrom || dateTo) ? getKunnr(req) : null;

    const soapBody = buildSalesSummaryXml(kunnr, dateFrom, dateTo);
    const endpoint = '/sap/bc/srt/rfc/sap/zsd_sum_ws902065/100/zsd_sum_ws902065/zsd_sum_b902065';

    // Intentionally omit SOAPAction, it can cause 500s if it mismatches the SAP binding
    const result       = await sapService.callSoapEndpoint(endpoint, soapBody, '');
    const responseBody = sapService.extractResponseBody(result, 'ZSD_SUM_FM902065Response');

    const status  = responseBody.EV_STATUS;
    const message = responseBody.EV_MESSAGE;

    // Map English fields in ES_SUMMARY
    const rawSummary = responseBody.ES_SUMMARY || {};
    console.log('[DEBUG] Sales Summary Raw:', JSON.stringify(rawSummary));

    const data = {
      KUNNR:         rawSummary.KUNNR || '',
      TOTAL_ORDERS:  rawSummary.TOTAL_ORDERS || '0',
      TOTAL_VALUE:   rawSummary.TOTAL_VALUE || rawSummary.NETWR || '0',
      OPEN_ORDERS:   rawSummary.OPEN_ORDERS || '0',
      CLOSED_ORDERS: rawSummary.CLOSED_ORDERS || '0',
      CURRENCY:      rawSummary.CURRENCY || rawSummary.WAERK || ''
    };

    console.log(`[SALES-SUMMARY] KUNNR: ${kunnr} → Value: ${data.TOTAL_VALUE}, Status: ${status}`);

    return res.json({ success: true, status, message, data });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
