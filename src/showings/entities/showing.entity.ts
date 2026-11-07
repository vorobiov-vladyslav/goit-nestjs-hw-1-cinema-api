export interface Showing {
  id: string;
  filmId: string;
  hallId: string;
  startsAt: string;
  price: number;
}

export interface ShowingView {
  id: string;
  filmTitle: string;
  hallName: string;
  startsAt: string;
  price: number;
}
