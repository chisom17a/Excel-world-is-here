export interface Product {
  id: string;
  name: string;
  description: string;
  images: string[];
  price: number;
  discountPrice?: number;
  hasDiscount: boolean;
  fullDetails: string;
  externalLinks?: string[];
  limitedToStates?: string[];
  createdAt: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  role: 'user' | 'admin';
  cashbackBalance: number;
  dateJoined: number;
  totalOrders: number;
  totalSpending: number;
  isActivated: boolean;
}

export interface Order {
  id: string;
  userId: string;
  userEmail: string;
  items: CartItem[];
  totalAmount: number;
  status: 'pending_payment' | 'pending_approval' | 'approved' | 'rejected' | 'shipped' | 'delivered';
  paymentMethod: 'cashback' | 'direct' | 'mixed';
  shipmentDetails: ShipmentDetails;
  paymentProof?: {
    senderName: string;
    imageUrl?: string;
    timestamp: number;
  };
  rejectionReason?: string;
  createdAt: number;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface ShipmentDetails {
  email: string;
  altEmail?: string;
  phone: string;
  altPhone?: string;
  state: string;
  address: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: number;
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: 'purchase' | 'cashback_credit' | 'refund';
  description: string;
  createdAt: number;
}

export const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", 
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT", "Gombe", "Imo", 
  "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", 
  "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", 
  "Yobe", "Zamfara"
];
