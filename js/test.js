const { hashPassword, callGAS } = require('./config.js');
const CONFIG = require('./config.js').CONFIG;

async function testBossLogin() {
  const name = '******'; // Must match the NAME in your USERS sheet
  const password = '****'; // The password you want to set/use

  console.log(`--- Starting Auth Test for ${name} ---`);

  try {
    // 1. Generate the hash using your name-salted logic
    const passwordHash = await hashPassword(name, password);
    console.log('Generated Hash:', passwordHash);

    // 2. Call the GAS backend using your shared utility
    const result = await callGAS('auth', {
      name: name,
      passwordHash: passwordHash,
    });

    // 3. Handle results
    if (result.success) {
      console.log('✅ Success!');
      console.log('Role:', result.role);
      console.log('User ID:', result.userId);
      if (result.isNewPassword) {
        console.log('📝 Password registered for the first time.');
      }
    } else {
      console.error('❌ Login Failed:', result.error);
      console.log(
        "Tip: Ensure the user exists in the Sheet with ROLE='boss' and ACTIVE=TRUE",
      );
    }
  } catch (err) {
    console.error('💥 Critical Error:', err.message);
  }
}

async function testUniqueWardFetch() {
  console.log("🧪 Starting Unique Ward Name Test...");

  const SPREADSHEET_ID = CONFIG.SPREADSHEET_ID; 
  const WARD_SHEET_GID = '1031123185'; 

  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${WARD_SHEET_GID}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const csvText = await response.text();
    const lines = csvText.split('\n').slice(1); // Skip Header

    // 1. Create a Set to store unique names
    const uniqueNames = new Set();
    const finalData = [];

    lines.forEach((line) => {
      // Clean up quotes and split by comma
      const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
                       .map(c => c.replace(/^"|"$/g, '').trim());
      
      const wardName = cols[1];

      // 2. Only add if the name exists and hasn't been seen before
      if (wardName && !uniqueNames.has(wardName)) {
        uniqueNames.add(wardName);
        finalData.push({
          id: cols[0],
          name: wardName,
          Group: cols[3] // Assuming column D is status
        });
      }
    });

    console.log("✨ Unique Names Found:", Array.from(uniqueNames));
    console.table(finalData);
    
  } catch (err) {
    console.error("❌ Test Failed:", err.message);
  }
}

testUniqueWardFetch();