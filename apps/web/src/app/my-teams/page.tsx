import { redirect } from 'next/navigation'

export default function MyTeamsRedirect() {
  redirect('/admin/employees')
}
