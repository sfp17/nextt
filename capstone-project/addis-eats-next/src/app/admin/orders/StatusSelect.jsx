'use client';

import { useState, useTransition } from 'react';
import { quickSetStatus } from '../actions';

const OPTIONS = [
  ['placed', 'Order placed'],
  ['preparing', 'Preparing'],
  ['on_the_way', 'On the way'],
  ['delivered', 'Delivered'],
  ['cancelled', 'Cancelled'],
];

/** Change an order's status straight from the list. Saves as soon as you pick. */
export default function StatusSelect({ id, status }) {
  const [value, setValue] = useState(status);
  const [msg, setMsg] = useState('');
  const [pending, start] = useTransition();
  return (
    <span className="status-select">
      <label htmlFor={`status-${id}`} className="visually-hidden">Status of {id}</label>
      <select
        id={`status-${id}`}
        className={`form-control status-${value}`}
        value={value}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value;
          const prev = value;
          setValue(next);
          start(async () => {
            const res = await quickSetStatus(id, next);
            if (res?.ok) setMsg('Saved');
            else {
              setValue(prev);
              setMsg(res?.error ?? 'Not saved');
            }
          });
        }}
      >
        {OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <span className="status-saved" role="status">{pending ? 'Saving…' : msg}</span>
    </span>
  );
}
