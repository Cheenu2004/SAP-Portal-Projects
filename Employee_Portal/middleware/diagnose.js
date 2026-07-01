const axios = require('axios');

async function testLogin(empId, password) {
  console.log(`\n========== Testing EmpId: "${empId}" Password: "${password}" ==========`);
  try {
    // Step 1: Login
    const loginRes = await axios.post(
      'http://localhost:3002/sap/opu/odata/sap/Z26_EMP_PORTAL_902065_SRV/LoginSet',
      { EmpId: empId, Password: password },
      { headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' } }
    );

    console.log('Login Response:', JSON.stringify(loginRes.data.d, null, 2));
    const status = loginRes.data.d?.Status;
    const returnedId = loginRes.data.d?.EmpId;

    if (status !== 'SUCCESS') {
      console.log(`Login FAILED: ${loginRes.data.d?.Message}`);
      return;
    }

    console.log(`\nLogin SUCCESS! SAP returned EmpId: "${returnedId}"`);

    // Step 2: Try Profile with returned ID
    console.log(`\n--- Fetching Profile for "${returnedId}" ---`);
    try {
      const profileRes = await axios.get(
        `http://localhost:3002/sap/opu/odata/sap/Z26_EMP_PORTAL_902065_SRV/EmployeeProfileSet('${returnedId}')?$format=json`,
        { headers: { 'X-Requested-With': 'XMLHttpRequest' } }
      );
      console.log('Profile:', JSON.stringify(profileRes.data.d, null, 2));
    } catch (e) {
      console.log('Profile fetch FAILED:', e.response?.data || e.message);
    }

    // Step 3: Try Leaves with returned ID
    console.log(`\n--- Fetching Leaves for "${returnedId}" ---`);
    try {
      const leaveRes = await axios.get(
        `http://localhost:3002/sap/opu/odata/sap/Z26_EMP_PORTAL_902065_SRV/LeaveDataSet?$filter=EmpId eq '${returnedId}'&$format=json`,
        { headers: { 'X-Requested-With': 'XMLHttpRequest' } }
      );
      console.log('Leave records count:', leaveRes.data.d?.results?.length || 0);
      if (leaveRes.data.d?.results?.length > 0) {
        console.log('First Leave:', JSON.stringify(leaveRes.data.d.results[0], null, 2));
      }
    } catch (e) {
      console.log('Leave fetch FAILED:', e.response?.data || e.message);
    }

    // Step 4: Try Payslips with returned ID
    console.log(`\n--- Fetching Payslips for "${returnedId}" ---`);
    try {
      const payRes = await axios.get(
        `http://localhost:3002/sap/opu/odata/sap/Z26_EMP_PORTAL_902065_SRV/PaySlipSet?$filter=EmpId eq '${returnedId}'&$format=json`,
        { headers: { 'X-Requested-With': 'XMLHttpRequest' } }
      );
      console.log('Payslip records count:', payRes.data.d?.results?.length || 0);
      if (payRes.data.d?.results?.length > 0) {
        console.log('First Payslip:', JSON.stringify(payRes.data.d.results[0], null, 2));
      }
    } catch (e) {
      console.log('Payslip fetch FAILED:', e.response?.data || e.message);
    }

  } catch (e) {
    console.log('Request error:', e.response?.data || e.message);
  }
}

async function run() {
  // Test all known credentials from ZEMP_LGN_902065
  await testLogin('14', '1234');
  await testLogin('2', '4567');
  await testLogin('EMP001', '1234');
}

run();
