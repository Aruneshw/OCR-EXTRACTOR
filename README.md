# OCR-EXTRACTOR

**Made by Aruneshwaran K**

Restoration Engine v4.2 - High-Fidelity Document Reconstruction & OCR Engine. This application allows users to upload images, process them, and extract text using AI to create structured Google Docs.

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in `.env` to your Gemini API key
3. Run the app:
   `npm run dev`

## GitHub Pages Deployment

The file structure is optimized for GitHub Pages deployment. The `vite.config.ts` includes the correct `base` path (`/OCR-EXTRACTOR/`). 

To deploy to GitHub Pages:
1. Build the project: `npm run build`
2. The output will be in the `dist` folder.
3. You can use GitHub Actions to deploy the `dist` folder directly to GitHub Pages.

**Important Note for Deployment:**
Ensure your Gemini API Key and Firebase configurations are properly set in your production environment if required by the hosting service.
