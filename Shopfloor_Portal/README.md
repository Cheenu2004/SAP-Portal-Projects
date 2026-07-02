# Shop Floor Portal

A complete SAP UI5 application for monitoring shop floor activities, built with SAP Fiori design principles.

## Features
- **Secure Login**: Authentication against SAP OData service.
- **Dashboard**: High-level overview with MTD and YTD counts for Planned and Production orders.
- **Planned Orders**: Detailed list with searching, filtering (Month/Year), and responsive table layout.
- **Production Orders**: Detailed list with searching and filtering.

## Project Structure
- `webapp/`: Main application source.
  - `controller/`: JavaScript controllers for MVC architecture.
  - `view/`: XML views for UI components.
  - `model/`: Data models and initialization.
  - `css/`: Custom styling (Glassmorphism and hover effects).
  - `i18n/`: Internationalization strings.
  - `Component.js`: Application component descriptor.
  - `manifest.json`: Configuration and routing.
  - `index.html`: Entry point.

## Technology Stack
- SAP UI5 (latest)
- SAP Fiori 3 (Dark Theme)
- OData Model V2
- MVC Pattern

## How to Run
1. Ensure you have a local web server (e.g., Live Server for VS Code, `npx http-server`, etc.).
2. Open `webapp/index.html` through the server.
3. **Note on CORS**: If running against the remote SAP server `http://AZKTLDS5CP.kcloud.com:8000`, ensure you have a CORS proxy or are running in a browser environment that allows cross-origin requests for development.

## Login Credentials (Default)
- **User ID**: `K1717_SD`
- **Password**: `ADMIN123`
