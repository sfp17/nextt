'use client';

export default function MenuError({ reset }) {
  return (
    <div className="card empty-state">
      <h2>The menu didn&apos;t load</h2>
      <p>Something went wrong on our side. Try again, and if it keeps happening, refresh the page.</p>
      <button type="button" onClick={() => reset()} className="btn btn-primary">
        Try again
      </button>
    </div>
  );
}
