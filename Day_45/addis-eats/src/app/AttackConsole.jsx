'use client';

import { useEffect } from 'react';
import { cancelOrder, markOrderDelivered } from './actions';

/**
 * Puts two server actions on `window` so the Day 45 attacks can be run from the
 * browser console exactly as written on the slide:
 *
 *   await cancelOrder("ORD-DEMO")          // signed out → refused (401)
 *   await cancelOrder("<someone else's>")  // as Sara → refused on ownership (404)
 *   await markOrderDelivered("ORD-DEMO")   // as a customer → refused on role (403)
 *
 * This grants NOTHING new: a server action is already a public POST endpoint
 * that anyone can call with a hand-written request. That is exactly why every
 * action checks the session, ownership and role itself (AUTH.md).
 */
export default function AttackConsole() {
  useEffect(() => {
    window.cancelOrder = cancelOrder;
    window.markOrderDelivered = markOrderDelivered;
  }, []);
  return null;
}
