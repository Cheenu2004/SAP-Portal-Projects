
const axios = require('axios');

async function checkFields(wsBase, typeName) {
    const url = `http://AZKTLDS5CP.kcloud.com:8000/sap/bc/srt/rfc/sap/${wsBase.toLowerCase()}/100/${wsBase.toLowerCase()}/${wsBase.toLowerCase()}_b?wsdl`;
    const auth = Buffer.from('K902065:Srini@0611').toString('base64');
    
    try {
        const res = await axios.get(url, { headers: { Authorization: 'Basic ' + auth } });
        // Find the complexType
        const match = res.data.match(new RegExp(`<xsd:complexType name="${typeName}">([\\s\\S]*?)<\\/xsd:complexType>`, 'i'));
        if (match) {
            console.log(`Fields for ${typeName}:`);
            console.log(match[0]);
        }
    } catch (e) {
        console.log(`Error: ${e.message}`);
    }
}

async function run() {
    await checkFields('ZSD_MEM_WS902065', 'ZSD_MEM_902065'); // ZSD_MEMT_902065 usually refers to a table type whose row type is ZSD_MEM_902065
    await checkFields('ZSD_PAY_WS902065', 'ZSD_PAY_902065');
}

run();
