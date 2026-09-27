import { redirect } from 'next/navigation'

export default function ReviewUsageRedirect() {
  redirect('/admin/apps/review')
}
