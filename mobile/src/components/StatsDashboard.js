import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fonts, shadow } from '../theme';

const CELLS = [
  { key: 'trips',     icon: 'airplane',         bg: '#D8EAF8', iconColor: '#1A508A', labelColor: '#4A78A8' },
  { key: 'countries', icon: 'globe-outline',     bg: '#FAE8D8', iconColor: '#884018', labelColor: '#A86030' },
  { key: 'places',    icon: 'location',          bg: '#D8F0E4', iconColor: '#185A38', labelColor: '#388058' },
  { key: 'upcoming',  icon: 'calendar-outline',  bg: '#EAD8F8', iconColor: '#481880', labelColor: '#6840A8' },
];

function StatCell({ icon, bg, iconColor, labelColor, value, label }) {
  return (
    <View style={[styles.cell, { backgroundColor: bg }]}>
      <View style={[styles.iconRing, { backgroundColor: `${bg}`, borderColor: iconColor + '22' }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <Text style={[styles.value, { color: iconColor }]}>{value}</Text>
      <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
    </View>
  );
}

const ROW_1 = [CELLS[0], CELLS[1]];
const ROW_2 = [CELLS[2], CELLS[3]];

export function StatsDashboard({ trips, countries, places, upcoming }) {
  const values = { trips, countries, places, upcoming };
  const labels = { trips: 'Trips', countries: 'Countries', places: 'Places', upcoming: 'Upcoming' };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {ROW_1.map((cell) => (
          <StatCell key={cell.key} icon={cell.icon} bg={cell.bg} iconColor={cell.iconColor} labelColor={cell.labelColor} value={values[cell.key]} label={labels[cell.key]} />
        ))}
      </View>
      <View style={styles.row}>
        {ROW_2.map((cell) => (
          <StatCell key={cell.key} icon={cell.icon} bg={cell.bg} iconColor={cell.iconColor} labelColor={cell.labelColor} value={values[cell.key]} label={labels[cell.key]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  cell: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'flex-start',
    gap: 6,
    ...shadow.sm,
  },
  iconRing: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  value: {
    fontSize: 28,
    fontFamily: 'Nunito_900Black',
    fontWeight: '900',
    lineHeight: 32,
  },
  label: {
    fontSize: 12,
    fontFamily: 'Nunito_700Bold',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
});
