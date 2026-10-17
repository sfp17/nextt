'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { saveDish } from '../actions';

const CATS = [
  ['ethiopian', 'Ethiopian'],
  ['burgers', 'Burgers'],
  ['pizza', 'Pizza'],
  ['sides', 'Sides'],
  ['drinks', 'Drinks'],
];

function Err({ id, errors }) {
  return errors?.[id] ? <span id={`${id}-error`} className="error-text">{errors[id][0]}</span> : null;
}
const a11y = (id, errors) => ({
  'aria-invalid': errors?.[id] ? 'true' : undefined,
  'aria-describedby': errors?.[id] ? `${id}-error` : undefined,
});

export default function DishForm({ dish, photos }) {
  const [state, formAction, pending] = useActionState(saveDish, { values: dish ?? {}, fieldErrors: {}, error: '' });
  const v = state.values ?? {};
  const e = state.fieldErrors ?? {};
  const [image, setImage] = useState(v.image ?? photos[0]?.src);

  return (
    <form action={formAction} className="card admin-form" noValidate aria-busy={pending}>
      {dish && <input type="hidden" name="id" value={dish.id} />}
      {state.error && <p role="alert" className="notice notice-error">{state.error}</p>}

      <div className="admin-form-grid">
        <div>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input id="name" name="name" className="form-control" defaultValue={v.name} required {...a11y('name', e)} />
            <Err id="name" errors={e} />
          </div>
          <div className="admin-two">
            <div className="form-group">
              <label htmlFor="price">Price (ETB)</label>
              <input id="price" name="price" type="number" inputMode="numeric" min="1" step="1" className="form-control" defaultValue={v.price} required {...a11y('price', e)} />
              <Err id="price" errors={e} />
            </div>
            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select id="category" name="category" className="form-control" defaultValue={v.category ?? ''} key={`cat-${v.category ?? ''}`} required {...a11y('category', e)}>
                <option value="" disabled>Choose…</option>
                {CATS.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
              </select>
              <Err id="category" errors={e} />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="desc">Description</label>
            <textarea id="desc" name="desc" rows={3} className="form-control" defaultValue={v.desc} required {...a11y('desc', e)} />
            <Err id="desc" errors={e} />
          </div>
          {/* The whole row is the label, so the tap target is the full 44 px row, not just the box. */}
          <label className="form-group checkbox-row" htmlFor="available">
            <input id="available" name="available" type="checkbox" defaultChecked={v.available !== false} />
            <span>Show on the menu</span>
          </label>
        </div>

        <div>
          <div className="form-group">
            <label htmlFor="image">Photo</label>
            <select id="image" name="image" className="form-control" value={image} onChange={(ev) => setImage(ev.target.value)} {...a11y('image', e)}>
              {photos.map((p) => <option key={p.src} value={p.src}>{p.label}</option>)}
            </select>
            <Err id="image" errors={e} />
            {image && (
              <Image src={image} alt="" width={1200} height={900} sizes="(max-width: 760px) 100vw, 360px" className="admin-preview" />
            )}
          </div>
          <div className="form-group">
            <label htmlFor="imageAlt">Photo description (alt text)</label>
            <input id="imageAlt" name="imageAlt" className="form-control" defaultValue={v.imageAlt} required {...a11y('imageAlt', e)} />
            <span className="field-hint">What the photo shows, for screen readers and if it fails to load.</span>
            <Err id="imageAlt" errors={e} />
          </div>
        </div>
      </div>

      <div className="admin-form-actions">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? 'Saving…' : dish ? 'Save changes' : 'Add to menu'}
        </button>
        <Link href="/admin/menu" className="btn btn-quiet">Cancel</Link>
      </div>
    </form>
  );
}
