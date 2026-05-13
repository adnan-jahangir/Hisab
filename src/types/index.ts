export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: 'admin' | 'manager' | 'staff';
}

export interface Business {
  id: string;
  name: string;
  currency: 'BDT' | 'USD';
  timezone: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  description?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  costPrice: number;
  stock: number;
  category: string;
}

export interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string;
  note?: string;
  receiptUrl?: string;
}

export interface SaleRecord {
  id: string;
  productId: string;
  quantity: number;
  totalAmount: number;
  date: string;
  customerId?: string;
}

export interface Notification {
  id: string;
  type: 'stock_low' | 'stock_out' | 'expense_warning' | 'payment_due' | 'milestone' | 'report_ready';
  title: string;
  body: string;
  relatedId?: string;
  read: boolean;
  createdAt: string;
  priority: 'low' | 'medium' | 'high';
}

export type NotificationTypeToggle = Record<Notification['type'], boolean>;
