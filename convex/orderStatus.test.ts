import { describe, expect, it } from 'vitest';
import {
  BOARD_STATUS_ORDER,
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
    ]);
    expect(getNextOrderStatus('pending')).toBe('preparing');
    expect(getNextOrderStatus('preparing')).toBe('ready');
    expect(getNextOrderStatus('ready')).toBe('completed');
    expect(getNextOrderStatus('completed')).toBeNull();
    expect(isTerminalOrderStatus('completed')).toBe(true);
  });

  it('returns null for runtime-invalid statuses', () => {
    expect(getNextOrderStatus('invalid' as never)).toBeNull();
  });
});
