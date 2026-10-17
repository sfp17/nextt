import Link from 'next/link';
import Image from 'next/image';
import { getMenu } from '@/lib/menu';
import { etb } from '@/lib/format';
import { removeDish, toggleDish, resetMenuToCode } from '../actions';
import ConfirmAction from '../ConfirmAction';
import Notice from '../Notice';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Menu' };

export default async function AdminMenu({ searchParams }) {
  const { done, name } = await searchParams;
  const menu = await getMenu({ includeHidden: true });

  return (
    <>
      <div className="admin-row">
        <h1 className="admin-title">Menu <span className="admin-count">{menu.length} dishes</span></h1>
        <Link href="/admin/menu/new" className="btn btn-primary">+ Add dish</Link>
      </div>
      <Notice done={done} name={name} />

      <div className="table-scroll">
        <table className="data-table admin-table">
          <caption className="visually-hidden">All dishes, including hidden ones</caption>
          <thead>
            <tr>
              <th scope="col">Dish</th>
              <th scope="col">Category</th>
              <th scope="col" className="num">Price (ETB)</th>
              <th scope="col">On the menu</th>
              <th scope="col"><span className="visually-hidden">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {menu.map((d) => (
              <tr key={d.id} className={d.available === false ? 'is-hidden' : undefined}>
                <th scope="row">
                  <span className="admin-dish">
                    <Image src={d.image} alt="" width={64} height={48} sizes="64px" className="admin-thumb" />
                    <span>
                      {d.name}
                      <small className="muted"> #{d.id}</small>
                    </span>
                  </span>
                </th>
                <td style={{ textTransform: 'capitalize' }}>{d.category}</td>
                <td className="num">{etb(d.price, { unit: false })}</td>
                <td>
                  <ConfirmAction
                    action={toggleDish.bind(null, d.id, d.available === false)}
                    label={d.available === false ? 'Hidden · show it' : 'Visible · hide it'}
                    className={`btn btn-quiet pill-toggle ${d.available === false ? 'off' : 'on'}`}
                    pendingLabel="Saving…"
                  />
                </td>
                <td className="admin-actions">
                  <Link href={`/admin/menu/${d.id}`} className="btn btn-secondary">Edit</Link>
                  <ConfirmAction action={removeDish.bind(null, d.id)} label="Delete" confirm={`Delete ${d.name} from the menu? This can't be undone.`} pendingLabel="Deleting…" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="admin-footnote">
        <p>
          Hidden dishes stay here but disappear from the public menu, search and checkout. Deleting removes the dish;
          past orders keep its name and price.
        </p>
        <ConfirmAction
          action={resetMenuToCode}
          label="Reset menu to the starting dishes"
          confirm="Undo every menu change made here and go back to the dishes in lib/dishes.js?"
          className="btn btn-quiet"
          pendingLabel="Resetting…"
        />
      </div>
    </>
  );
}
