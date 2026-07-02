const axios = require('axios');
const xml2js = require('xml2js');

const SAP_BASE_URL = 'http://AZKTLDS5CP.kcloud.com:8000';
const SAP_USERNAME = 'K902065';
const SAP_PASSWORD = 'Srini@0611';
const SAP_CLIENT   = '100';

async function debugInquiry() {
    const endpoint = '/sap/bc/srt/rfc/sap/zsd_inq_ws902065/100/zsd_inq_ws902065/zsd_inq_b902065';
    const url = `${SAP_BASE_URL}${endpoint}`;
    const authString = Buffer.from(`${SAP_USERNAME}:${SAP_PASSWORD}`).toString('base64');
    const soapAction = 'urn:sap-com:document:sap:rfc:functions:ZSD_INQ_WS902065:ZSD_INQ_FM902065Request';

    const soapBody = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:sap-com:document:sap:rfc:functions">
   <soapenv:Header/>
   <soapenv:Body>
      <urn:ZSD_INQ_FM902065>
         <IV_KUNNR>1</IV_KUNNR>
      </urn:ZSD_INQ_FM902065>
   </soapenv:Body>
</soapenv:Envelope>`;

    const headers = {
        'Content-Type': 'text/xml;charset=UTF-8',
        'Authorization': `Basic ${authString}`,
        'Cookie': `sap-usercontext=sap-client=${SAP_CLIENT}`,
        'SOAPAction': soapAction
    };

    try {
        const response = await axios.post(url, soapBody, { headers });
        const parser = new xml2js.Parser({
            explicitArray: false,
            ignoreAttrs: true,
            tagNameProcessors: [xml2js.processors.stripPrefix]
        });

        parser.parseString(response.data, (err, result) => {
            if (err) return;
            console.log('Inquiry Result:', JSON.stringify(result, null, 2));
        });
    } catch (error) {}
}

debugInquiry();
