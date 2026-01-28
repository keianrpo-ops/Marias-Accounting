
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
  name: string; // Contact Person
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
  
  // Distributor specific
  businessName?: string;
  vatNumber?: string;
  tier?: DistributorTier;
  businessType?: string;
  
  // Daycare specific
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

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  clientCityPostcode: string;
  date: string;
  serviceDate: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  total: number;
  status: InvoiceStatus;
  isVatInvoice: boolean;
  isWholesale?: boolean;
  discountApplied?: number;
  distributorId?: string;
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
