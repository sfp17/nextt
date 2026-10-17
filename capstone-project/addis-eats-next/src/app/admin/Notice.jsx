// "Doro Wat was updated." after a save, from ?done=updated&name=… in the URL.
// The text is built here from a fixed list of verbs; the name is shown as text (React escapes it).
const VERBS = { created: 'was created', updated: 'was updated', deleted: 'was deleted', reset: 'was reset to the starting menu' };

export default function Notice({ done, name }) {
  if (!VERBS[done]) return null;
  return (
    <p className="notice notice-success admin-notice" role="status">
      <strong>{name || 'Item'}</strong> {VERBS[done]}.
    </p>
  );
}
