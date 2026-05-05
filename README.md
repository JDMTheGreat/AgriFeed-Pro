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
