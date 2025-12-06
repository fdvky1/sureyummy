'use client'

import { useState } from "react"
import { Role } from "@/generated/prisma/browser"
import { createUser, updateUser, deleteUser } from "./actions"
import useToastStore from "@/stores/toast"
import useModalStore from "@/stores/modal"

type User = {
  id: string
  name: string | null
  email: string
  role: Role
  createdAt: Date
  updatedAt: Date
}

export default function UsersView({ initialUsers }: { initialUsers: User[] }) {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [isCreating, setIsCreating] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const { setMessage } = useToastStore()
  const { setModal, resetModal } = useModalStore()

  const [formData, setFormData] = useState<{
    name: string
    email: string
    password: string
    role: Role
  }>({
    name: '',
    email: '',
    password: '',
    role: Role.CASHIER
  })

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: Role.CASHIER
    })
    setIsCreating(false)
    setEditingUser(null)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await createUser(formData)
    
    if (result.success && result.data) {
      setUsers([result.data, ...users])
      setMessage('User berhasil dibuat', 'success')
      resetForm()
    } else {
      setMessage(result.error || 'Gagal membuat user', 'error')
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return
    
    const updateData: any = {
      name: formData.name,
      email: formData.email,
      role: formData.role
    }
    if (formData.password) {
      updateData.password = formData.password
    }
    
    const result = await updateUser(editingUser.id, updateData)
    
    if (result.success && result.data) {
      setUsers(users.map(u => u.id === editingUser.id ? result.data! : u))
      setMessage('User berhasil diubah', 'success')
      resetForm()
    } else {
      setMessage(result.error || 'Gagal mengubah user', 'error')
    }
  }

  const handleDelete = (user: User) => {
    setModal({
      title: 'Hapus User',
      content: `Yakin ingin menghapus user ${user.name || user.email}?`,
      cancelButton: {
        text: 'Batal',
        active: true,
        onClick: () => resetModal()
      },
      confirmButton: {
        text: 'Hapus',
        active: true,
        className: 'btn-error',
        onClick: async () => {
          resetModal()
          const result = await deleteUser(user.id)
          
          if (result.success) {
            setUsers(users.filter(u => u.id !== user.id))
            setMessage('User berhasil dihapus', 'success')
          } else {
            setMessage(result.error || 'Gagal menghapus user', 'error')
          }
        }
      }
    })
  }

  const startEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      name: user.name || '',
      email: user.email,
      password: '',
      role: user.role
    })
    setIsCreating(true)
  }

  const getRoleBadge = (role: Role) => {
    const badges = {
      ADMIN: 'badge-error',
      KITCHEN_STAFF: 'badge-primary',
      CASHIER: 'badge-success'
    }
    
    const labels = {
      ADMIN: 'Admin',
      KITCHEN_STAFF: 'Dapur',
      CASHIER: 'Kasir'
    }
    
    return (
      <span className={`badge ${badges[role]}`}>
        {labels[role]}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-base-200">
      {/* Header */}
      <div className="bg-primary text-primary-content p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">User Management</h1>
              <p className="text-sm opacity-90 mt-1">Kelola user dan akses sistem</p>
            </div>
            <div className="stats shadow bg-primary-content text-primary">
              <div className="stat">
                <div className="stat-title text-xs">Total Akun</div>
                <div className="stat-value text-2xl">{users.length}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-1">
            <div className="card bg-base-100 shadow-xl sticky top-6">
              <div className="card-body">
                <h2 className="card-title">
                  {editingUser ? 'Perbarui akun' : 'Buat akun'}
                </h2>
                <div className="divider my-2"></div>

                {!isCreating && !editingUser ? (
                  <button
                    className="btn btn-primary btn-block"
                    onClick={() => setIsCreating(true)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                    </svg>
                    Buat Akun Baru
                  </button>
                ) : (
                  <form onSubmit={editingUser ? handleUpdate : handleCreate} className="space-y-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Nama</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Email</span>
                      </label>
                      <input
                        type="email"
                        className="input input-bordered"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">
                          Password {editingUser && '(kosongkan jika tidak ingin diubah)'}
                        </span>
                      </label>
                      <input
                        type="password"
                        className="input input-bordered"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required={!editingUser}
                      />
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Role</span>
                      </label>
                      <select
                        className="select select-bordered"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                      >
                        <option value={Role.CASHIER}>Kasir</option>
                        <option value={Role.KITCHEN_STAFF}>Staff Dapur</option>
                        <option value={Role.ADMIN}>Admin</option>
                      </select>
                    </div>

                    <div className="flex gap-2">
                      <button type="submit" className="btn btn-primary flex-1">
                        {editingUser ? 'Update' : 'Simpan'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={resetForm}
                      >
                        Batal
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* Users List */}
          <div className="lg:col-span-2">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">Daftar User</h2>
                <div className="divider my-2"></div>

                {users.length === 0 ? (
                  <div className="text-center py-16">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-base-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="text-lg text-base-content/70">Belum ada user</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Nama</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Dibuat</th>
                          <th>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr key={user.id}>
                            <td>
                              <div className="font-semibold">{user.name}</div>
                            </td>
                            <td>{user.email}</td>
                            <td>{getRoleBadge(user.role)}</td>
                            <td className="text-sm">
                              {new Date(user.createdAt).toLocaleDateString('id-ID')}
                            </td>
                            <td>
                              <div className="flex gap-2">
                                <button
                                  className="btn btn-sm btn-ghost"
                                  onClick={() => startEdit(user)}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                  </svg>
                                </button>
                                <button
                                  className="btn btn-sm btn-ghost text-error"
                                  onClick={() => handleDelete(user)}
                                  disabled={user.role === Role.ADMIN}
                                  title={user.role === Role.ADMIN ? 'Akun admin tidak bisa dihapus' : ''}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
