import { PHOTO_LIBRARY } from '@/lib/menu';
import DishForm from '../DishForm';

export const metadata = { title: 'Add a dish' };

export default function NewDish() {
  return (
    <>
      <h1 className="admin-title">Add a dish</h1>
      <DishForm photos={PHOTO_LIBRARY} />
    </>
  );
}
