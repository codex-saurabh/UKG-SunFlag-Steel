// src/features/admin/UsersAdminPage.jsx
import { PageHeader } from '@/shared/ui/PageHeader'
import { ShieldCheck, ShieldOff, Users } from 'lucide-react'
import { useState } from 'react'
import { useNotify } from '@/shared/hooks/useNotify'

// NOTE: The backend doesn't have a user management endpoint exposed in the Postman
// collection, so this page manages the HR_ADMIN audit log permission via UI state.
// When the backend adds a users API, wire it here.

const MOCK_USERS = [
  { id:1, name:'HR Admin',    email:'hr@steelplant.in',         role:'HR_ADMIN',    auditAccess: false },
  { id:2, name:'Time Office', email:'timeoffice@steelplant.in', role:'TIME_OFFICE', auditAccess: false },
]

export default function UsersAdminPage() {
  const [users, setUsers] = useState(MOCK_USERS)
  const notify = useNotify()

  const toggleAuditAccess = (id) => {
    setUsers((prev) => prev.map((u) => {
      if (u.id !== id) return u
      const updated = { ...u, auditAccess: !u.auditAccess }
      notify.success(
        updated.auditAccess ? 'Access granted' : 'Access revoked',
        `Audit log access ${updated.auditAccess ? 'enabled' : 'disabled'} for ${u.name}.`
      )
      return updated
    }))
  }

  return (
    <div>
      <PageHeader
        title="Admin"
        subtitle="Manage user roles and permissions"
      />

      {/* Audit log permissions */}
      <div className="card p-5 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] flex items-center justify-center">
            <ShieldCheck size={17} className="text-[#3B82F6]" />
          </div>
          <div>
            <h2 className="text-[13.5px] font-semibold text-[#0F172A]">Audit Log Permissions</h2>
            <p className="text-[11.5px] text-[#64748B]">
              Control which HR_ADMIN users can view the audit logs
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {users.filter(u => u.role === 'HR_ADMIN').map((u) => (
            <div key={u.id} className="flex items-center justify-between px-4 py-3 rounded-xl border border-[#E8EAF0] hover:bg-[#F8FAFC] transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[10px] font-bold text-[#1D4ED8]">
                  {u.name.split(' ').map(w=>w[0]).join('').slice(0,2)}
                </div>
                <div>
                  <div className="text-[12.5px] font-medium text-[#0F172A]">{u.name}</div>
                  <div className="text-[11px] text-[#64748B]">{u.email}</div>
                </div>
              </div>
              <button
                onClick={() => toggleAuditAccess(u.id)}
                className={`flex items-center gap-1.5 text-[11.5px] font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                  u.auditAccess
                    ? 'bg-[#DCFCE7] border-[#BBF7D0] text-[#15803D] hover:bg-[#FEF2F2] hover:border-[#FECACA] hover:text-[#B91C1C]'
                    : 'bg-white border-[#E2E8F0] text-[#64748B] hover:bg-[#EFF6FF] hover:border-[#BFDBFE] hover:text-[#1D4ED8]'
                }`}
              >
                {u.auditAccess ? <ShieldCheck size={12} /> : <ShieldOff size={12} />}
                {u.auditAccess ? 'Access Granted' : 'Grant Access'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* All users table */}
      <div className="card overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#F1F5F9]">
          <Users size={14} className="text-[#64748B]" />
          <h2 className="text-[13px] font-semibold text-[#0F172A]">All System Users</h2>
        </div>
        <table className="data-table">
          <thead>
            <tr><th>User</th><th>Email</th><th>Role</th><th>Audit Logs</th></tr>
          </thead>
          <tbody>
            <tr>
              <td className="font-medium">IT Admin</td>
              <td className="text-[#64748B]">admin@steelplant.in</td>
              <td>
                <span className="inline-flex text-[10.5px] font-semibold px-2 py-0.5 rounded-full bg-[#F3E8FF] text-[#7C3AED]">
                  IT_ADMIN
                </span>
              </td>
              <td>
                <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#15803D]">
                  <ShieldCheck size={9} />Full Access
                </span>
              </td>
            </tr>
            {users.map((u) => (
              <tr key={u.id}>
                <td className="font-medium">{u.name}</td>
                <td className="text-[#64748B]">{u.email}</td>
                <td>
                  <span className={`inline-flex text-[10.5px] font-semibold px-2 py-0.5 rounded-full ${
                    u.role==='HR_ADMIN' ? 'bg-[#DBEAFE] text-[#1D4ED8]' : 'bg-[#F1F5F9] text-[#475569]'
                  }`}>{u.role}</span>
                </td>
                <td>
                  {u.role === 'HR_ADMIN' ? (
                    u.auditAccess
                      ? <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#15803D]"><ShieldCheck size={9}/>Granted</span>
                      : <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-0.5 rounded-full bg-[#F1F5F9] text-[#64748B]"><ShieldOff size={9}/>None</span>
                  ) : (
                    <span className="text-[11px] text-[#94A3B8]">N/A</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}