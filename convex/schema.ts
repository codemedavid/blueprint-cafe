import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { orderFields } from './orderFields';

export default defineSchema({
  orders: defineTable({
    ...orderFields,
    submittedAt: v.number(),
    startedAt: v.optional(v.number()),
    readyAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    canceledAt: v.optional(v.number()),
  }).index('by_status_and_submittedAt', ['status', 'submittedAt']),
});
