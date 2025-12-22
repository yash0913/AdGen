const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testCompleteFlow() {
  console.log('🧪 Testing Complete API Flow...\n');
  
  try {
    // 1. Test Node Backend Health
    console.log('1️⃣  Testing Node backend (port 5000)...');
    try {
      const nodeHealth = await axios.get('http://localhost:5000/health', { timeout: 5000 });
      console.log('✅ Node backend: OK');
    } catch (error) {
      console.log('❌ Node backend: Failed -', error.message);
      console.log('   Please start: cd backend/node && npm run dev');
      return;
    }

    // 2. Test Python Backend Health
    console.log('2️⃣  Testing Python backend (port 8000)...');
    try {
      const pythonHealth = await axios.get('http://localhost:8000/health', { timeout: 10000 });
      console.log('✅ Python backend: OK');
      console.log('   Generator ready:', pythonHealth.data.generator_ready);
    } catch (error) {
      console.log('❌ Python backend: Failed -', error.message);
      console.log('   Please start: cd backend/python && python run.py');
      return;
    }

    // 3. Test Frontend-to-Node API Flow
    console.log('3️⃣  Testing frontend-to-Node API flow...');
    
    // Create a simple test image (1x1 pixel PNG)
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG header
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 dimensions
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 
      0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, // IDAT chunk
      0x54, 0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x37, 0x6E, 0xF9, 0x24, 0x00, 0x00,
      0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42,
      0x60, 0x82 // PNG end
    ]);

    const formData = new FormData();
    formData.append('industry', 'fitness');
    formData.append('platform', 'instagram');
    formData.append('brandName', 'TestBrand');
    formData.append('headline', 'Test Headline');
    formData.append('ctaText', 'Shop Now');
    formData.append('productImage', testImageBuffer, {
      filename: 'test.png',
      contentType: 'image/png'
    });

    try {
      const response = await axios.post(
        'http://localhost:5000/api/generate-designs', 
        formData,
        {
          headers: formData.getHeaders(),
          timeout: 60000
        }
      );

      console.log('✅ Frontend → Node → Python flow: SUCCESS');
      console.log('   Response received:', response.data.ok || response.data.status);
      
      if (response.data.images && response.data.images.length > 0) {
        console.log('   Generated images:', response.data.images.length);
        console.log('   Image paths:', response.data.images);
        
        // Check if outputs folder has files
        const outputsPath = path.join(__dirname, 'backend/node/outputs');
        if (fs.existsSync(outputsPath)) {
          const files = fs.readdirSync(outputsPath);
          console.log('   Files in outputs folder:', files.length);
        }
      }
      
    } catch (error) {
      console.log('❌ API Flow: Failed');
      if (error.response) {
        console.log('   Status:', error.response.status);
        console.log('   Error:', error.response.data);
      } else {
        console.log('   Error:', error.message);
      }
    }

    // 4. Test Static File Serving
    console.log('4️⃣  Testing static file serving...');
    try {
      const staticTest = await axios.get('http://localhost:5000/outputs/', { timeout: 5000 });
      console.log('✅ Static file serving: Accessible');
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('✅ Static file serving: Configured (no files yet)');
      } else {
        console.log('❌ Static file serving: Issue -', error.message);
      }
    }

  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }
}

// Run the test
testCompleteFlow().then(() => {
  console.log('\n🏁 Test completed!');
}).catch(console.error);