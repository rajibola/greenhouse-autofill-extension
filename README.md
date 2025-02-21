# **Greenhouse Application Autofiller Chrome Extension**

A Chrome extension that automatically fills out job applications on Greenhouse with your personal and professional information.


## Features
- Automatically fills common application fields (name, email, phone, etc.)
- Supports resume upload
- Handles education and work experience details
- Works across all Greenhouse-hosted job application forms

## Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd greenhouse-autofill-extension
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
4. Build the extension:
   ```bash
   npm run build
   ```
6. Load the extension in Chrome:
   - Open Chrome and go to chrome://extensions/
   - Enable "Developer mode" in the top right
   - Click "Load unpacked"
   - Select the dist folder from the project directory

## Usage
- Click the extension icon in your Chrome toolbar while on a Greenhouse job application page
- Upload your resume (supported formats: PDF, DOC, DOCX)
- Click "Autofill Application" to automatically populate the form fields
- Review the filled information and make any necessary adjustments
- Submit your application through the website as normal

## Development
- Run development server:
  ```bash
  npm run dev
  ```
- Build for production:
    ```bash
  npm run build
  ```
- Lint code:
    ```bash
  npm run lint
  ```

## Technology Stack
- React 18
- TypeScript
- Tailwind CSS
- Vite
- Chrome Extension Manifest V3

## Project Structure
The main components are:
- `App.tsx` - Extension popup interface
- `content.tsx` - Content script for form autofilling
- `manifest.json` - Chrome extension configuration


