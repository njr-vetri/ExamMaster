const dotenv = require('dotenv');
const fs = require('fs');

const envConfig = dotenv.parse(fs.readFileSync('c:/Projects/ai-mock-exam-full/.env'));
console.log('Parsed JSON string length:', envConfig.FIREBASE_SERVICE_ACCOUNT_JSON.length);
try {
  const parsed = JSON.parse(envConfig.FIREBASE_SERVICE_ACCOUNT_JSON);
  console.log('Private key has literal newlines?', parsed.private_key.includes('\n'));
  console.log('Private key first 30 chars:', parsed.private_key.substring(0, 30));
} catch (e) {
  console.error('Parse error:', e.message);
}
