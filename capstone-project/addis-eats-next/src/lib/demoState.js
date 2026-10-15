import 'server-only';

/**
 * Force one of the four states on purpose, so each can be shown in class:
 *
 *   ?demo=slow   wait 3 s before answering   → loading.js (the skeleton) is visible
 *   ?demo=empty  pretend there are no orders → the empty state
 *   ?demo=error  throw while loading         → error.js
 *   (nothing)    the real data               → the loaded state
 *
 * It only changes what the person who typed it sees: it never touches stored data,
 * and the page still checks who is signed in first.
 */
export const DEMO_STATES = ['slow', 'empty', 'error'];

export async function withDemoState(demo, load) {
  if (demo === 'error') {
    throw new Error('Forced error (?demo=error): the order data could not be loaded.');
  }
  if (demo === 'slow') await new Promise((r) => setTimeout(r, 3000));
  const data = await load();
  return demo === 'empty' ? [] : data;
}
