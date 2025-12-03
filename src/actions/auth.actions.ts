'use server';

import { getAuthSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function redirectAfterLogin() {
  const session = await getAuthSession();
  
  if (!session?.user) {
    redirect('/signin');
  }

  const role = session.user.role;

  switch (role) {
    case 'CASHIER':
      redirect('/cashier');
    case 'KITCHEN_STAFF':
      redirect('/live');
    case 'ADMIN':
      redirect('/table');
    default:
      redirect('/signin');
  }
}
