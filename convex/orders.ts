import { ConvexError, v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { orderFields } from './orderFields';
import {
  BOARD_STATUS_ORDER,
  getNextOrderStatus,
  orderStatusValidator,
  type OrderStatus,
} from './orderStatus';

const createOrderFields = {
  ...orderFields,
  status: v.literal('pending'),
};

function getAdvanceOrderPatch(status: OrderStatus, now: number):
  | {
      status: OrderStatus;
      startedAt?: number;
      readyAt?: number;
      completedAt?: number;
    }
  | null {
  const nextStatus = getNextOrderStatus(status);

  if (!nextStatus) {
    return null;
  }

  if (nextStatus === 'preparing') {
    return { status: nextStatus, startedAt: now };
  }

  if (nextStatus === 'ready') {
    return { status: nextStatus, readyAt: now };
  }

  return { status: nextStatus, completedAt: now };
}

export const createOrder = mutation({
  args: {
    order: v.object(createOrderFields),
  },
  handler: async (ctx, { order }) => {
    const orderId = await ctx.db.insert('orders', {
      ...order,
      submittedAt: Date.now(),
    });

    return { orderId };
  },
});

export const listBoardOrders = query({
  args: {},
  handler: async (ctx) => {
    const perStatusLimit = 50;
    const ordersByStatus = await Promise.all(
      BOARD_STATUS_ORDER.map(async (status) => {
        return await ctx.db
          .query('orders')
          .withIndex('by_status_and_submittedAt', (q) =>
            q.eq('status', status),
          )
          .order('desc')
          .take(perStatusLimit);
      }),
    );

    return ordersByStatus.flat();
  },
});

export const advanceOrderStatus = mutation({
  args: {
    orderId: v.id('orders'),
    currentStatus: orderStatusValidator,
  },
  handler: async (ctx, { orderId, currentStatus }) => {
    const order = await ctx.db.get(orderId);

    if (!order) {
      throw new ConvexError('Order not found');
    }

    if (order.status !== currentStatus) {
      throw new ConvexError('Order status changed');
    }

    const patch = getAdvanceOrderPatch(order.status, Date.now());

    if (!patch) {
      throw new ConvexError('Order is already completed');
    }

    await ctx.db.patch(orderId, patch);

    return { orderId, status: patch.status };
  },
});
