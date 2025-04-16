// server.js - Express server for SixthSenseAI app with Gemini AI integration
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Set up CORS for client access
app.use(cors());
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Set up file upload with multer
const storage = multer.memoryStorage(); // Use memory storage for Vercel
const upload = multer({ storage: storage });

// Initialize Gemini AI
function initGeminiAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY not found in environment variables');
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
}

// Helper function to convert file to base64
function fileToGenerativePart(buffer, mimeType) {
  return {
    inlineData: {
      data: buffer.toString("base64"),
      mimeType
    },
  };
}

// Endpoint to analyze image using Gemini AI
app.post('/api/analyze-image', upload.single('image'), async (req, res) => {
  try {
    console.log('Image analysis request received');
    
    const genAI = initGeminiAI();
    if (!genAI) {
      console.error('Gemini AI initialization failed - API key may be invalid');
      return res.status(500).json({ 
        error: 'Gemini AI not initialized. Check API key configuration.' 
      });
    }

    if (!req.file) {
      console.error('No image file received in request');
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const buffer = req.file.buffer;
    const mimeType = req.file.mimetype;
    
    console.log(`Processing image, type: ${mimeType}`);

    // Create prompt specifically for blind users
    const prompt = `Describe this image in complete detail for a blind person who needs to understand their surroundings. 

IMPORTANT GUIDELINES:
1. Start with the most important elements and overall context (indoor/outdoor, day/night)
2. THOROUGHLY describe the background and all surroundings - include ALL visible elements regardless of size or perceived importance
3. Describe spatial relationships with precise directions (left, right, behind, in front, above, below, 10 feet away, etc.)
4. Mention specific colors, textures, materials, lighting conditions, and dimensions where possible
5. Include ALL details about people, objects, text, signs, potential hazards, and paths for navigation
6. Use spatial language that would help with orientation and navigation (e.g., "to your left is a doorway approximately 5 feet away")
7. Describe the entire environment including floors, walls, ceilings, and distant objects
8. Include ambient details like lighting, shadows, weather conditions, and atmosphere
9. Prioritize information that would help someone navigate the space safely
10. Use detailed, descriptive language without technical jargon
11. DO NOT mention that this is a photo - describe it as if you're explaining what's physically around them

Respond ONLY with the detailed description, without any introduction, conclusion or explanations.`;

    // Get the Gemini model
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-pro",
        generationConfig: {
            temperature: 0.2,  // Lower temperature for more detailed, factual descriptions
            maxOutputTokens: 2048,
        }
    });

    // Convert image to base64
    const imagePart = fileToGenerativePart(buffer, mimeType);

    // Generate content
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    // Clean up the response
    const cleanedText = text.trim();

    // Send response
    res.json({ description: cleanedText });

  } catch (error) {
    console.error('Error processing image:', error);
    res.status(500).json({ error: 'Error processing image' });
  }
});

// Handle all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

// Export for Vercel
module.exports = app; 