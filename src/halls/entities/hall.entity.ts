export interface Hall {
  id: string;
  name: string;
  rows: number;
  seatsPerRow: number;
}

export interface HallSeat {
  row: number;
  seat: number;
}
