import { subDays, format } from 'date-fns';
import { useInventoryStore, Product } from '../store/useInventoryStore';
import { useSalesStore, SaleRecord } from '../store/useSalesStore';
import { useExpenseStore, Expense, ExpenseCategory } from '../store/useExpenseStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { useDashboardStore } from '../store/useDashboardStore';

export const seedStores = () => {
  const inventoryStore = useInventoryStore.getState();
  if (inventoryStore.products.length > 0) return; // already seeded

  const mockProducts: Product[] = [
    { id: 'p1', name: 'Premium Rice 5kg', sku: 'RICE-001', category: 'Grocery', buy_price: 300, sell_price: 350, current_stock: 50, min_stock_level: 10, created_at: new Date().toISOString() },
    { id: 'p2', name: 'Sunflower Oil 2L', sku: 'OIL-002', category: 'Grocery', buy_price: 320, sell_price: 380, current_stock: 15, min_stock_level: 20, created_at: new Date().toISOString() }, 
    { id: 'p3', name: 'Organic Honey', sku: 'HON-003', category: 'Grocery', buy_price: 500, sell_price: 650, current_stock: 0, min_stock_level: 5, created_at: new Date().toISOString() },
    { id: 'p4', name: 'Desk Fan', sku: 'ELEC-001', category: 'Electronics', buy_price: 800, sell_price: 1200, current_stock: 5, min_stock_level: 10, created_at: new Date().toISOString() },
    { id: 'p5', name: 'Extension Cord', sku: 'ELEC-002', category: 'Electronics', buy_price: 200, sell_price: 350, current_stock: 100, min_stock_level: 15, created_at: new Date().toISOString() },
    { id: 'p6', name: 'Water Bottle', sku: 'PLAS-001', category: 'Plastic', buy_price: 50, sell_price: 80, current_stock: 0, min_stock_level: 20, created_at: new Date().toISOString() },
    { id: 'p7', name: 'Note Book', sku: 'STAT-001', category: 'Stationery', buy_price: 30, sell_price: 50, current_stock: 200, min_stock_level: 50, created_at: new Date().toISOString() },
  ];

  useInventoryStore.setState({ products: mockProducts });

  const mockSales: SaleRecord[] = [];
  const paymentMethods: ('cash' | 'bkash' | 'nagad' | 'card')[] = ['cash', 'bkash', 'nagad', 'card'];
  
  for (let i = 0; i < 30; i++) {
    const product = mockProducts[Math.floor(Math.random() * mockProducts.length)];
    const qty = Math.floor(Math.random() * 5) + 1;
    const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
    
    mockSales.push({
      id: `sale-${i}`,
      product_id: product.id,
      product_name: product.name,
      quantity: qty,
      sell_price: product.sell_price,
      total_amount: product.sell_price * qty,
      profit: (product.sell_price - product.buy_price) * qty,
      customer_name: i % 3 === 0 ? 'John Doe' : undefined,
      payment_method: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
      date,
      status: i === 0 ? 'Pending' : 'Completed',
      created_at: new Date().toISOString()
    });
  }

  useSalesStore.setState({ sales: mockSales });

  const mockExpenses: Expense[] = [];
  const categories: ExpenseCategory[] = ["facebook_ads", "packaging", "delivery", "employee_salary", "miscellaneous"];
  
  for (let i = 0; i < 20; i++) {
    mockExpenses.push({
      id: `exp-${i}`,
      category: categories[Math.floor(Math.random() * categories.length)],
      amount: Math.floor(Math.random() * 1000) + 100,
      description: `Expense ${i}`,
      type: 'one_time',
      date: format(subDays(new Date(), i), 'yyyy-MM-dd'),
      created_at: new Date().toISOString()
    });
  }
  
  useExpenseStore.setState({ expenses: mockExpenses });

  useNotificationStore.getState().addNotification({
    title: 'Welcome to Hisab',
    body: 'Your business finance companion is ready.',
    type: 'milestone',
    priority: 'low'
  });

  useDashboardStore.getState().recalculate();
};
