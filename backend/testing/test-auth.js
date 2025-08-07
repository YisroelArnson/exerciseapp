const http = require('http');

const API_BASE = 'http://localhost:3000/api/auth';

function makeRequest(path, method, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/auth${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function testAuth() {
  console.log('🔍 Testing Authentication API...\n');

  const testEmail = `test${Date.now()}@example.com`;
  const testPassword = 'testpass123';

  console.log('📧 Test Email:', testEmail);
  console.log('🔑 Test Password:', testPassword);
  console.log('');

  // Test Register
  console.log('📝 Testing Register...');
  try {
    const registerResult = await makeRequest('/register', 'POST', {
      email: testEmail,
      password: testPassword
    });
    
    console.log('✅ Register Status:', registerResult.status);
    console.log('✅ Register Response:', JSON.stringify(registerResult.data, null, 2));
    console.log('');
  } catch (error) {
    console.log('❌ Register Error:', error.message);
    console.log('');
  }

  // Test Login
  console.log('🔐 Testing Login...');
  try {
    const loginResult = await makeRequest('/login', 'POST', {
      email: testEmail,
      password: testPassword
    });
    
    console.log('✅ Login Status:', loginResult.status);
    console.log('✅ Login Response:', JSON.stringify(loginResult.data, null, 2));
    console.log('');
  } catch (error) {
    console.log('❌ Login Error:', error.message);
    console.log('');
  }

  // Test with missing fields
  console.log('🧪 Testing Missing Fields...');
  try {
    const missingResult = await makeRequest('/register', 'POST', {
      email: 'missing@example.com'
    });
    
    console.log('✅ Missing Fields Status:', missingResult.status);
    console.log('✅ Missing Fields Response:', JSON.stringify(missingResult.data, null, 2));
    console.log('');
  } catch (error) {
    console.log('❌ Missing Fields Error:', error.message);
    console.log('');
  }

  console.log('🎉 Tests completed!');
}

// Check if server is running first
const checkServer = http.get('http://localhost:3000', (res) => {
  console.log('✅ Server is running');
  testAuth();
});

checkServer.on('error', (error) => {
  console.log('❌ Server not running or connection failed');
  console.log('');
  console.log('💡 Make sure to start the server first:');
  console.log('   npm run dev');
  console.log('');
  console.log('💡 Or start directly:');
  console.log('   node server.js');
});