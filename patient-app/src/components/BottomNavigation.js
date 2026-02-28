import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function BottomNavigation({ activeNav, onNavigate, navigation }) {
  const navItems = [
    { name: 'Home', icon: 'home', screen: 'Home' },        // ✅ was 'Homepage'
    { name: 'Requests', icon: 'business', screen: 'Request' },
    { name: 'Reports', icon: 'document', screen: 'Reports' }, // ✅ was null
    { name: 'Profile', icon: 'person', screen: 'Profile' },
  ];

  const handlePress = (item) => {
    onNavigate(item.name);
    if (item.screen && navigation) {
      navigation.navigate(item.screen);
    }
  };

  return (
    <View style={styles.bottomNav}>
      {navItems.map((item) => (
        <TouchableOpacity
          key={item.name}
          style={styles.navItem}
          onPress={() => handlePress(item)}
        >
          <Ionicons
            name={item.icon}
            size={24}
            color={
              (activeNav === item.name || (!activeNav && item.name === 'Home'))
                ? '#1E4B46'
                : '#999'
            }
          />
          <Text
            style={[
              styles.navLabel,
              (activeNav === item.name || (!activeNav && item.name === 'Home')) && styles.navLabelActive,
            ]}
          >
            {item.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingVertical: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  navLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
    fontWeight: '500',
  },
  navLabelActive: {
    color: '#1E4B46',
    fontWeight: '600',
  },
});