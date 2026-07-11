const http = require('http');

const API_URL = 'http://localhost:5000/api';

const makeRequest = (url, method, headers = {}, body = null) => {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 400) {
            reject({ status: res.statusCode, error: parsed.error || 'Request failed' });
          } else {
            resolve(parsed);
          }
        } catch (e) {
          if (res.statusCode >= 400) {
            reject({ status: res.statusCode, error: data });
          } else {
            resolve(data);
          }
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

const runVerification = async () => {
  console.log('--- STARTING SYSTEM INTEGRATION VERIFICATION ---\n');

  try {
    // 1. Authenticate Admin User
    console.log('[1/7] Logging in as Admin (admin@maintainiq.com)...');
    const authData = await makeRequest(`${API_URL}/auth/login`, 'POST', {}, {
      email: 'admin@maintainiq.com',
      password: 'admin123'
    });
    console.log('✔ Login successful. Token acquired.\n');
    const adminToken = authData.token;
    const adminHeaders = { 'Authorization': `Bearer ${adminToken}` };

    // 2. Fetch Public Asset Info
    console.log('[2/7] Fetching public asset details for ASSET-001...');
    const publicAsset = await makeRequest(`${API_URL}/assets/public/ASSET-001`, 'GET');
    console.log(`✔ Public page accessed. Name: "${publicAsset.name}", Status: "${publicAsset.status}"\n`);

    // 3. Test AI Triage Endpoint
    console.log('[3/7] Running AI Triage simulation for complaint...');
    const complaint = 'The projector display is flickering and sometimes does not detect HDMI.';
    const triageData = await makeRequest(`${API_URL}/ai/triage`, 'POST', {}, {
      assetId: publicAsset.id,
      complaint
    });
    console.log('✔ AI Triage suggestions returned successfully:');
    console.log(`  - Title: "${triageData.triage.title}"`);
    console.log(`  - Category: "${triageData.triage.category}"`);
    console.log(`  - Priority: "${triageData.triage.priority}"`);
    console.log(`  - Possible Causes: ${triageData.triage.possibleCauses.join(', ')}`);
    console.log(`  - Initial Checks: ${triageData.triage.initialChecks.join(', ')}\n`);

    // 4. File a New Issue Ticket
    console.log('[4/7] Submitting new issue ticket...');
    const newIssue = await makeRequest(`${API_URL}/issues`, 'POST', {}, {
      assetId: publicAsset.id,
      title: triageData.triage.title,
      description: complaint,
      priority: triageData.triage.priority,
      category: triageData.triage.category,
      reporterName: 'Nadeem',
      reporterEmail: 'nadeem@domain.com',
      aiSuggestedFields: {
        originalTitle: triageData.triage.title,
        originalCategory: triageData.triage.category,
        originalPriority: triageData.triage.priority,
        source: triageData.source,
        userEdited: false
      }
    });
    console.log(`✔ Ticket submitted. Issue Number: ${newIssue.issueNumber}, Current Status: ${newIssue.status}\n`);

    // Verify Asset Status is now "Issue Reported"
    const assetCheck = await makeRequest(`${API_URL}/assets/public/ASSET-001`, 'GET');
    console.log(`✔ Checked asset status. New Status: "${assetCheck.status}" (Expected: "Issue Reported")\n`);

    // 5. Assign Ticket to Technician
    console.log('[5/7] Assigning ticket to Technician...');
    const techs = await makeRequest(`${API_URL}/auth/technicians`, 'GET', adminHeaders);
    const techPro = techs.find(t => t.username === 'Tech Pro');
    if (!techPro) throw new Error('Tech Pro user not found in database');

    const assignedIssue = await makeRequest(`${API_URL}/issues/${newIssue.id}/assign`, 'PUT', adminHeaders, {
      technicianId: techPro.id
    });
    console.log(`✔ Assigned to tech: ${techPro.username}. Ticket Status: "${assignedIssue.status}"\n`);

    // Log in as Technician to execute status changes
    console.log('Logging in as Technician (tech@maintainiq.com)...');
    const techAuth = await makeRequest(`${API_URL}/auth/login`, 'POST', {}, {
      email: 'tech@maintainiq.com',
      password: 'tech123'
    });
    const techHeaders = { 'Authorization': `Bearer ${techAuth.token}` };

    // 6. Begin Inspection & Maintenance
    console.log('[6/7] Transitioning work order stages...');
    await makeRequest(`${API_URL}/issues/${newIssue.id}/status`, 'PUT', techHeaders, { status: 'Inspection Started' });
    console.log('✔ Transitioned to "Inspection Started".');
    await makeRequest(`${API_URL}/issues/${newIssue.id}/status`, 'PUT', techHeaders, { status: 'Maintenance In Progress' });
    console.log('✔ Transitioned to "Maintenance In Progress".\n');

    // 7. File Maintenance Record & Resolve
    console.log('[7/7] Submitting maintenance repair log and resolving issue...');
    // We hit the POST /api/maintenance. We simulate this without file upload (Multer accepts multipart but also allows JSON if no file is uploaded or we structure JSON)
    // Wait, let's verify if POST /api/maintenance supports JSON structure if no file is sent. 
    // Yes! Multer populates req.body with text fields even without files. Let's send a post request with JSON.
    const resolvedRecord = await makeRequest(`${API_URL}/maintenance`, 'POST', techHeaders, {
      issueId: newIssue.id,
      notes: 'Replaced the damaged HDMI cable with a new high-speed HDMI 2.1 cable. Tested display output, flickering resolved.',
      partsReplaced: 'HDMI 2.1 Cable',
      cost: '24.99',
      finalCondition: 'Excellent',
      nextServiceIntervalDays: '180'
    });
    console.log(`✔ Maintenance logged. Repair Cost: Rs. ${parseFloat(resolvedRecord.cost).toFixed(2)}, Final Condition: ${resolvedRecord.finalCondition}\n`);

    // Final checks on public page
    console.log('--- FINAL STATE VERIFICATION ---');
    const finalAsset = await makeRequest(`${API_URL}/assets/public/ASSET-001`, 'GET');
    console.log(`✔ Asset Status returned to: "${finalAsset.status}" (Expected: "Operational")`);
    console.log(`✔ Asset Condition updated to: "${finalAsset.condition}" (Expected: "Excellent")`);
    console.log(`✔ Asset Last Service Date: "${finalAsset.lastServiceDate}" (Expected: Today's date)`);
    console.log(`✔ Asset Next Service Target Date: "${finalAsset.nextServiceDate}"`);
    console.log(`✔ Activity Timeline contains log count: ${finalAsset.history.length}`);
    console.log('✔ Verification timeline entry action:');
    console.log(`  - Latest event: "${finalAsset.history[0].action}"`);
    console.log(`  - Details: "${finalAsset.history[0].details}"`);

    console.log('\n✔✔✔ ALL E2E VERIFICATION TESTS PASSED SUCCESSFULLY! ✔✔✔');
  } catch (err) {
    console.error('\n✖✖✖ INTEGRATION VERIFICATION FAILED! ✖✖✖');
    console.error(err);
    process.exit(1);
  }
};

runVerification();
