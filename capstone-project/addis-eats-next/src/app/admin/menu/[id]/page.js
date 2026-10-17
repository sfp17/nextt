import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getDish, PHOTO_LIBRARY } from '@/lib/menu';
import DishForm from '../DishForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Edit dish' };

export default async function EditDish({ params }) {
  const { id } = await params;
  const dish = await getDish(id, { includeHidden: true });
  if (!dish) notFound();
  return (
    <>
      <h1 className="admin-title">Edit {dish.name}</h1>
      <p className="admin-help">
        Public page: <Link href={`/menu/${dish.id}`} className="inline-link">/menu/{dish.id}</Link>. It updates as soon as you save.
      </p>
      <DishForm dish={dish} photos={PHOTO_LIBRARY} />
    </>
  );
}
