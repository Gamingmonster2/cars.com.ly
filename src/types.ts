export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: string;
  image: string;
  whatsapp: string;
  city: string;
  description: string;
  createdAt?: number;
  timeAgo?: string;
  views?: number;
  ownerId?: string;
  ownerName?: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email?: string;
  phone?: string;
  city?: string;
  createdAt: number;
}
