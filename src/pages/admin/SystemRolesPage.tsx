import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/shared/PageHeader"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { ErrorState } from "@/components/shared/ErrorState"
import { apiClient } from "@/api/client"
import type { SystemRole, SystemPermission } from "@/api/types"
import { ApiError } from "@/api/client"

interface RoleWithPermissions extends SystemRole {
  permissions?: SystemPermission[]
}

export function SystemRolesPage() {
  const [addPermTarget, setAddPermTarget] = useState<SystemRole | null>(null)
  const [selectedPermId, setSelectedPermId] = useState("")
  const qc = useQueryClient()

  const { data: rolesData, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "roles"],
    queryFn: () => apiClient.get<{ roles: RoleWithPermissions[] }>("/api/admin/roles"),
    staleTime: 60_000,
  })

  const { data: permissionsData } = useQuery({
    queryKey: ["admin", "permissions"],
    queryFn: () => apiClient.get<{ permissions: SystemPermission[] }>("/api/admin/permissions"),
    staleTime: 60_000,
  })

  const { mutate: addPerm, isPending: adding } = useMutation({
    mutationFn: ({ roleId, permissionId }: { roleId: string; permissionId: string }) =>
      apiClient.post(`/api/admin/roles/${roleId}/permissions`, { permissionId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "roles"] })
      toast.success("Permission added")
      setAddPermTarget(null)
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? err.message : "Failed to add permission"
      toast.error(msg)
    },
  })

  const { mutate: removePerm } = useMutation({
    mutationFn: ({ roleId, permId }: { roleId: string; permId: string }) =>
      apiClient.delete(`/api/admin/roles/${roleId}/permissions/${permId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "roles"] })
      toast.success("Permission removed")
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? err.message : "Failed to remove permission"
      toast.error(msg)
    },
  })

  if (isLoading) return <LoadingSpinner className="py-16" />
  if (isError) return <ErrorState message="Failed to load roles" retry={refetch} />

  return (
    <div className="max-w-3xl">
      <PageHeader title="System Roles" />

      <div className="space-y-4">
        {rolesData?.roles?.map((role) => (
          <Card key={role.id}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base">{role.name}</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setAddPermTarget(role); setSelectedPermId("") }}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Permission
              </Button>
            </CardHeader>
            <CardContent>
              {role.permissions && role.permissions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {role.permissions.map((perm) => (
                    <Badge
                      key={perm.id}
                      variant="secondary"
                      className="gap-1 pl-2 pr-1"
                    >
                      <span className="font-mono text-xs">{perm.name}</span>
                      <button
                        onClick={() => removePerm({ roleId: role.id, permId: perm.id })}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No permissions assigned.</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!addPermTarget} onOpenChange={(o) => { if (!o) setAddPermTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Permission to {addPermTarget?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <Select value={selectedPermId} onValueChange={(v) => setSelectedPermId(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Select a permission" />
              </SelectTrigger>
              <SelectContent>
                {permissionsData?.permissions?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <span className="font-mono text-sm">{p.name}</span>
                    {p.description && <span className="text-muted-foreground ml-2 text-xs">{p.description}</span>}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              className="w-full"
              disabled={!selectedPermId || adding}
              onClick={() => {
                if (!addPermTarget) return
                addPerm({ roleId: addPermTarget.id, permissionId: selectedPermId })
              }}
            >
              {adding ? "Adding..." : "Add Permission"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
