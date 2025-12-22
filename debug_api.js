const FormData = require('form-data');
const axios = require('axios');

async function testDirectApiCall() {
  console.log('🔍 Testing Direct API Call to Node Backend...\n');

  // Create form data exactly like frontend does
  const formData = new FormData();
  formData.append('industry', 'fitness');
  formData.append('platform', 'instagram');
  formData.append('brandName', 'TestBrand');
  formData.append('headline', 'Test Headline');
  formData.append('ctaText', 'Shop Now');
  
  // Create a simple test image
  const testImageBuffer = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
    0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
    0x54, 0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x37, 0x6E, 0xF9, 0x24, 0x00, 0x00,
    0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42,
    0x60, 0x82
  ]);
  
  formData.append('productImage', testImageBuffer, {
    filename: 'test.png',
    contentType: 'image/png'
  });

  try {
    console.log('Making POST request to: http://localhost:5000/api/generate-designs');
    console.log('Form data fields:', Object.keys(formData._streams || {}));
    
    const response = await axios.post(
      'http://localhost:5000/api/generate-designs',
      formData,
      {
        headers: formData.getHeaders(),
        timeout: 30000
      }
    );
    
    console.log('✅ SUCCESS! Response:', response.status);
    console.log('Response data:', response.data);
    
  } catch (error) {
    console.log('❌ FAILED!');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Status text:', error.response.statusText);
      console.log('Data:', error.response.data);
      console.log('Headers:', error.response.headers);
    } else if (error.request) {
      console.log('No response received');
      console.log('Request error:', error.message);
    } else {
      console.log('Error:', error.message);
    }
  }
}

// Test URL resolution logic from frontend
function testUrlResolution() {
  console.log('\n🔍 Testing URL Resolution Logic...\n');
  
  // Simulate frontend environment
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
  console.log('API_BASE:', API_BASE || '(empty)');
  
  function resolveUrl(path) {
    if (/^https?:\/\//i.test(path)) return path
    if (API_BASE) {
      // If caller passes '/api/xyz', drop the '/api' prefix when joining with API_BASE which already contains it.
      if (path.startsWith("/api/")) return `${API_BASE}${path.replace(/^\/api/, "")}`
      return `${API_BASE}${path}`
    }
    return path // rely on Next.js rewrites
  }
  
  const inputPath = '/api/generate-designs';
  const resolvedUrl = resolveUrl(inputPath);
  
  console.log('Input path:', inputPath);
  console.log('Resolved URL:', resolvedUrl);
  console.log('Should be:', 'http://localhost:5000/api/generate-designs (via Next.js rewrite)');
}

testUrlResolution();
testDirectApiCall().catch(console.error);