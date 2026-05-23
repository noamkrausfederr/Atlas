import { detectDestinationKey } from './recommendations';

const CITY_CENTERS = {
  venice: { latitude: 45.4408, longitude: 12.3155 },
  francisco: { latitude: 37.7749, longitude: -122.4194 },
  kyoto: { latitude: 35.0116, longitude: 135.7681 },
  paris: { latitude: 48.8566, longitude: 2.3522 },
  default: { latitude: 20, longitude: 0 }
};

const PLACE_COORDS = {
  'Rialto Market': { latitude: 45.438, longitude: 12.3358 },
  'Dorsoduro sunset walk': { latitude: 45.428, longitude: 12.325 },
  'Lands End Trail': { latitude: 37.7849, longitude: -122.511 },
  'Ferry Building': { latitude: 37.7955, longitude: -122.3937 },
  'Fushimi Inari': { latitude: 34.9671, longitude: 135.7727 },
  'Nishiki Market': { latitude: 35.005, longitude: 135.766 },
  'Louvre evening walk': { latitude: 48.8606, longitude: 2.3376 },
  'Montmartre cafe crawl': { latitude: 48.8867, longitude: 2.3431 }
};

const PIN_COLORS = ['red', 'blue', 'green', 'orange', 'purple', 'teal'];

function colorForBoard(boardId) {
  const hash = boardId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return PIN_COLORS[hash % PIN_COLORS.length];
}

function offsetFromCenter(center, index) {
  const angle = index * 0.85;
  const radius = 0.012 + index * 0.004;
  return {
    latitude: center.latitude + Math.cos(angle) * radius,
    longitude: center.longitude + Math.sin(angle) * radius
  };
}

export function collectAllMapPins(boards) {
  const pins = [];

  boards.forEach((board) => {
    const key = detectDestinationKey(board);
    const center = CITY_CENTERS[key] ?? CITY_CENTERS.default;
    const places = board.placesList ?? [];

    places.forEach((place, index) => {
      const coords = PLACE_COORDS[place.name] ?? offsetFromCenter(center, index);
      pins.push({
        id: `${board.id}-${place.id}`,
        latitude: coords.latitude,
        longitude: coords.longitude,
        title: place.name,
        subtitle: board.title,
        note: place.note,
        boardId: board.id,
        color: colorForBoard(board.id)
      });
    });
  });

  return pins;
}

export function getMapRegion(pins, padding = 1.4) {
  if (!pins.length) {
    return {
      latitude: 37.7749,
      longitude: -122.4194,
      latitudeDelta: 60,
      longitudeDelta: 60
    };
  }

  const lats = pins.map((pin) => pin.latitude);
  const lngs = pins.map((pin) => pin.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const latitude = (minLat + maxLat) / 2;
  const longitude = (minLng + maxLng) / 2;
  const latitudeDelta = Math.max((maxLat - minLat) * padding, 0.08);
  const longitudeDelta = Math.max((maxLng - minLng) * padding, 0.08);

  return { latitude, longitude, latitudeDelta, longitudeDelta };
}
