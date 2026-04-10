import { describe, expect, it } from 'vitest';
import {
  BOARD_STATUS_ORDER,
  canCancelOrderStatus,
  getNextOrderStatus,
  isTerminalOrderStatus,
} from './orderStatus';

describe('orderStatus helpers', () => {
  it('exposes the board order and status transitions', () => {
    expect(BOARD_STATUS_ORDER).toEqual([
      'pending',
      'preparing',
      'ready',
      'completed',
      'canceled',
    ]);
    expect(getNextOrderStatus('pending')).toBe('preparing');
    expect(getNextOrderStatus('preparing')).toBe('ready');
    expect(getNextOrderStatus('ready')).toBe('completed');
    expect(getNextOrderStatus('completed')).toBeNull();
    expect(getNextOrderStatus('canceled')).toBeNull();
    expect(canCancelOrderStatus('pending')).toBe(true);
    expect(canCancelOrderStatus('preparing')).toBe(true);
    expect(canCancelOrderStatus('ready')).toBe(false);
    expect(isTerminalOrderStatus('completed')).toBe(true);
    expect(isTerminalOrderStatus('canceled')).toBe(true);
  });

  it('returns null for runtime-invalid statuses', () => {
    expect(getNextOrderStatus('invalid' as never)).toBeNull();
  });
});
