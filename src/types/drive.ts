export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  createdTime?: string;
  parents?: string[];
  webViewLink?: string;
  webContentLink?: string;
  thumbnailLink?: string;
  description?: string;
  starred?: boolean;
}

export type NavSection =
  | 'overview'
  | 'explorer'
  | 'projects'
  | 'chats'
  | 'memory'
  | 'gallery'
  | 'github'
  | 'settings';

export type DriveConnectionStatus =
  | 'demo'
  | 'connecting'
  | 'connected'
  | 'expired'
  | 'error';

export interface DriveSessionState {
  status: DriveConnectionStatus;
  accessToken: string | null;
  expiresAt: number | null;
  userEmail: string | null;
  userName: string | null;
  userPhoto: string | null;
  lastError: string | null;
  expiredReason: string | null;
}

export interface BreadcrumbItem {
  id: string;
  name: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  description?: string;
}
