import { ConvexReactClient } from 'convex/react';

const convexUrl = import.meta.env.VITE_CONVEX_URL;

if (!convexUrl) {
  throw new Error('Missing Convex environment variable: VITE_CONVEX_URL');
}

export const convex = new ConvexReactClient(convexUrl);
