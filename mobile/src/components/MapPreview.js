import { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { getMapRegion } from '../../data/mapPins';

export function MapPreview({ pins, onPress }) {
  const region = useMemo(() => getMapRegion(pins, 1.6), [pins]);

  return (
    <View style={styles.mapPreviewTouchable}>
      <MapView
        style={styles.mapPreviewMap}
        region={region}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
      >
        {pins.map((pin) => (
          <Marker
            key={pin.id}
            coordinate={{ latitude: pin.latitude, longitude: pin.longitude }}
            title={pin.title}
            description={pin.subtitle}
          />
        ))}
      </MapView>
      <TouchableOpacity onPress={onPress} activeOpacity={0.92} style={StyleSheet.absoluteFill}>
        <View style={styles.mapPreviewOverlay}>
          <Text style={styles.mapPreviewOverlayText}>Tap to open full map</Text>
          <Text style={styles.mapPreviewOverlaySubtext}>{pins.length} saved places</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  mapPreviewTouchable: {
    borderRadius: 20,
    overflow: 'hidden',
    height: 200
  },
  mapPreviewMap: {
    ...StyleSheet.absoluteFillObject
  },
  mapPreviewOverlay: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2D3BF'
  },
  mapPreviewOverlayText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B3A32'
  },
  mapPreviewOverlaySubtext: {
    marginTop: 2,
    fontSize: 12,
    color: '#7F7063'
  }
});
