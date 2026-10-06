# IBima Assist – Admin Portal

React (Vite) + antd + Tailwind. Runs on **http://localhost:5200**.

```bash
npm install
npm run dev
```

**Login:** `superadmin@ibima.com` (or `9876543210`) / `Admin@123` + captcha.

## Data
No backend yet. All data is seeded from `src/data/seed.js`, `src/data/roles.js` and `src/data/modules.js`
and saved in the browser's localStorage (`src/store/AdminStore.jsx`).
Sidebar profile menu → **Reset sample data** restores it.

## Screens (every sidebar item)
| Group | Screens |
|---|---|
| Main | Dashboard, Active Users |
| User Management | Create Users (role-specific form, Modify user, Add Role), Roles & Permissions, Password Reset, User Activation |
| Service Configuration | Branches/Offices, Document Templates, Communication Setup (Stage Wise Matrix / Templates / Channels / Communication Logs) |
| Claim Configuration | Claim Flow (journey + stage TAT/rules/comm triggers), Approval Logic (Logic Matrix / Authority Matrix / History), Recommendation Engine, Allocation Load |
| Fraud & Controls | Fraud Routing, Fraud Trigger Rules (with simulator), Trigger History |
| Reports & Analytics | Claim Report, User Report, SaaS Usage Report, Data Download |
| System | Audit Logs, System Settings (API Integration / System Update / Audit & Compliance) |

## How pages connect (for testing)
- Create / activate users → User Activation, Password Reset, Roles "Users In Role", Dashboard, Active Users, User Report.
- Approval Logic rules = Dashboard's Approval Logic Matrix; edits stay **Draft** until "Publish changers" → History tab.
- Fraud rules / triggers → Dashboard Fraud Summary, Fraud Routing cards + Open Trigger Queue; Trigger History status changes update both.
- Allocation Load "Reasigned" moves open claims between handlers → Dashboard handler load + Claim Report.
- Claim Journey (Dashboard) is the same component/config on Claim Flow.
- Every change (toggles, saves, publishes, resets, exports, retries) → Recent Configuration Changes, the bell, and **Audit Logs**.
- Data Download builds real CSV / Excel / JSON files from the stored data.
