export const PRODUCT_CONFIG = {
  // Logical ID used in JSON translation files -> Real Provider ID
  'pro-monthly': {
    creemId: process.env.NEXT_PUBLIC_CREEM_PRODUCT_PRO || 'prod_6QIupLnQ0me8AMT8f1kFY6', 
    name: 'Pro Plan'
  },
  'business-monthly': {
    creemId: process.env.NEXT_PUBLIC_CREEM_PRODUCT_BUSINESS || 'prod_9QVffTfOEsZ6rBNdedrfi',
    name: 'Business Plan'
  },
  'free-plan': {
    creemId: 'free-plan',
    name: 'Free Plan'
  }
} as const;

export type ProductId = keyof typeof PRODUCT_CONFIG;

export function getRealProductId(logicalId: string): string {
  const product = PRODUCT_CONFIG[logicalId as ProductId];
  return product ? product.creemId : logicalId;
}
