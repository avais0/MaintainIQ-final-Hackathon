const express = require('express');
const router = express.Router();
const { Asset, Issue } = require('../models');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// POST /api/ai/triage
router.post('/triage', async (req, res) => {
  const { assetId, complaint } = req.body;

  if (!assetId || !complaint) {
    return res.status(400).json({ error: 'Asset ID and complaint description are required.' });
  }

  try {
    // 1. Fetch asset details & recent issues
    const asset = await Asset.findByPk(assetId);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found.' });
    }

    const recentIssues = await Issue.findAll({
      where: { assetId },
      limit: 5,
      order: [['createdAt', 'DESC']],
      attributes: ['title', 'category', 'priority', 'status', 'createdAt']
    });

    const assetContext = {
      name: asset.name,
      category: asset.category,
      location: asset.location,
      condition: asset.condition,
      status: asset.status,
      recentIssues: recentIssues.map(i => ({
        title: i.title,
        status: i.status,
        date: i.createdAt
      }))
    };

    // 2. Try using Gemini AI if key is configured
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'YOUR_GEMINI_API_KEY') {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          generationConfig: {
            responseMimeType: 'application/json'
          }
        });

        const prompt = `
You are the AI triage system for MaintainIQ, a maintenance and asset management platform.
Your job is to analyze a user's complaint about a specific asset, take the asset's current condition and issue history into account, and generate structured diagnostic data.

Asset Context:
- Name: ${assetContext.name}
- Category: ${assetContext.category}
- Location: ${assetContext.location}
- Current Condition: ${assetContext.condition}
- Current Status: ${assetContext.status}
- Recent Issue History: ${JSON.stringify(assetContext.recentIssues)}

User Complaint:
"${complaint}"

Please generate a JSON object with the following fields:
1. "title": A professional, concise, and summary-style title for the issue.
2. "category": A suggested maintenance category (e.g., HVAC, IT, Plumbing, Electrical, Furniture, Appliance).
3. "priority": Recommended priority (must be one of: "Low", "Medium", "High", "Critical"). If there are electrical risks, safety concerns, water leakages near electricity, or critical business blockers, make it "High" or "Critical".
4. "possibleCauses": An array of 2-4 strings listing likely causes for the reported problem.
5. "initialChecks": An array of 2-4 strings listing safe, actionable initial diagnostic checks the reporter or technician can perform. NOTE: Never instruct the reporter to open high-voltage panels or perform dangerous physical actions. Clearly warn them to contact a qualified technician for critical safety matters.
6. "recurringPatternWarning": A string representing a warning if this asset has suffered from similar or multiple issues recently. If history suggests a pattern, note it (e.g. "Warning: This is the 3rd time a display issue is reported on this unit"). If no pattern exists, return an empty string.

Ensure the response is valid JSON.
`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const aiData = JSON.parse(responseText);

        return res.json({
          source: 'Gemini AI',
          triage: {
            title: aiData.title || `Issue with ${asset.name}`,
            category: aiData.category || asset.category,
            priority: aiData.priority || 'Medium',
            possibleCauses: aiData.possibleCauses || ['Underlying system issue'],
            initialChecks: aiData.initialChecks || ['Inspect unit physically', 'Report changes to technician'],
            recurringPatternWarning: aiData.recurringPatternWarning || ''
          }
        });
      } catch (aiError) {
        console.error('Gemini API call failed, falling back to mock classifier:', aiError);
      }
    }

    // 3. Fallback Smart Mock Classifier
    const lowerComplaint = complaint.toLowerCase();
    let title = `Unscheduled Maintenance for ${asset.name}`;
    let category = asset.category;
    let priority = 'Medium';
    let possibleCauses = ['General wear and tear', 'Component failure'];
    let initialChecks = ['Check if unit is powered on', 'Inspect for physical damage'];
    let recurringPatternWarning = '';

    // Simple rule-based triage matching common keywords (including Roman Urdu translations)
    if (
      lowerComplaint.includes('flicker') || 
      lowerComplaint.includes('hdmi') || 
      lowerComplaint.includes('screen') || 
      lowerComplaint.includes('display') ||
      lowerComplaint.includes('tasveer') ||
      lowerComplaint.includes('chalta') ||
      lowerComplaint.includes('screen tuta')
    ) {
      title = 'Display flicker / connectivity issue';
      category = 'IT / AV Support';
      priority = 'Medium';
      possibleCauses = ['Loose HDMI cable', 'Damaged display port', 'Internal component overheating'];
      initialChecks = ['Unplug and re-seat the HDMI cable', 'Try connecting another device', 'Check for hardware updates'];
    } else if (
      lowerComplaint.includes('leak') || 
      lowerComplaint.includes('water') || 
      lowerComplaint.includes('pipe') ||
      lowerComplaint.includes('pani') ||
      lowerComplaint.includes('tapakh')
    ) {
      title = 'Liquid leak detected';
      category = 'Plumbing / HVAC';
      priority = 'High';
      possibleCauses = ['Clogged drain pipe', 'Failed sealing gasket', 'Condensation build-up'];
      initialChecks = [
        'Place a container under the leak',
        'Turn off the unit if water is near electrical components',
        'Inspect drainage tubes'
      ];
    } else if (
      lowerComplaint.includes('noise') || 
      lowerComplaint.includes('sound') || 
      lowerComplaint.includes('loud') ||
      lowerComplaint.includes('awaz') ||
      lowerComplaint.includes('shor') ||
      lowerComplaint.includes('khat khat')
    ) {
      title = 'Abnormal noise during operation';
      category = 'Mechanical / HVAC';
      priority = 'Low';
      possibleCauses = ['Loose mechanical mounting', 'Worn bearing or fan belt', 'Debris lodged in motor'];
      initialChecks = ['Power off and inspect fan area', 'Verify screws and mounts are tight'];
    } else if (
      lowerComplaint.includes('power') || 
      lowerComplaint.includes('turn on') || 
      lowerComplaint.includes('dead') ||
      lowerComplaint.includes('band') ||
      lowerComplaint.includes('current') ||
      lowerComplaint.includes('bijli') ||
      lowerComplaint.includes('on nahi') ||
      lowerComplaint.includes('kharab')
    ) {
      title = 'Power failure / won\'t turn on';
      category = 'Electrical';
      priority = 'High';
      possibleCauses = ['Tripped circuit breaker', 'Blown internal fuse', 'Damaged power cord'];
      initialChecks = ['Check wall outlet with another device', 'Inspect power cord plug', 'Verify circuit breaker state'];
    }

    // Smart history pattern checks
    if (recentIssues.length >= 2) {
      const activeCount = recentIssues.filter(i => i.status !== 'Closed' && i.status !== 'Resolved').length;
      recurringPatternWarning = `Warning: This asset has ${recentIssues.length} issues in recent logs, with ${activeCount} currently unresolved. This suggests a recurring pattern or major system fatigue.`;
    }

    res.json({
      source: 'Local Fallback Engine (No API Key Configured)',
      triage: {
        title,
        category,
        priority,
        possibleCauses,
        initialChecks,
        recurringPatternWarning
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
