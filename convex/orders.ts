import { v } from 'convex/values';
import { mutation } from './_generated/server';
import { orderFields } from './orderFields';

const createOrderFields = {
  ...orderFields,
  status: v.literal('pending'),
};

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
