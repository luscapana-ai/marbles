export interface Marble {
  id: string;
  name: string;
  description: string;
  price?: number;
  imageUrl?: string;
  videoUrl?: string;
  videoType?: 'uploaded' | 'generated';
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Legendary';
  sellerId?: string;
}

export enum GameMode {
  MENU = 'MENU',
  PLAY = 'PLAY',
  ENCYCLOPEDIA = 'ENCYCLOPEDIA',
  MARKETPLACE = 'MARKETPLACE',
  ANALYZER = 'ANALYZER'
}

export interface PhysicsBody {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  mass: number;
  isPlayer?: boolean;
}

export interface Obstacle {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export interface SearchResult {
  text: string;
  sources: Array<{ title: string; uri: string }>;
}

export type ImageSize = '1K' | '2K' | '4K';

export enum OrderStatus {
  ESCROW_PENDING = 'ESCROW_PENDING',
  COMPLETED = 'COMPLETED',
  DISPUTED = 'DISPUTED'
}

export interface Order extends Marble {
  orderId: string;
  purchaseDate: Date;
  status: OrderStatus;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'info' | 'error';
  timestamp: Date;
  read: boolean;
  orderId?: string;
}