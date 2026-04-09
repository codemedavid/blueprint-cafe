import { Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '../constants/theme';
import {
  ORDER_STATUS_TABS,
  type StaffOrderStatus,
  type StaffOrderStatusCounts,
} from '../types/orders';

type OrdersStatusTabsProps = {
  selectedStatus: StaffOrderStatus;
  counts: StaffOrderStatusCounts;
  onSelect: (status: StaffOrderStatus) => void;
};

export function OrdersStatusTabs({
  selectedStatus,
  counts,
  onSelect,
}: OrdersStatusTabsProps) {
  return (
    <View style={styles.container}>
      {ORDER_STATUS_TABS.map((tab) => {
        const isSelected = tab.status === selectedStatus;

        return (
          <Pressable
            key={tab.status}
            accessibilityRole="button"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: isSelected }}
            onPress={() => onSelect(tab.status)}
            style={({ pressed }) => [
              styles.tab,
              isSelected && styles.tabSelected,
              pressed && styles.tabPressed,
            ]}
          >
            <Text style={[styles.label, isSelected && styles.labelSelected]}>{tab.label}</Text>
            <Text style={[styles.count, isSelected && styles.labelSelected]}>
              {counts[tab.status]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  tab: {
    flex: 1,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(248, 250, 252, 0.16)',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(249, 115, 22, 0.14)',
  },
  tabPressed: {
    opacity: 0.85,
  },
  label: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  labelSelected: {
    color: theme.colors.text,
  },
  count: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
});
