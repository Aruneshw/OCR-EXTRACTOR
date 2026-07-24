# OCR-EXTRACTOR

**Made by Aruneshwaran K**

Document Restoration Engine 🔧📄 — it uses AI (Vision Transformer + Gemini API) to reconstruct damaged or unclear document images and extract text via OCR. Just upload a photo, and it rebuilds high-fidelity output, then exports as PDF, PNG, or text. Basically turning broken scans into clean, readable documents automatically.

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
