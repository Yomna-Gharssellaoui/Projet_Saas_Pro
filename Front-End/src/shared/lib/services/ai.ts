const AI_BASE =
  import.meta.env.VITE_AI_API_URL || "http://127.0.0.1:8010/api/v1";

import { api } from "@/shared/lib/apiClient"; // Ajustez ce chemin selon votre projet

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface AiRiskResponse {
  clientId: string;
  risk: RiskLevel;
  score: number;
  details: {
    totalInvoices: number;
    unpaidInvoices: number;
    lateInvoices: number;
    outstanding: number;
    revenue: number;
  };
  reason: string;
}

export const AiApi = {
  /**
   * Predict risk level for a client based on their invoice history
   * @param clientId The client ID to predict risk for
   * @returns Risk prediction with score and details
   */
  getRisk: (clientId: string) => 
    api<AiRiskResponse>(`/ai/risk/${clientId}`),
};



async function aiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${AI_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}

export type AINotification = {
  id: string;
  businessId: string;
  title: string;
  message: string;
  category: string;
  priority: "info" | "warning" | "critical" | string;
  score?: number;
  read: boolean;
  actionLabel?: string;
  actionUrl?: string;
  createdAt: string;
};

export type UnreadCountResponse = {
  unreadCount: number;
};

export const AIService = {
  runAnalysis: (businessId: string) =>
    aiFetch(`/businesses/${businessId}/run`, { method: "POST" }),

  getSummary: (businessId: string) =>
    aiFetch(`/businesses/${businessId}/summary`),

  getNotifications: (businessId: string) =>
    aiFetch<AINotification[]>(`/businesses/${businessId}/notifications`),

  getUnreadNotificationsCount: (businessId: string) =>
    aiFetch<UnreadCountResponse>(
      `/businesses/${businessId}/notifications/unread-count`
    ),
getAICoach: (businessId: string) =>
  aiFetch(`/businesses/${businessId}/ai-coach`),
  markNotificationAsRead: (businessId: string, notificationId: string) =>
    aiFetch(`/businesses/${businessId}/notifications/${notificationId}/read`, {
      method: "PATCH",
    }),

  markAllNotificationsAsRead: (businessId: string) =>
    aiFetch(`/businesses/${businessId}/notifications/read-all`, {
      method: "PATCH",
    }),

  deleteNotification: (businessId: string, notificationId: string) =>
    aiFetch(`/businesses/${businessId}/notifications/${notificationId}`, {
      method: "DELETE",
    }),

  clearNotifications: (businessId: string) =>
    aiFetch(`/businesses/${businessId}/notifications`, {
      method: "DELETE",
    }),
};