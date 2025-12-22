import { Router, Request, Response } from 'express';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import { upload } from '../middleware/upload';
import { getTrendProfile } from '../trend/knowledgeBase';

const router = Router();

router.post('/generate-designs', upload.single('productImage'), async (req: Request, res: Response) => {
  try {
    const { industry, platform, brandName, headline, ctaText, template } = req.body;
    
    // Validate required fields
    if (!industry || !platform || !req.file) {
      return res.status(400).json({ 
        error: 'Missing required fields: industry, platform, and productImage are required' 
      });
    }

    console.log(`[Generate] Starting generation for ${industry}/${platform}`);

    // Get trend profile from MongoDB
    const trendProfile = await getTrendProfile(industry);
    if (!trendProfile) {
      return res.status(404).json({ 
        error: `No trend profile found for industry: ${industry}` 
      });
    }

    console.log(`[Generate] Found trend profile for ${industry}`);

    // Prepare form data for Python API
    const pythonFormData = new FormData();
    pythonFormData.append('industry', industry);
    pythonFormData.append('platform', platform);
    pythonFormData.append('trend_profile', JSON.stringify({
      industry: trendProfile.industry,
      platform: platform,
      topColors: trendProfile.topColors || [],
      dominantLayouts: trendProfile.dominantLayouts || [],
      creativeTypes: trendProfile.creativeTypes || [],
      topKeywords: trendProfile.topKeywords || []
    }));

    // Add optional fields
    if (brandName) pythonFormData.append('brand_name', brandName);
    if (headline) pythonFormData.append('headline', headline);

    // Add product image
    pythonFormData.append('product_image', fs.createReadStream(req.file.path), {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });

    const pythonUrl = process.env.PYTHON_AI_URL || 'http://localhost:8000';
    console.log(`[Generate] Calling Python API at ${pythonUrl}/generate`);

    // Call Python API
    const pythonResponse = await axios.post(`${pythonUrl}/generate`, pythonFormData, {
      headers: {
        ...pythonFormData.getHeaders()
      },
      timeout: 300000, // 5 minutes timeout
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    console.log(`[Generate] Python API response:`, pythonResponse.data);

    // Clean up uploaded file
    try {
      fs.unlinkSync(req.file.path);
    } catch (cleanupError) {
      console.warn(`[Generate] Could not clean up uploaded file: ${cleanupError}`);
    }

    // Return response
    res.json(pythonResponse.data);

  } catch (error: any) {
    console.error('[Generate] Error:', error.message);
    
    // Clean up uploaded file on error
    if (req.file?.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.warn(`[Generate] Could not clean up uploaded file: ${cleanupError}`);
      }
    }

    if (error.response) {
      // Python API returned an error
      return res.status(error.response.status || 500).json({
        error: 'Python API error',
        details: error.response.data?.error || error.message
      });
    }

    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        error: 'Python AI service is not available',
        details: 'Make sure the Python service is running on port 8000'
      });
    }

    res.status(500).json({
      error: 'Generation failed',
      details: error.message
    });
  }
});

export default router;