export interface BookingSeat {
  row: number;
  seat: number;
}

export interface Booking {
  id: string;
  showingId: string;
  seats: BookingSeat[];
  totalPrice: number;
}

export interface ShowingSeatView {
  row: number;
  seat: number;
  isBooked: boolean;
}
