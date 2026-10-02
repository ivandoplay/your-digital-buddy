export type RoleType = 'ADMIN' | 'VENDEDOR' | 'FULFILLMENT' | 'CLIENTE';
export type UserStatus = 'ACTIVE' | 'INACTIVE';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: RoleType;
  status: UserStatus;
  twoFactorEnabled: boolean;
  sellerCode?: string;
  commissionRate?: number;
  lastLoginAt?: string;
  createdAt: string;
}

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  altText: string;
  isPrimary: boolean;
}

export interface ProductDocument {
  id: string;
  productId: string;
  title: string;
  docType: 'NOTIFICACAO_ANVISA' | 'LAUDO_TECNICO' | 'CERTIFICADO' | 'OUTRO';
  fileUrl: string;
  version: string;
  status: 'VALID' | 'EXPIRED' | 'PENDING';
  uploadedBy: string;
  uploadedAt: string;
}

export interface ProductClaim {
  id: string;
  productId: string;
  claimText: string;
  regulatoryBasis: string;
  status: 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW';
}

export type ProductStatus = 'ACTIVE' | 'INACTIVE' | 'DRAFT';
export type ComplianceStatus = 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';

export interface Product {
  id: string;
  sku: string;
  internalName: string;
  commercialName: string;
  category: string;
  description: string;
  composition: string;
  presentation: string;
  unitQuantity: number;
  images: ProductImage[];
  documents: ProductDocument[];
  batchNumber: string;
  expiryDate: string;
  status: ProductStatus;
  regulatoryInfo: string;
  approvedClaims: ProductClaim[];
  warnings: string;
  usageInstructions: string;
  restrictions: string;
  labelingInfo: string;
  unitCost: number;
  stockQuantity: number;
  complianceStatus: ComplianceStatus;
  createdAt: string;
  updatedAt: string;
}

export interface OfferItem {
  id: string;
  offerId: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitCost: number;
}

export type OfferStatus = 'ACTIVE' | 'INACTIVE' | 'DRAFT';

export interface Offer {
  id: string;
  code: string;
  name: string;
  offerType: '1_UNIT' | 'KIT' | 'COMBO';
  items: OfferItem[];
  totalUnits: number;
  regularPrice: number;
  promotionalPrice: number;
  basePrice: number;
  minimumPrice: number;
  maximumPrice: number | null;
  commissionPercent: number;
  discountPercent: number;
  maxCouponDiscountPercent: number;
  defaultCouponCode?: string;
  usageLimit: number;
  usageCount: number;
  freeShipping: boolean;
  shippingSubsidy: number;
  extras: unknown[];
  sellerId: string | null;
  campaignId: string | null;
  status: OfferStatus;
  complianceStatus: ComplianceStatus;
  eligibilityRules: string;
  startsAt: string;
  endsAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface OfferLink {
  id: string;
  code: string;
  offerId: string;
  offerName: string;
  campaignId: string | null;
  sellerId: string;
  sellerName: string;
  salePrice: number;
  basePrice: number;
  minimumPrice: number;
  maximumPrice: number | null;
  commissionPercent: number;
  commissionAmount: number;
  surplusAmount: number;
  sellerEarnings: number;
  couponCode?: string;
  clicks: number;
  conversions: number;
  status: OfferStatus;
  expiresAt: string;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  maxUsesGlobal: number;
  maxUsesPerCustomer: number;
  currentUses: number;
  validUntil: string;
  authorizedSellerId: string | null;
  authorizedCampaignId: string | null;
  authorizedProductId: string | null;
  authorizedOfferId: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export interface CouponUsage {
  id: string;
  couponId: string;
  couponCode: string;
  customerId: string;
  customerCpf: string;
  orderId: string;
  discountApplied: number;
  usedAt: string;
}

export type PaymentMethod = 'PIX' | 'CREDIT_CARD' | 'BOLETO';
export type PaymentStatus = 'CREATED' | 'PENDING' | 'APPROVED' | 'DECLINED' | 'EXPIRED' | 'REFUNDED' | 'CHARGEBACK';

export interface Payment {
  id: string;
  orderId: string;
  orderNumber: string;
  provider: string;
  externalReference: string;
  idempotencyKey: string;
  method: PaymentMethod;
  amount: number;
  gatewayFee: number;
  status: PaymentStatus;
  pixQrCode?: string;
  webhookEvents: Array<{ webhookId: string; statusFrom: string; statusTo: string; processedAt: string; signatureValid: boolean }>;
  createdAt: string;
  updatedAt: string;
}

export type FinancialStatus = 'pending' | 'approved' | 'declined' | 'refunded' | 'chargeback';
export type OperationalStatus = 'waiting' | 'picking' | 'packing' | 'ready_to_ship' | 'shipped' | 'delivered' | 'returned' | 'exception';
export type ExceptionType = 'chargeback' | 'cancelamento' | 'extraviado' | 'avaria' | 'outro';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  cpf: string;
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  marketingOptIn: boolean;
  anonymized: boolean;
  createdAt: string;
}

export interface CustomerSnapshot {
  name: string;
  phone: string;
  email: string;
  cpf: string;
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface OrderItem {
  productId: string;
  sku: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
}

export interface OrderTimelineEvent {
  id: string;
  orderId: string;
  event: string;
  actor: string;
  timestamp: string;
  previousValue: string;
  newValue: string;
  note: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerSnapshot: CustomerSnapshot;
  sellerId: string | null;
  sellerName: string;
  offerId: string;
  offerName: string;
  offerLinkId: string | null;
  offerLinkCode: string | null;
  campaignId: string | null;
  campaignName: string;
  couponCode: string | null;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shippingCost: number;
  shippingSubsidy: number;
  total: number;
  paymentId: string;
  paymentMethod: PaymentMethod;
  shippingService: string;
  estimatedDeliveryDays: number;
  trackingCode: string | null;
  financialStatus: FinancialStatus;
  operationalStatus: OperationalStatus;
  consolidatedStatus: string;
  exceptionReason: ExceptionType | null;
  timeline: OrderTimelineEvent[];
  repurchaseWindowDays: number;
  createdAt: string;
  updatedAt: string;
}

export interface ShipmentEvent {
  status: string;
  location: string;
  description: string;
  timestamp: string;
}

export interface Shipment {
  id: string;
  orderId: string;
  orderNumber: string;
  provider: string;
  serviceName: string;
  price: number;
  estimatedDays: number;
  trackingCode: string;
  labelUrl?: string;
  status: string;
  events: ShipmentEvent[];
  createdAt: string;
}

export interface Lead {
  id: string;
  name: string;
  contact: string;
  origin: string;
  campaignId: string;
  sellerId: string;
  stage: 'LEAD' | 'OFERTA' | 'NEGOCIACAO' | 'FECHADO' | 'RECOMPRA';
  offersPresented: string[];
  offersPurchased: string[];
  interactions: Array<{ id: string; timestamp: string; actor: string; note: string; offerId?: string }>;
  createdAt: string;
  lastInteractionAt: string;
}

export interface Commission {
  id: string;
  sellerId: string;
  sellerName: string;
  orderId: string;
  orderNumber: string;
  offerLinkId: string | null;
  offerLinkCode: string | null;
  calculationBase: number;
  basePrice: number;
  percentage: number;
  commissionAmount: number;
  surplusAmount: number;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'CANCELLED';
  ruleUsed: string;
  createdAt: string;
}

export interface ComplianceReview {
  id: string;
  targetType: 'PRODUTO' | 'OFERTA';
  targetId: string;
  targetName: string;
  status: ComplianceStatus;
  checklist: Record<string, boolean>;
  approvedBy: string | null;
  notes: string;
  updatedAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  channel: string;
  origin: string;
  media: string;
  adName: string;
  creative: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  responsibleSellerId: string | null;
  estimatedCac: number;
  adSpend: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  trigger: string;
  action: string;
  status: 'ACTIVE' | 'INACTIVE';
  updatedAt: string;
}

export interface PrivacyRequest {
  id: string;
  customerId: string;
  customerName: string;
  requestType: 'ANONYMIZATION' | 'DELETION' | 'DATA_EXPORT';
  purpose: string;
  status: 'PENDING' | 'COMPLETED' | 'REJECTED';
  requestedAt: string;
  completedAt?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  entity: string;
  entityId: string;
  previousValue: string;
  newValue: string;
  ip: string;
  metadata: string;
  timestamp: string;
}

export interface UnitEconomicsConfig {
  minContributionMarginPercent: number;
  maxDiscountCeilingPercent: number;
  defaultCommissionPercent: number;
  repurchaseCycleDays: number;
  shippingSubsidyCap: number;
}

export interface AnalyticsEvent {
  id: string;
  eventType: string;
  offerId: string;
  sellerId: string | null;
  campaignId: string | null;
  timestamp: string;
}

export interface StoreState {
  users: User[];
  products: Product[];
  offers: Offer[];
  offerLinks: OfferLink[];
  coupons: Coupon[];
  couponUsages: CouponUsage[];
  orders: Order[];
  shipments: Shipment[];
  customers: Customer[];
  leads: Lead[];
  commissions: Commission[];
  complianceReviews: ComplianceReview[];
  campaigns: Campaign[];
  automationRules: AutomationRule[];
  privacyRequests: PrivacyRequest[];
  auditLogs: AuditLog[];
  unitEconomicsConfig: UnitEconomicsConfig;
  analyticsEvents: AnalyticsEvent[];
}
