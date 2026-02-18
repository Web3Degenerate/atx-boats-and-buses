export interface Vehicle {
  id: string;
  name: string;
  slug: string;
  type: "party-boat" | "party-bus" | "pontoon-boat";
  description: string;
  capacity: number;
  pricePerHour: number;
  images: string[];
  features: string[];
  minimumHours: number;
  maximumHours: number;
  fuelChargePercent: number;
}

export interface Booking {
  id: string;
  vehicleId: string;
  customerName: string;
  customerEmail: string;
  date: string;
  startTime: string;
  endTime: string;
  guestCount: number;
  notes?: string;
  totalPrice: number;
  status: "pending" | "confirmed" | "cancelled";
}

export interface TimeSlot {
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}
