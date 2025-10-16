import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function BottomNavigation({ activeNav, onNavigate, navigation }) {
  const navItems = [
    { name: 'Requests', icon: 'business', screen: 'Request' },
    { name: 'Reports', icon: 'document', screen: null },
    { name: 'Home', icon: 'home', screen: 'Homepage' },
    { name: 'Profile', icon: 'person', screen: 'Profile' },
  ];

  const handlePress = (item) => {
    onNavigate(item.name);
    
    // Only navigate if screen exists
    if (item.screen && navigation) {
      if (item.screen === 'Homepage') {
        // If already on homepage, scroll to top or do nothing
        return;
      }
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
          disabled={!item.screen} // Disable if no screen defined
        >
          <Ionicons
            name={item.icon}
            size={24}
            color={activeNav === item.name ? '#1E4B46' : item.screen ? '#999' : '#ccc'}
          />
          <Text
            style={[
              styles.navLabel,
              activeNav === item.name && styles.navLabelActive,
              !item.screen && styles.navLabelDisabled,
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
  navLabelDisabled: {
    color: '#ccc',
  },
});