
export enum InvoiceStatus {
  DRAFT = 'Draft',
  SENT = 'Sent',
  PAID = 'Paid',
  OVERDUE = 'Overdue',
  CANCELLED = 'Cancelled',
  PENDING_PAYMENT = 'Pending Payment',
  SHIPPED = 'Shipped',
  DELIVERED = 'Delivered'
}

export enum UserRole {
  ADMIN = 'admin',
  DISTRIBUTOR = 'distributor',
  CLIENT = 'client'
}

export enum DistributorTier {
  SILVER = 'Silver',
  GOLD = 'Gold',
  PLATINUM = 'Platinum',
  DIAMOND = 'Diamond'
}

export interface PetDetails {
  id: string;
  name: string;
  age: string;
  breed: string;
  gender: 'male' | 'female';
  isNeutered: boolean;
  isVaccinated: boolean;
  allergies: string;
  behaviorWithDogs: string;
  medicalNotes: string;
  lastGroomingDate?: string;
}

export interface Client {
  id: string;
  name: string; 
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postcode: string;
  role: UserRole;
  status: 'pending' | 'approved';
  invoicesSent: number;
  createdAt: string;
  businessName?: string;
  vatNumber?: string;
  tier?: DistributorTier;
  businessType?: string;
  pets: PetDetails[];
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  vetInfo?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  clientName: string;
  clientEmail: string;
  items: InvoiceItem[];
  total: number;
  status: InvoiceStatus;
  date: string;
  isWholesale: boolean;
  paymentId?: string;
  shippingAddress?: string;
}

export interface Invoice extends Order {
  invoiceNumber: string;
  clientPhone: string;
  clientAddress: string;
  clientCityPostcode: string;
  serviceDate: string;
  dueDate: string;
  subtotal: number;
  isVatInvoice: boolean;
  discountApplied?: number;
  distributorId?: string;
  paymentMethod?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unitCost: number;
  reorderLevel: number;
  category: 'Ingredient' | 'Snack' | 'Packaging';
  batchNumber?: string;
  productionDate?: string;
  expiryDate?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'order' | 'payment' | 'stock' | 'system' | 'client';
  read: boolean;
  targetRole: UserRole | 'all';
}

export const VAT_THRESHOLD = 90000;
