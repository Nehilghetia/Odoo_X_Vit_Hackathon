# ReimburseFlow - Intelligent Expense Management 🚀

ReimburseFlow is a modern, full-stack enterprise reimbursement system built entirely on the Next.js App Router. It removes the friction from expense reporting using AI-driven intelligent text parsing, real-time multi-currency conversions, and sophisticated hierarchical approval workflows seamlessly packaged in a beautiful glassmorphic UI.

## ✨ Key Features
*   **Role-Based Hierarchies:** Strict access controls and dedicated interfaces for **Admins**, **Managers**, and **Employees**.
*   **Smart Receipt OCR:** Instantly drop a receipt to automatically scan the total amount, expense date, merchant, and mathematically deduce its category and tags without external computer-vision API dependencies.
*   **Live Currency Conversion:** Integrated with live exchange rate APIs to accurately convert global travel spending into your company's native currency on the fly.
*   **Dynamic Approval Routing:** Workflows adapt to organizational rules. Managers approve first, then seamlessly pass the baton to the Finance Admin for final settlement.
*   **Responsive Analytics:** Sleek, animated dashboard widgets, interactive charts using Recharts, and highly functional data tables heavily optimized for mobile and desktop screens.

## 🛠 Tech Stack
*   **Framework:** Next.js 15 (App Router, Server Actions, React 19)
*   **Styling:** Tailwind CSS + custom UI with Glassmorphism techniques
*   **Database:** MongoDB via Mongoose
*   **Iconography:** Lucide-React 
*   **Authentication:** Custom JWT-based stateless cookies

---

## 💻 Local Quickstart

### 1. Environment Setup
Create a `.env.local` file at the root of the project with the following keys:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/your-db
JWT_SECRET=super_secret_jwt_key_here
PORT=3000
```
*(Note: You do not need to configure an external OCR service or Database API; the smart parser runs locally and seamlessly!)*

### 2. Installation & DB Seeding
Install dependencies and wipe/seed the database with pre-configured logical data.
**Note:** This project utilizes Node 24 native `--env-file` integration built right into the `npm run seed` script!

```bash
# Install packages
npm install

# Wipe database and inject clean test data
npm run seed
```

### 3. Run Development Server
```bash
npm run dev
```
Navigate to `http://localhost:3000` to begin!

---

## 🔑 Demo Access Credentials
If you seeded the database using `npm run seed`, use the following accounts to explore the hierarchical workflows:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@demo.com` | `password123` |
| **Manager** | `manager@demo.com` | `password123` |
| **Employee** | `employee@demo.com` | `password123` |

## 🚀 Deployment
This application is formatted as a seamless Next.js monolith — simply push your code to your GitHub repository and import the project directly into **Vercel**. Ensure your Vercel Project Settings contain the exact `MONGODB_URI` and `JWT_SECRET` environment variables.

---
*Built with bleeding-edge Next.js patterns. Designed for speed, precision, and beautiful UX.*
