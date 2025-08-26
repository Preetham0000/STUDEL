import { User, Role, Vendor, Product, DeliveryZone, Order } from '../types';

export const MOCK_USERS: User[] = [
  // Customers
  { id: 'cust1', name: 'Alice Johnson', phone: '1111111111', role: Role.CUSTOMER },
  { id: 'cust2', name: 'Bob Williams', phone: '2222222222', role: Role.CUSTOMER },
  // Runners
  { id: 'run1', name: 'Charlie Brown', phone: '3333333333', role: Role.RUNNER, campusId: 'RUN001', isApproved: true },
  { id: 'run2', name: 'Diana Miller', phone: '4444444444', role: Role.RUNNER, campusId: 'RUN002', isApproved: true },
  { id: 'run3', name: 'Eve Davis', phone: '5555555555', role: Role.RUNNER, campusId: 'RUN003', isApproved: false },
  { id: 'run4', name: 'Frank White', phone: '6666666666', role: Role.RUNNER, campusId: 'RUN004', isApproved: true },
  { id: 'run5', name: 'Grace Lee', phone: '7777777777', role: Role.RUNNER, campusId: 'RUN005', isApproved: false },
  // Canteen/Vendor Staff
  { id: 'cant1', name: 'Henry Taylor', phone: '8888888888', role: Role.CANTEEN },
  // Admin
  { id: 'admin1', name: 'Ivy Green', phone: '9999999999', role: Role.ADMIN },
];

export const MOCK_VENDORS: Vendor[] = [
  { id: 'vendor1', name: 'South Indian Canteen', operatingHours: '8:00 AM - 9:00 PM', image: 'https://i.ibb.co/6rP0g2P/south-indian.jpg' },
  { id: 'vendor2', name: 'North Indian Canteen', operatingHours: '11:00 AM - 10:00 PM', image: 'https://i.ibb.co/VmD5y5j/north-indian.jpg' },
  { id: 'vendor3', name: 'The Bake Shop', operatingHours: '10:00 AM - 8:00 PM', image: 'https://i.ibb.co/hZJ7q1q/bakery.jpg' },
  { id: 'vendor4', name: 'Campus Xerox', operatingHours: '9:00 AM - 6:00 PM', image: 'https://i.ibb.co/GQLF9tq/xerox.jpg' },
  { id: 'vendor5', name: 'Student Stationery', operatingHours: '9:00 AM - 8:00 PM', image: 'https://i.ibb.co/xLMd2s5/stationery.jpg' },
];

export const MOCK_PRODUCTS: Product[] = [
    // South Indian Canteen
    { id: 'item1', name: 'Masala Dosa', description: 'Crispy rice crepe filled with spiced potatoes.', price: 120, category: 'Main Course', isAvailable: true, vendorId: 'vendor1' },
    { id: 'item2', name: 'Idli Sambar', description: 'Steamed rice cakes served with lentil soup.', price: 80, category: 'Main Course', isAvailable: true, vendorId: 'vendor1' },
    { id: 'item7', name: 'Filter Coffee', description: 'Traditional South Indian filter coffee.', price: 40, category: 'Beverages', isAvailable: true, vendorId: 'vendor1' },
    
    // North Indian Canteen
    { id: 'item3', name: 'Butter Chicken', description: 'Creamy tomato-based curry with tender chicken.', price: 250, category: 'Main Course', isAvailable: true, vendorId: 'vendor2' },
    { id: 'item4', name: 'Garlic Naan', description: 'Soft flatbread with garlic and butter.', price: 60, category: 'Sides', isAvailable: true, vendorId: 'vendor2' },
    { id: 'item6', name: 'Paneer Tikka', description: 'Marinated cottage cheese cubes grilled to perfection.', price: 220, category: 'Starters', isAvailable: true, vendorId: 'vendor2' },
    { id: 'item8', name: 'Lassi', description: 'A refreshing yogurt-based drink.', price: 70, category: 'Beverages', isAvailable: true, vendorId: 'vendor2' },
  
    // The Bake Shop
    { id: 'item9', name: 'Chocolate Truffle Cake', description: 'Rich and decadent chocolate cake slice.', price: 150, category: 'Desserts', isAvailable: true, vendorId: 'vendor3' },
    { id: 'item10', name: 'Red Velvet Pastry', description: 'Cream cheese frosting on a moist red velvet base.', price: 130, category: 'Desserts', isAvailable: false, vendorId: 'vendor3' },
    { id: 'item5', name: 'Croissant', description: 'Buttery and flaky classic French pastry.', price: 90, category: 'Snacks', isAvailable: true, vendorId: 'vendor3' },

    // Campus Xerox
    { id: 'p1', name: 'B&W Print (A4)', description: 'Single-sided black and white print.', price: 2, category: 'Printing', isAvailable: true, vendorId: 'vendor4' },
    { id: 'p2', name: 'Color Print (A4)', description: 'Single-sided color print.', price: 10, category: 'Printing', isAvailable: true, vendorId: 'vendor4' },
    { id: 'p3', name: 'Spiral Binding', description: 'Per book, up to 100 pages.', price: 50, category: 'Binding', isAvailable: true, vendorId: 'vendor4' },
    
    // Student Stationery
    { id: 's1', name: 'Classic Notebook', description: 'A5 size, 180 pages, ruled.', price: 65, category: 'Notebooks', isAvailable: true, vendorId: 'vendor5' },
    { id: 's2', name: 'Gel Pen (Blue)', description: 'Smooth writing blue gel pen.', price: 15, category: 'Pens', isAvailable: true, vendorId: 'vendor5' },
    { id: 's3', name: 'Highlighter Set', description: 'Pack of 5 assorted colors.', price: 120, category: 'Essentials', isAvailable: true, vendorId: 'vendor5' },
];

export const MOCK_DELIVERY_ZONES: DeliveryZone[] = [
    { id: 'zone1', name: 'Innovation Hall (Building A)', deliveryFee: 20 },
    { id: 'zone2', name: 'Library Commons (Building B)', deliveryFee: 25 },
    { id: 'zone3', name: 'Science Center (Building C)', deliveryFee: 22 },
];

export const MOCK_ORDERS: Order[] = [];