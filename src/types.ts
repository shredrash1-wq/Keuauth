export interface Application {
  id: string;
  name: string;
  secret: string;
  ownerid: string;
  version: string;
  status: 'active' | 'maintenance' | 'disabled';
  createdAt: string;
  totalUsers: number;
  activeLicenses: number;
  downloadLink: string;
}

export interface LicenseKey {
  id: string;
  key: string;
  appId: string;
  durationDays: number;
  level: number;
  status: 'unused' | 'used' | 'banned' | 'frozen';
  usedBy?: string;
  usedAt?: string;
  hwid?: string;
  createdAt: string;
  note?: string;
}

export interface AuthUser {
  id: string;
  username: string;
  password?: string;
  appId: string;
  durationDays: number;
  level: number;
  hwid?: string;
  ip?: string;
  created: string;
  lastLogin: string;
  subscriptions?: {
    subscription: string;
    expiry: string;
    level: number;
  }[];
  banned: boolean;
  banReason?: string;
}

export interface SubscriptionPlan {
  id: string;
  appId: string;
  name: string;
  level: number;
  defaultDays: number;
}

export interface WebhookConfig {
  id: string;
  appId: string;
  name: string;
  url: string;
  events: string[];
  enabled: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  type: 'auth' | 'license' | 'admin' | 'webhook';
  message: string;
  ip?: string;
  appId: string;
}
