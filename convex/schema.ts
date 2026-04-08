import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { orderFields } from './orderFields';

export default defineSchema({
  orders: defineTable({
    ...orderFields,
    submittedAt: v.number(),
  }),
});
