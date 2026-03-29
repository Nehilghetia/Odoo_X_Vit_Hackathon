# ReimburseFlow - Reimbursement Management System

A production-ready, full-stack Reimbursement Management System built with Next.js 14 (Frontend) and Node.js/Express (Backend).

## 📂 Project Architecture

The project is decoupled into two main directories for scalability and independent deployment:

### 🌐 [Frontend](./frontend) (Next.js 14 App Router)
- **Framework**: Next.js 14, React 18
- **Styling**: Tailwind CSS with Mobile-First Responsive Design
- **Auth**: JWT-based authentication with Context API
- **Features**: 
  - Dynamic Dashboard with Recharts
  - Smart Expense Submission with OCR (Tesseract.js)
  - Multi-currency support with live exchange rates
  - Notification System with real-time polling
  - Dark-mode ready Glassmorphism UI
- **Responsive**: Fully optimized for XS (375px) up to 4K displays.

### ⚙️ [Backend](./backend) (Node.js/Express API)
- **Server**: Express.js with TypeScript
- **Database**: MongoDB (Mongoose)
- **Security**: Helmet, Express Rate Limit, JWT (HTTP-only cookies)
- **Logic**: 
  - Complex Hierarchical Approval Workflows
  - Role-Based Access Control (Admin, Manager, Employee)
  - Audit Logging for all state transitions
  - Automated Currency Conversion Engine

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)
- NPM or Yarn

### Installation

1. **Clone the repository**
2. **Setup Backend**:
   ```bash
   cd backend
   npm install
   # Create .env with MONGODB_URI, JWT_SECRET, PORT
   npm run dev
   ```
3. **Setup Frontend**:
   ```bash
   cd frontend
   npm install
   # Create .env.local with NEXT_PUBLIC_API_URL
   npm run dev
   ```

---

## 📱 Mobile-First Features
- **Safe Area Support**: Optimized for iOS notches and Android status bars.
- **Touch Targets**: All interactive elements are minimum 44x44px.
- **Dynamic Height**: Uses `dvh` units to prevent mobile browser UI overlap.
- **No-Zoom Inputs**: Font-sizes regulated to 16px on focus to prevent auto-zooming on mobile.

## 🛠️ Tech Stack
- **Frontend**: Next.js, Tailwind, Lucide Icons, Recharts, Framer Motion
- **Backend**: Node.js, Express, Mongoose, JWT, Morgan, Helmet
- **APIs**: RestCountries (Currencies), Open Exchange Rates / ExchangeRate-API

---
