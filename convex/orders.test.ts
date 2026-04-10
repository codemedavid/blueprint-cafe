import { ConvexError } from 'convex/values';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BOARD_STATUS_ORDER, canCancelOrderStatus, isTerminalOrderStatus } from './orderStatus';

vi.mock('./_generated/server', () => ({
  mutation: (definition: unknown) => definition,
  query: (definition: unknown) => definition,
}));

import { advanceOrderStatus, getOrderById, listBoardOrders } from './orders';

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('orders board workflow', () => {
  it('includes canceled in board status order and terminal checks', () => {
    expect(BOARD_STATUS_ORDER).toEqual([
      'pending',
      'preparing',
      'ready',
      'completed',
      'canceled',
    ]);
    expect(canCancelOrderStatus('pending')).toBe(true);
    expect(canCancelOrderStatus('preparing')).toBe(true);
    expect(canCancelOrderStatus('ready')).toBe(false);
    expect(isTerminalOrderStatus('completed')).toBe(true);
    expect(isTerminalOrderStatus('canceled')).toBe(true);
  });

  it('getOrderById returns the matching order when it exists', async () => {
    const get = vi.fn().mockResolvedValue({
      _id: 'order-1',
      status: 'pending',
    });
    const ctx = { db: { get } };

    const result = await getOrderById.handler(ctx as never, {
      orderId: 'order-1',
    });

    expect(get).toHaveBeenCalledWith('order-1');
    expect(result).toEqual({
      _id: 'order-1',
      status: 'pending',
    });
  });

  it('getOrderById returns null when order does not exist', async () => {
    const get = vi.fn().mockResolvedValue(null);
    const ctx = { db: { get } };

    const result = await getOrderById.handler(ctx as never, {
      orderId: 'missing-order',
    });

    expect(get).toHaveBeenCalledWith('missing-order');
    expect(result).toBeNull();
  });

  it('listBoardOrders queries each status independently and returns board order', async () => {
    const rowsByStatus = {
      pending: [
        { _id: 'pending-2', status: 'pending' },
        { _id: 'pending-1', status: 'pending' },
      ],
      preparing: [{ _id: 'preparing-1', status: 'preparing' }],
      ready: [{ _id: 'ready-1', status: 'ready' }],
      completed: [{ _id: 'completed-1', status: 'completed' }],
      canceled: [{ _id: 'canceled-1', status: 'canceled' }],
    } as const;

    const statuses = ['pending', 'preparing', 'ready', 'completed', 'canceled'] as const;
    const observedStatuses: string[] = [];
    const orderMocks: Array<ReturnType<typeof vi.fn>> = [];
    const takeMocks: Array<ReturnType<typeof vi.fn>> = [];
    let callIndex = 0;

    const query = vi.fn(() => {
      const status = statuses[callIndex++];
      const take = vi.fn().mockResolvedValue(rowsByStatus[status]);
      takeMocks.push(take);

      const order = vi.fn(() => ({ take }));
      orderMocks.push(order);
      const withIndex = vi.fn((_indexName, predicate) => {
        const eq = vi.fn((field, value) => {
          if (field === 'status') {
            observedStatuses.push(value as string);
          }
          return null;
        });

        predicate({ eq });
        return { order };
      });

      return { withIndex };
    });

    const ctx = { db: { query } };
    const result = await listBoardOrders.handler(ctx as never, {});

    expect(query).toHaveBeenCalledTimes(5);
    expect(observedStatuses).toEqual(statuses);
    for (const order of orderMocks) {
      expect(order).toHaveBeenCalledWith('desc');
    }
    for (const take of takeMocks) {
      expect(take).toHaveBeenCalledWith(50);
    }
    expect(result).toEqual([
      ...rowsByStatus.pending,
      ...rowsByStatus.preparing,
      ...rowsByStatus.ready,
      ...rowsByStatus.completed,
      ...rowsByStatus.canceled,
    ]);
  });

  it.each([
    [
      'pending',
      {
        status: 'preparing',
        startedAt: 1710000000000,
      },
    ],
    [
      'preparing',
      {
        status: 'ready',
        readyAt: 1710000000000,
      },
    ],
    [
      'ready',
      {
        status: 'completed',
        completedAt: 1710000000000,
      },
    ],
  ])(
    'advanceOrderStatus moves %s forward and stamps the right field',
    async (currentStatus, expectedPatch) => {
      vi.spyOn(Date, 'now').mockReturnValue(1710000000000);

      const get = vi.fn().mockResolvedValue({
        _id: 'order-1',
        status: currentStatus,
      });
      const patch = vi.fn().mockResolvedValue(undefined);
      const ctx = { db: { get, patch } };

      const result = await advanceOrderStatus.handler(ctx as never, {
        orderId: 'order-1',
        currentStatus,
      });

      expect(get).toHaveBeenCalledWith('order-1');
      expect(patch).toHaveBeenCalledWith('order-1', expectedPatch);
      expect(result).toEqual({
        orderId: 'order-1',
        status: expectedPatch.status,
      });
    },
  );

  it('advanceOrderStatus rejects stale currentStatus before patching', async () => {
    const get = vi.fn().mockResolvedValue({
      _id: 'order-1',
      status: 'preparing',
    });
    const patch = vi.fn();
    const ctx = { db: { get, patch } };

    await expect(
      advanceOrderStatus.handler(ctx as never, {
        orderId: 'order-1',
        currentStatus: 'pending',
      }),
    ).rejects.toBeInstanceOf(ConvexError);

    expect(patch).not.toHaveBeenCalled();
  });

  it('advanceOrderStatus rejects completed orders with ConvexError', async () => {
    const get = vi.fn().mockResolvedValue({
      _id: 'order-1',
      status: 'completed',
    });
    const patch = vi.fn();
    const ctx = { db: { get, patch } };

    await expect(
      advanceOrderStatus.handler(ctx as never, {
        orderId: 'order-1',
        currentStatus: 'completed',
      }),
    ).rejects.toThrowError('Order is already terminal');

    expect(patch).not.toHaveBeenCalled();
  });

  it('advanceOrderStatus rejects canceled orders with ConvexError', async () => {
    const get = vi.fn().mockResolvedValue({
      _id: 'order-1',
      status: 'canceled',
    });
    const patch = vi.fn();
    const ctx = { db: { get, patch } };

    await expect(
      advanceOrderStatus.handler(ctx as never, {
        orderId: 'order-1',
        currentStatus: 'canceled',
      }),
    ).rejects.toThrowError('Order is already terminal');

    expect(patch).not.toHaveBeenCalled();
  });
});
