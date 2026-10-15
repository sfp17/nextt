// The ONE fetcher used by every SWR query in Addis Eats.
// - The SWR key IS the URL, so the fetcher just GETs it.
// - Non-2xx responses throw, so SWR puts them in `error` (and retries)
//   instead of handing a `{ error: ... }` body to the UI as if it were data.
export async function fetcher(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });

  if (!res.ok) {
    const err = new Error(`Request to ${url} failed with ${res.status}`);
    err.status = res.status;
    try {
      err.info = await res.json();
    } catch {
      err.info = null;
    }
    throw err;
  }

  return res.json();
}
