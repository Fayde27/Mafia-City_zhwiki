export const runtime = 'edge'

import AdminBreadcrumb from '@/components/AdminBreadcrumb'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdminBreadcrumb />
      {children}
    </>
  )
}
