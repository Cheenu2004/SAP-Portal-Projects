const axios = require('axios');
const xml2js = require('xml2js');

const SAP_BASE_URL = process.env.SAP_BASE_URL || 'http://AZKTLDS5CP.kcloud.com:8000';
const SAP_USERNAME = process.env.SAP_USERNAME || 'K902065';
const SAP_PASSWORD = process.env.SAP_PASSWORD || 'Srini@0611';
const SAP_CLIENT   = process.env.SAP_CLIENT || '100';

/**
 * SAP SOAP Service
 * Reusable helper for calling SAP RFC SOAP endpoints.
 *
 * NOTE: SOAPAction header is intentionally NOT sent —
 *       SAP classic RFC SOAP services do not require it.
 */
class SapService {

  /**
   * Call a SAP SOAP endpoint.
   * @param {string} endpoint   - SAP URL path (appended to SAP_BASE_URL)
   * @param {string} soapBody   - Full SOAP XML envelope string
   * @param {string} soapAction - (Optional) SOAPAction header value
   * @returns {Promise<Object>} - Parsed JSON of the SOAP response
   */
  async callSoapEndpoint(endpoint, soapBody, soapAction = '') {
    const url = `${SAP_BASE_URL}${endpoint}`;

    // Basic auth from .env
    const authString = Buffer.from(`${SAP_USERNAME}:${SAP_PASSWORD}`).toString('base64');

    const headers = {
      'Content-Type': 'text/xml;charset=UTF-8',
      'Authorization': `Basic ${authString}`,
      'Cookie': `sap-usercontext=sap-client=${SAP_CLIENT}`
    };

    if (soapAction) {
      headers['SOAPAction'] = soapAction;
    }

    try {
      const response = await axios.post(url, soapBody, {
        headers,
        timeout: 30000 // 30 second timeout
      });
      return await this.parseXmlResponse(response.data);
    } catch (error) {
      if (error.response) {
        console.error('[SAP_ERROR] Raw Response:', error.response.data);
        // SAP returned an HTTP error (e.g. 500 SOAP Fault)
        const parsed = await this.parseXmlResponse(error.response.data).catch(() => null);
        const faultMsg = this._extractFaultMessage(parsed) || error.message;
        throw new Error(`SAP SOAP Fault: ${faultMsg}`);
      }
      if (error.code === 'ECONNABORTED') {
        throw new Error('SAP connection timed out. Please try again.');
      }
      throw error;
    }
  }

  /**
   * Parse XML string to JSON.
   * @param {string} xmlData
   * @returns {Promise<Object>}
   */
  async parseXmlResponse(xmlData) {
    const parser = new xml2js.Parser({
      explicitArray: false,
      ignoreAttrs: true,
      tagNameProcessors: [xml2js.processors.stripPrefix]
    });

    return new Promise((resolve, reject) => {
      parser.parseString(xmlData, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  /**
   * Extract the response body element from the parsed SOAP envelope.
   * @param {Object} parsedXml    - Full parsed SOAP envelope
   * @param {string} responseName - Name of the response element (e.g. 'ZSD_LGN_FM902065Response')
   * @returns {Object}
   */
  extractResponseBody(parsedXml, responseName) {
    try {
      const body = parsedXml.Envelope.Body;
      return body[responseName] || body;
    } catch {
      return parsedXml;
    }
  }

  /**
   * Normalize a SAP table response to always be an Array.
   * SAP returns a single object (not array) when there is only one row.
   * @param {any} data
   * @returns {Array}
   */
  normalizeArray(data) {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    // xml2js wraps multi-row tables in .item
    if (data.item) {
      return Array.isArray(data.item) ? data.item : [data.item];
    }
    return [data];
  }

  /**
   * Extract fault message from a parsed SOAP Fault response.
   * @private
   */
  _extractFaultMessage(parsed) {
    try {
      const body = parsed.Envelope.Body;
      return (
        body.Fault?.faultstring ||
        body.Fault?.detail ||
        body.fault?.faultstring ||
        null
      );
    } catch {
      return null;
    }
  }
}

module.exports = new SapService();
