import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Role } from "@/generated/prisma/client"
import UsersView from "./UsersView"
import { getUsers } from "./actions"

export default async function UsersPage() {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== Role.ADMIN) {
    redirect('/dashboard')
  }

  const result = await getUsers()
  const users = result.success ? result.data : []

  return <UsersView initialUsers={users || []} />
}
