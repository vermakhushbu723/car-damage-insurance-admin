# IBima Assist – Admin Portal

React (Vite) + antd + Tailwind. Runs on **http://localhost:5200**.

```bash
npm install
npm run dev
```

**Login:** `superadmin@ibima.com` (or `9876543210`) / `Admin@123` + captcha.

## Data
No backend yet. All data is seeded from `src/data/seed.js` + `src/data/roles.js` and saved in the
browser's localStorage (`src/store/AdminStore.jsx`). Sidebar profile menu → **Reset sample data** restores it.

## Screens built
| Menu | Route |
|---|---|
| Dashboard | `/dashboard` |
| Active Users | `/active-users` |
| Create Users (role-specific form, Modify user, Add Role) | `/users/create` (`?role=<key>`, `?edit=<userId>`) |
| Roles & Permissions | `/roles-permissions` |
| Password Reset | `/password-reset` |
| User Activation | `/user-activation` |
| Branches/Offices | `/branches` |
| Document Templates | `/document-templates` |
| Communication Setup | `/communication-setup` |

Every other sidebar item routes to a "coming soon" page until its design is shared
(add the page in `src/routes/AppRoutes.jsx` → `PAGES`).

## How pages connect (for testing)
- Create a user → shows in User Activation, Password Reset, Roles "Users In Role", dashboard counts / handler load.
- User Activation status change → Active Users count + role bars update.
- Roles & Permissions "Add User" → Create Users with that role preselected; "Add Role" in Create Users adds a new role tab.
- Branches → "Assigned Branch" for CSM/Handler and "Used By N Branches" on templates.
- Every config change (toggles, journey save, permissions, status, resets) → Recent Configuration Changes + bell.
