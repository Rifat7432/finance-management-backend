import { Model } from 'mongoose';

export type IPackage = {
  title: string;
  description: string;
  price: number;                  // Regular price
  priceId: string;                // Stripe price ID for regular price
  promoPrice?: number;            // Optional promo price
  promoPriceId?: string;          // Stripe price ID for promo price
  duration: '1 month' | '3 months' | '6 months' | '1 year'; // Interval mapping
  paymentType: 'Monthly' | 'Yearly'; // For display or filtering
  productId?: string;             // Stripe product ID
  currency?: string;              // Currency code (e.g., 'usd')
  subscriptionType: 'app' | 'web'; // Where this package applies
  status: 'active' | 'inactive';
  isDeleted: boolean;
};

export type PackageModel = Model<IPackage, Record<string, unknown>>;
