const fs = require('fs');
const path = require('path');

async function testApiDirectly() {
    console.log('🧪 Testing Node Backend API directly...\n');

    try {
        // First test the health endpoint
        console.log('1. Testing health endpoint...');
        const healthResponse = await fetch('http://localhost:5000/health');
        if (healthResponse.ok) {
            const healthData = await healthResponse.json();
            console.log('✅ Health check passed:', healthData);
        } else {
            console.log('❌ Health check failed:', healthResponse.status);
            return;
        }

        // Test the API root
        console.log('\n2. Testing API root endpoint...');
        const apiRootResponse = await fetch('http://localhost:5000/api/');
        if (apiRootResponse.ok) {
            const apiRootData = await apiRootResponse.json();
            console.log('✅ API root accessible:', apiRootData);
        } else {
            console.log('❌ API root failed:', apiRootResponse.status);
            return;
        }

        // Test the generate-designs endpoint with a simple form
        console.log('\n3. Testing /api/generate-designs endpoint...');
        
        // Create a minimal form data
        const formData = new FormData();
        formData.append('industry', 'fitness');
        formData.append('platform', 'instagram');
        formData.append('brandName', 'TestBrand');
        formData.append('headline', 'Test Headline');
        formData.append('ctaText', 'Shop Now');
        
        // Create a minimal image blob
        const canvas = new OffscreenCanvas(1, 1);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'red';
        ctx.fillRect(0, 0, 1, 1);
        const blob = await canvas.convertToBlob({ type: 'image/png' });
        
        formData.append('productImage', blob, 'test.png');

        const generateResponse = await fetch('http://localhost:5000/api/generate-designs', {
            method: 'POST',
            body: formData
        });

        console.log('Response status:', generateResponse.status);
        console.log('Response headers:', Object.fromEntries(generateResponse.headers.entries()));

        if (generateResponse.ok) {
            const generateData = await generateResponse.json();
            console.log('✅ Generate API works!');
            console.log('Response:', generateData);
        } else {
            const errorText = await generateResponse.text();
            console.log('❌ Generate API failed');
            console.log('Error:', errorText);
        }

    } catch (error) {
        console.log('❌ Test failed with error:', error.message);
    }
}

testApiDirectly().catch(console.error);