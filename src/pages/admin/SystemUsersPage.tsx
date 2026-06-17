import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { UserCog } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog"
import { PageHeader } from "@/components/shared/PageHeader"
import { DataTable, type Column } from "@/components/shared/DataTable"
import { ProviderBadge } from "@/components/shared/ProviderBadge"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { ErrorState } from "@/components/shared/ErrorState"
import { apiClient } from "@/api/client"
import { formatDate } from "@/lib/utils"
import type { User, SystemRole } from "@/api/types"
import { ApiError } from "@/api/client"

export function SystemUsersPage() {
  const [page, setPage] = useState(1)
  const [roleTarget, setRoleTarget] = useState<User | null>(null)
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const qc = useQueryClient()

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "users", page],
    queryFn: () => apiClient.get<{ users: User[]; pagination: import("@/api/types").Pagination }>(`/api/admin/users?page=${page}`),
    staleTime: 30_000,
  })

  const { data: rolesData } = useQuery({
    queryKey: ["admin", "roles"],
    queryFn: () => apiClient.get<{ roles: SystemRole[] }>("/api/admin/roles"),
    staleTime: 60_000,
  })

  const { mutate: assignRoles, isPending: assigning } = useMutation({
    mutationFn: ({ userId, add, remove }: { userId: string; add: string[]; remove: string[] }) =>
      apiClient.patch(`/api/admin/users/${userId}/roles`, { add, remove }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] })
      toast.success("Roles updated")
      setRoleTarget(null)
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? err.message : "Failed to update roles"
      toast.error(msg)
    },
  })

  if (isLoading) return <LoadingSpinner className="py-16" />
  if (isError) return <ErrorState message="Failed to load users" retry={refetch} />

  const columns: Column<User>[] = [
    { key: "name", header: "Name", cell: (u) => u.name ?? "-" },
    { key: "email", header: "Email", cell: (u) => u.email },
    { key: "provider", header: "Auth", cell: (u) => <ProviderBadge provider={u.provider} /> },
    { key: "joined", header: "Joined", cell: (u) => formatDate(u.createdAt) },
    {
      key: "actions",
      header: "",
      cell: (u) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            setRoleTarget(u)
            setSelectedRoles([])
          }}
        >
          <UserCog className="h-4 w-4 mr-2" />
          Roles
        </Button>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="System Users" />
      <DataTable
        columns={columns}
        data={data?.users ?? []}
        pagination={data?.pagination}
        onPageChange={setPage}
      />

      <Dialog open={!!roleTarget} onOpenChange={(o) => { if (!o) setRoleTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Roles — {roleTarget?.email}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            {rolesData?.roles?.map((role) => (
              <div key={role.id} className="flex items-center gap-2">
                <Checkbox
                  id={`role-${role.id}`}
                  checked={selectedRoles.includes(role.id)}
                  onCheckedChange={(checked) => {
                    setSelectedRoles((prev) =>
                      checked ? [...prev, role.id] : prev.filter((r) => r !== role.id)
                    )
                  }}
                />
                <Label htmlFor={`role-${role.id}`}>{role.name}</Label>
              </div>
            ))}
          </div>
          <Button
            className="mt-4 w-full"
            disabled={assigning}
            onClick={() => {
              if (!roleTarget) return
              assignRoles({ userId: roleTarget.id, add: selectedRoles, remove: [] })
            }}
          >
            {assigning ? "Saving..." : "Apply Roles"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
