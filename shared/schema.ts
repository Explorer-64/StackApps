import { z } from "zod";

export type AppStatus = 'idea' | 'building' | 'live' | 'maintenance';
export type ModerationStatus = 'pending_review' | 'approved' | 'rejected';
export type SubmissionStatus = 'todo' | 'done' | 'skipped';
export type LogType = 'update' | 'decision' | 'research' | 'milestone' | 'insight';

export interface StrategyLogEntry {
  id: string;
  date: string;
  title: string;
  content: string;
  type: LogType;
  tags?: string[];
}

export interface QuickLink {
  id: string;
  title: string;
  url: string;
  icon?: string;
}

export interface App {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  thumbnailUrl: string;
  appUrl: string;
  category?: string;
  tags?: string[];
  status?: AppStatus;
  moderationStatus?: ModerationStatus;
  rejectionReason?: string;
  safetyVerified?: boolean;
  isFeatured?: boolean;
  averageRating?: number;
  ratingCount?: number;
  notes?: string;
  quickLinks?: QuickLink[];
  marketing?: {
    shortPitch?: string;
    seoKeywords?: string;
    twitterBio?: string;
  };
  submissions?: Record<string, SubmissionStatus>;
  strategyLogs?: StrategyLogEntry[];
  createdAt: string;
  updatedAt: string;
  scan_reachable?: boolean;
  scan_llms?: boolean;
  scan_robots?: boolean;
  scan_sitemap?: boolean;
  scan_faq?: boolean;
  scan_blueprint?: boolean;
  scan_mcp?: boolean;
  scan_cli?: boolean;
  scan_pwa_android?: boolean;
  scan_pwa_ios?: boolean;
  scan_pwa_sw?: boolean;
  scan_viewport?: boolean;
  scan_safety_verified?: boolean;
  scan_score?: number;
  scan_timestamp?: string;
  scan_public?: boolean;
  submittedAt?: string;
}

export interface Review {
  id: string;
  appId: string;
  userId: string;
  userName?: string;
  userAvatarUrl?: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Comment {
  id: string;
  appId: string;
  userId: string;
  userName?: string;
  userAvatarUrl?: string;
  content: string;
  parentId: string | null;
  createdAt: string;
  updatedAt?: string;
  likes?: string[];
}

export const appSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  thumbnailUrl: z.string().optional(),
  appUrl: z.string().url("Must be a valid URL"),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['idea', 'building', 'live', 'maintenance']).optional(),
});

export const reviewSchema = z.object({
  appId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string(),
  userName: z.string().optional(),
  userAvatarUrl: z.string().optional(),
});

export type InsertApp = z.infer<typeof appSchema>;
export type InsertReview = z.infer<typeof reviewSchema>;

// ===== Multi-App Hub Types (StackStock, StackSpent, etc.) =====

export interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unitCost?: number;
  category?: string;
  location?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseEntry {
  id: string;
  title: string;
  amount: number;
  category: string;
  incurredOn: string;
  notes?: string;
  receiptUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookkeepingConfig {
  categories: string[];
  updatedAt?: string;
}

export const inventoryItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  quantity: z.number().min(0, "Quantity must be 0 or greater"),
  unitCost: z.number().min(0).optional(),
  category: z.string().optional(),
  location: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const expenseEntrySchema = z.object({
  title: z.string().min(1, "Title is required"),
  amount: z.number(),
  category: z.string().min(1, "Category is required"),
  incurredOn: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
  receiptUrl: z.string().url().optional(),
});

export type InsertInventoryItem = z.infer<typeof inventoryItemSchema>;
export type InsertExpenseEntry = z.infer<typeof expenseEntrySchema>;

export interface User {
  id: string;
  username: string;
  password: string;
}

export type InsertUser = Omit<User, "id">;
