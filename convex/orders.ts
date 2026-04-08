import { v } from 'convex/values';
import { mutation } from './_generated/server';
import { orderFields } from './orderFields';

export const createOrder = mutation({
  args: {
    order: v.object(orderFields),
  },
  handler: async (ctx, { order }) => {
    const orderId = await ctx.db.insert('orders', {
      ...order,
      submittedAt: Date.now(),
    });

    return { orderId };
  },
});
