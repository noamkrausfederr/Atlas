import { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { getMapRegion } from '../../data/mapPins';

export function FullMapScreen({ pins, onBack }) {
  const region = useMemo(() => getMapRegion(pins, 1.25), [pins]);

  return (
    <View style={styles.fullMapScreen}>
      <View style={styles.fullMapHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.fullMapHeaderText}>
          <Text style={styles.fullMapTitle}>All saved places</Text>
          <Text style={styles.fullMapMeta}>{pins.length} pins across your trips</Text>
        </View>
      </View>
      <MapView style={styles.fullMap} initialRegion={region}>
        {pins.map((pin) => (
          <Marker
            key={pin.id}
            coordinate={{ latitude: pin.latitude, longitude: pin.longitude }}
            title={pin.title}
            description={`${pin.subtitle}${pin.note ? ` · ${pin.note}` : ''}`}
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  fullMapScreen: {
    flex: 1,
    backgroundColor: '#FFF8F0',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2D3BF',
    overflow: 'hidden'
  },
  fullMapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EDE3D6'
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#F2D8D8'
  },
  backButtonText: {
    color: '#A97C50',
    fontWeight: '700'
  },
  fullMapHeaderText: {
    flex: 1
  },
  fullMapTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#4B3A32'
  },
  fullMapMeta: {
    marginTop: 2,
    fontSize: 13,
    color: '#7F7063'
  },
  fullMap: {
    flex: 1,
    minHeight: 320
  }
});
