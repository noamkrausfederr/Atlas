export function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isPastTrip(board) {
  if (!board.endDate) {
    return false;
  }
  const end = new Date(board.endDate);
  end.setHours(0, 0, 0, 0);
  return end < startOfToday();
}

export function getUpcomingTrips(boards) {
  return boards.filter((board) => !isPastTrip(board));
}

export function getPastTrips(boards) {
  return boards.filter((board) => isPastTrip(board));
}

export function countSavedPlaces(boards) {
  return boards.reduce((sum, board) => sum + (board.placesList?.length ?? 0), 0);
}
