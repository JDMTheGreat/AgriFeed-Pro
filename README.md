# 🌾 AgriFeed Pro (Beta)

**Precision Margin Management for the Modern Producer**

AgriFeed Pro is a lightweight, secure dashboard designed to help farmers and ranchers move away from manual spreadsheets. It provides a real-time "Snapshot" of farm profitability by linking feed costs directly to animal production revenue.

---

## 🚀 Key Features

*   **Secure Farm Profiles:** Individual accounts via Firebase Auth so your data stays private.
*   **Warehouse Management:** Track ingredient inventory levels and average cost-per-pound.
*   **Population Tracking:** Monitor specific pens or groups with unique revenue targets.
*   **Live Feed Logs:** Record daily deliveries; inventory levels auto-adjust upon entry.
*   **Net Profit Analysis:** Visual breakdown of "Daily Burn Rate" and Net Margin per head.
*   **Data Export:** Download full feeding reports as `.CSV` files for accountants or nutritionists.

## 🛠️ Technology Stack

*   **Frontend:** React.js (Vite)
*   **Styling:** Tailwind CSS (Cyber-Agriculture Theme)
*   **Icons:** Lucide-React
*   **Backend/Database:** Firebase Firestore & Authentication
*   **Deployment:** Vercel / GitHub Pages

## 🧪 How to Use (Beta Testers)

1.  **Initialize:** Create a profile with your Farm Name.
2.  **Stock the Warehouse:** Add your current feed ingredients and their costs.
3.  **Define Populations:** Create a "Pen" and set the expected daily revenue (e.g., milk check or weight gain value) and fixed overhead.
4.  **Log a Feeding:** Use the "Feed Logs" tab to record what you fed each pen.
5.  **Check Margins:** View the "Net Profit" tab to see if that pen was profitable today.

---

## 📬 Feedback & Bug Reports

This is an early-stage Beta. If you find calculations that don't add up or the interface behaves strangely on your device, please open an **Issue** on this repository or contact the developer.

**Planned Updates:**
- [ ] Multi-unit support (Tons, Kg, Lbs)
- [ ] Historical trend charts for feed costs
- [ ] Inventory "Low Stock" alerts


Dev Log: May 4, 2026

Status: Production build live on Vercel.

Database: Firestore initialized (Test Mode).

Current appId: agrifeed-pro-v1

Features Added: Delete confirmations, Feed Logging logic, and Net Profit margin calculations.

Next Steps: Test mobile UI with wife; lock down Firebase Security Rules; implement team-sharing.

Dev Log: May 5, 2026
Status: Alpha Access Control stabilized.

Security: Implemented Whitelist Validation via Firestore authorized_users collection. New sign-ups now require pre-approval at the database level.

Legal/Compliance: Integrated Beta Testing Agreement (BTA) modal into the onboarding workflow; added mandatory checkbox for user consent prior to account creation.

Bug Fixes:

Corrected JSX nesting issues where the BTA modal was orphaning code.

Resolved field typos in the Auth handler (Pasword -> password).

Standardized lowercase email handling to prevent whitelist bypass via casing.

Next Steps:

Firebase Security Rules: Transition Firestore from "Test Mode" to locked-down rules that enforce request.auth.uid matches.

Mobile UI Field Test: Walk the facility floor to test button hit-boxes and readability in high-glare environments.

Data Export: Build a simple CSV generator for "Warehouse" totals.

🛠 Development Update: May 8, 2026
🔒 Security & Secrets Management
The project has moved to a Zero-Secret repository architecture. All sensitive configuration data is now handled via environment variables to ensure the codebase can be made public or shared with collaborators without compromising backend security.

Environment Variables: Migrated Firebase configuration to .env files. The application now utilizes import.meta.env to load credentials at runtime.

API Key Rotation: Revoked and rotated all previously exposed API keys. New keys are restricted via HTTP Referrer policies to only allow traffic from the production domain and local development environments.

Git Integrity: Updated .gitignore to prevent the accidental tracking of environment files. Cleaned Git cached history to ensure no legacy credentials remain in the commit metadata.

Domain Authorization: Hardened Firebase Authentication settings to strictly whitelist approved deployment subdomains, preventing unauthorized login requests from external referrers.

🚀 Production & Deployment
Vercel Integration: Successfully configured production environment variables in the Vercel dashboard. The CI/CD pipeline is now verified and functional without requiring secrets in the source code.

Build Analysis: Optimized chunking logic to handle Firebase library overhead; confirmed production build stability and deployment via the Vercel edge network.

📋 Technical Roadmap
[x] Real-time Feed & Group Tracking logic

[x] Alpha Whitelist Authorization

[x] Environment Variable Migration

[x] API Key Restriction & Referrer Policies

[ ] Next: Implementation of Granular Firestore Security Rules (Production Mode).

[ ] Next: Development of CSV/PDF reporting modules for inventory audits.

📦 Setup for Developers
To run this project locally:

Clone the repository.

Create a .env file in the root directory.

Populate it with the required VITE_FIREBASE_ credentials (contact the project owner for the template).

Run npm install followed by npm run dev.

🖋 Dev Log: May 8, 2026
Status: Security Hardening Complete.
Architecture: Decoupled config from source.
Current Build: v1.0.4-alpha

This abbreviated dev log is perfect for a README.md. It highlights the pivot from a monolithic structure to a modular architecture, which is a big "pro" for any software project.

🛠 Dev Log: Alpha Phase (V1.0.x)
[2026-05-10] Component Migration & State Integration
Refactor: Migrated monolithic Dashboard logic into a dedicated /components/Dashboard.jsx module to improve maintainability and UI scalability.

State Sync: Successfully mapped global inventory and logs state from App.jsx to the Dashboard via props.

Logic Update: Implemented reduce methods within the Dashboard to dynamically calculate total warehouse weight and estimated burn rates across multiple inventory items.

UI/UX: Fixed nesting issues in the main navigation container and standardized input field visibility with text-white utility classes.

[2026-05-08] Security & Whitelisting
Auth: Integrated Firebase Authentication with a custom "Alpha Whitelist" gate. Users must be pre-approved in the authorized_users Firestore collection to register.

Legal: Added Beta Testing Agreement (BTA) modal to the signup flow to ensure compliance during the Alpha testing phase.

[2026-05-01] Core Logic Engine
Data Model: Established Firestore schema for inventory, groups (pens/houses), and logs.

Margin Analysis: Built the first iteration of the "Net Profit" engine, which subtracts real-time feed consumption costs from projected head-count revenue.

🚀 Current Tech Stack
Frontend: React (Vite)

Styling: Tailwind CSS

Icons: Lucide-React

Backend/DB: Firebase Auth & Firestore

Deployment: Vercel