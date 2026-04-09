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
    <View accessibilityRole="tablist" style={styles.container}>
      {ORDER_STATUS_TABS.map((tab) => {
        const isSelected = tab.status === selectedStatus;

        return (
          <Pressable
            key={tab.status}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: isSelected }}
            onPress={() => onSelect(tab.status)}
            style={({ pressed }) => [
              styles.tab,
              isSelected && styles.tabSelected,
              pressed && styles.tabPressed,
            ]}
          >
            <Text numberOfLines={1} style={[styles.label, isSelected && styles.labelSelected]}>
              {tab.label}
            </Text>
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
    gap: theme.spacing.xs,
  },
  tab: {
    flex: 1,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  tabSelected: {
    borderColor: 'rgba(234, 88, 12, 0.75)',
    backgroundColor: 'rgba(234, 88, 12, 0.12)',
  },
  tabPressed: {
    opacity: 0.85,
  },
  label: {
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  labelSelected: {
    color: theme.colors.text,
  },
  count: {
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: '600',
  },
});
