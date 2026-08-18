# Amar Hisab (আমার হিসাব) 📊

**Amar Hisab** is a modern, real-time SaaS business management, inventory, sales, and accounting system designed for small to medium enterprises. Built with React, TypeScript, Tailwind CSS, Express, and MongoDB Atlas.

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen)](https://amarhisabx.vercel.app/login)
[![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20TypeScript%20%7C%20MongoDB%20Atlas-blue)](#tech-stack)

---

## ✨ Key Features

### 👑 Super Admin SaaS Control Center
- System-wide metrics & telemetry dashboard (Total Users, Active Stores, Products, System Health).
- Registered user directory with search, inspection, and account deletion options.
- Registered business store directory.
- Instant Announcement Broadcaster with preset notification templates.

### 🏢 Multi-Tenant Management
- Manage multiple businesses or store branches under a single account.
- Secure data isolation per owner using JWT authentication and MongoDB Atlas.

### 📦 Inventory & Product Tracking
- Comprehensive product catalog with SKU, category, stock alerts, and pricing.
- Real-time stock level monitoring and low stock notifications.
- Stock movement audit trails (Restocks, Sales, Manual adjustments).

### 💰 Sales & Profit Analytics
- Effortless sales recording with support for multiple payment methods (Cash, bKash, Nagad, etc.).
- Automatic profit calculation for every sale.
- Interactive dashboards with visual charts using **Recharts**.

### 💸 Expense Management
- Track operational costs like rent, utilities, and salaries.
- Categorized expense logging for transparent financial overviews.

### 🔑 Flexible Authentication
- Support for Owner Login, Viewer Demo Mode, Super Admin Portal (`admin@iiuc.ac.bd`), and Google OAuth 2.0.

---

## 🚀 Tech Stack

- **Frontend**: React 18, Vite, TypeScript
- **Styling**: Vanilla CSS, TailwindCSS, Framer Motion, Lucide Icons
- **State Management**: Zustand
- **Backend & Database**: Node.js, Express, MongoDB Atlas (Mongoose), JWT
- **Auth**: Custom JWT Auth + Google OAuth 2.0 (`@react-oauth/google` & `google-auth-library`)

---

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- MongoDB Atlas database cluster

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/adnan-jahangir/Hisab.git
   cd Hisab
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up Environment Variables (`.env`)**:
   ```env
   PORT=5000
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.qffk0tp.mongodb.net/amr-hisab?retryWrites=true&w=majority
   JWT_SECRET=your_jwt_secret
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   VITE_API_URL=/api
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

---

## 👨‍💻 Developed By

**Adnan Jahangir**

---
*Built with ❤️ to empower modern business management.*
