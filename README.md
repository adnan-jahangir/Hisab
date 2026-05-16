# Amar Hisab

**Amar Hisab** is a professional, full-stack Retail Management System designed to help small to medium-sized businesses track their inventory, sales, and expenses with ease. Built with modern web technologies, it provides a seamless and secure experience for business owners to manage their operations.

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen)](https://amarhisab-puce.vercel.app/login)
[![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20TypeScript%20%7C%20Supabase-blue)](#tech-stack)

---

## ✨ Features

### 🏢 Multi-Tenant Management
- Manage multiple businesses or pharmacy branches under a single account.
- Secure data isolation between businesses using Supabase Row Level Security (RLS).

### 📦 Inventory & Product Tracking
- Comprehensive product catalog with SKU, category, and pricing.
- Real-time stock level monitoring.
- **Low Stock Alerts**: Automatically get notified when items are running low.
- Stock movement audit trails (Restocks, Sales, Manual adjustments).

### 💰 Sales & Profit Analytics
- Effortless sales recording with support for multiple payment methods (Cash, bKash, Nagad, etc.).
- Automatic profit calculation for every sale.
- Interactive dashboards with visual charts using **Recharts**.

### 💸 Expense Management
- Track operational costs like rent, utilities, and salaries.
- Categorized expense logging for better financial overview.

### 📄 Reports & Exports
- Generate professional invoices and reports.
- Export data to **PDF** (via jsPDF) or **Excel** (via SheetJS/XLSX).

### 🔐 Secure Authentication
- Robust user authentication and profile management powered by **Supabase**.
- Role-based access control to ensure data integrity.

---

## 🚀 Tech Stack

- **Frontend**: React 18, Vite, TypeScript
- **Styling**: TailwindCSS, Framer Motion (Animations), Lucide React (Icons)
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Backend/Database**: Supabase (PostgreSQL, Auth, RLS)
- **Forms**: React Hook Form + Zod
- **Visualization**: Recharts
- **Utilities**: Date-fns, UUID, jsPDF, XLSX

---

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- A Supabase account

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd amar-hisab
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up Environment Variables**:
   Create a `.env` file in the root directory and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Build for production**:
   ```bash
   npm run build
   ```

---

## 📂 Project Structure

```text
src/
├── components/     # Reusable UI components
├── hooks/          # Custom React hooks
├── layouts/        # Page layouts (Auth, Dashboard)
├── pages/          # Application views (Dashboard, Sales, Inventory, etc.)
├── store/          # Zustand state management
├── types/          # TypeScript definitions
└── utils/          # Helper functions and formatters
```

---

## 📝 License

This project is private and intended for use by the owner. All rights reserved.

---

## 👨‍💻 Developed By

**Adnan Jahangir**


