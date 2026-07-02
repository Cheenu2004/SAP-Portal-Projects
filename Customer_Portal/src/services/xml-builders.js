/**
 * SOAP XML Builders for SAP RFC Function Modules
 *
 * Each builder wraps the FM inputs in a proper SOAP envelope.
 * SOAPAction headers are NOT used — handled at the service layer.
 */

const SOAP_ENVELOPE_START = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
xmlns:urn="urn:sap-com:document:sap:rfc:functions">
   <soapenv:Header/>
   <soapenv:Body>`;

const SOAP_ENVELOPE_END = `
   </soapenv:Body>
</soapenv:Envelope>`;

/**
 * Helper to ensure date is in YYYY-MM-DD format for SAP SOAP.
 * Converts YYYYMMDD to YYYY-MM-DD if necessary.
 */
function formatDate(date) {
  if (!date) return '';
  const d = date.toString().replace(/-/g, '');
  if (d.length === 8) {
    return `${d.substring(0, 4)}-${d.substring(4, 6)}-${d.substring(6, 8)}`;
  }
  return date;
}

function escapeXml(value) {
  return (value || '').toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ─── Auth ──────────────────────────────────────────────────────────────────

/**
 * ZSD_LGN_FM902065 — Customer login validation
 * @param {string} customerId - IV_CUST
 * @param {string} password   - IV_PASS
 */
function buildLoginXml(customerId, password, action = 'LOGIN', newPassword = '', confirmPassword = '') {
  return `${SOAP_ENVELOPE_START}
      <urn:ZSD_LGN_FM902065>
         <IV_ACTION>${escapeXml(action)}</IV_ACTION>
         <IV_CUST>${escapeXml(customerId)}</IV_CUST>
         <IV_PASS>${escapeXml(password)}</IV_PASS>
         <IV_NEW_PASS>${escapeXml(newPassword)}</IV_NEW_PASS>
         <IV_CONFIRM_PASS>${escapeXml(confirmPassword)}</IV_CONFIRM_PASS>
      </urn:ZSD_LGN_FM902065>${SOAP_ENVELOPE_END}`;
}

// ─── Profile ───────────────────────────────────────────────────────────────

/**
 * ZSD_PRF_FM902065 — Fetch customer profile
 * @param {string} kunnr - IV_KUNNR (Customer Number)
 */
function buildProfileXml(kunnr) {
  // Use unpadded KUNNR as confirmed by user's CURL example
  const cleanKunnr = kunnr.toString().replace(/^0+/, '') || '0';
  return `${SOAP_ENVELOPE_START}
      <urn:ZSD_PRF_FM902065>
         <IV_KUNNR>${cleanKunnr}</IV_KUNNR>
      </urn:ZSD_PRF_FM902065>${SOAP_ENVELOPE_END}`;
}

// ─── Dashboard ─────────────────────────────────────────────────────────────

/**
 * ZSD_INQ_FM902065 — Fetch inquiry data
 * @param {string} kunnr - IV_KUNNR
 */
function buildInquiryXml(kunnr) {
  return `${SOAP_ENVELOPE_START}
      <urn:ZSD_INQ_FM902065>
         <IV_KUNNR>${kunnr}</IV_KUNNR>
      </urn:ZSD_INQ_FM902065>${SOAP_ENVELOPE_END}`;
}

/**
 * ZSD_SO_FM902065 — Fetch sales order data
 * @param {string} kunnr - IV_KUNNR
 */
function buildSalesOrderXml(kunnr) {
  return `${SOAP_ENVELOPE_START}
      <urn:ZSD_SO_FM902065>
         <IV_KUNNR>${kunnr}</IV_KUNNR>
      </urn:ZSD_SO_FM902065>${SOAP_ENVELOPE_END}`;
}

/**
 * ZSD_DEL_FM902065 — Fetch delivery data
 * @param {string} kunnr - IV_KUNNR
 */
function buildDeliveryXml(kunnr) {
  const cleanKunnr = kunnr.toString().replace(/^0+/, '') || '0';
  return `${SOAP_ENVELOPE_START}
      <urn:ZSD_DEL_FM902065>
         <IV_KUNNR>${cleanKunnr}</IV_KUNNR>
      </urn:ZSD_DEL_FM902065>${SOAP_ENVELOPE_END}`;
}

// ─── Financial ─────────────────────────────────────────────────────────────

/**
 * ZSD_INV_FM902065 — Fetch invoice data
 * @param {string} kunnr - IV_KUNNR
 */
function buildInvoiceXml(kunnr) {
  const cleanKunnr = kunnr.toString().replace(/^0+/, '') || '0';
  return `${SOAP_ENVELOPE_START}
      <urn:ZSD_INV_FM902065>
         <IV_KUNNR>${cleanKunnr}</IV_KUNNR>
      </urn:ZSD_INV_FM902065>${SOAP_ENVELOPE_END}`;
}

/**
 * ZSD_INVDET_FM902065 — Generate invoice PDF
 * @param {string} vbeln - IV_VBELN (Invoice Number)
 */
function buildInvoiceDetailsXml(vbeln) {
  return `${SOAP_ENVELOPE_START}
      <urn:ZSD_INVDET_FM902065>
         <IV_VBELN>${vbeln}</IV_VBELN>
      </urn:ZSD_INVDET_FM902065>${SOAP_ENVELOPE_END}`;
}

function buildPaymentsXml(kunnr, dateFrom, dateTo) {
  const cleanKunnr = kunnr.toString().padStart(10, '0');
  return `${SOAP_ENVELOPE_START}
      <urn:ZSD_PAY_FM902065>
         <IV_KUNNR>${cleanKunnr}</IV_KUNNR>
         <IV_DATE_FROM>${formatDate(dateFrom)}</IV_DATE_FROM>
         <IV_DATE_TO>${formatDate(dateTo)}</IV_DATE_TO>
      </urn:ZSD_PAY_FM902065>${SOAP_ENVELOPE_END}`;
}

/**
 * ZSD_MEM_FM902065 — Fetch credit/debit memo data
 * WSDL order: IV_KUNNR, IV_DATE_FROM, IV_DATE_TO
 */
function buildMemoXml(kunnr, dateFrom, dateTo) {
  const cleanKunnr = kunnr.toString().replace(/^0+/, '') || '0';
  return `${SOAP_ENVELOPE_START}
      <urn:ZSD_MEM_FM902065>
         <IV_KUNNR>${cleanKunnr}</IV_KUNNR>
         <IV_DATE_FROM>${formatDate(dateFrom)}</IV_DATE_FROM>
         <IV_DATE_TO>${formatDate(dateTo)}</IV_DATE_TO>
      </urn:ZSD_MEM_FM902065>${SOAP_ENVELOPE_END}`;
}

/**
 * ZSD_SUM_FM902065 — Fetch sales summary totals
 * WSDL order: IV_DATE_FROM, IV_DATE_TO, IV_KUNNR
 */
function buildSalesSummaryXml(kunnr, dateFrom, dateTo) {
  let innerXml = '';
  
  if (dateFrom) {
    innerXml += `\n         <IV_DATE_FROM>${formatDate(dateFrom)}</IV_DATE_FROM>`;
  }
  if (dateTo) {
    innerXml += `\n         <IV_DATE_TO>${formatDate(dateTo)}</IV_DATE_TO>`;
  }
  
  // Only add kunnr if we are filtering. Wait, user wants OVERALL summary, so omit if not strictly required, 
  // but if we have it, we should add it if the SAP expects it. 
  // Let's add it only if kunnr is truthy and we aren't doing the 'overall' empty request. 
  // Wait, the user specifically showed an empty request. So we only include things that are present.
  if (kunnr) {
    const cleanKunnr = kunnr.toString().replace(/^0+/, '') || '0';
    innerXml += `\n         <IV_KUNNR>${cleanKunnr}</IV_KUNNR>`;
  }

  return `${SOAP_ENVELOPE_START}
      <urn:ZSD_SUM_FM902065>${innerXml ? innerXml + '\n      ' : '\n      '}</urn:ZSD_SUM_FM902065>${SOAP_ENVELOPE_END}`;
}

module.exports = {
  buildLoginXml,
  buildProfileXml,
  buildInquiryXml,
  buildSalesOrderXml,
  buildDeliveryXml,
  buildInvoiceXml,
  buildInvoiceDetailsXml,
  buildPaymentsXml,
  buildMemoXml,
  buildSalesSummaryXml
};
