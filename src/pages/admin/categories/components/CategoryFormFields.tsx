import { useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { CategoryFormValues } from "../index"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

// ─── Form Fields ──────────────────────────────────────────────────────────────

interface FormFieldsProps {
  form: ReturnType<typeof useForm<CategoryFormValues>>
  isLoading: boolean
  fieldPrefix?: string
}

export function CategoryFormFields({ form, isLoading, fieldPrefix = "cat" }: FormFieldsProps) {
  const watchedName = form.watch("name")
  // ponytail: ref evita re-renders; se sincroniza con defaultValues para detectar reset() del form
  const slugLocked = useRef(false)

  // Al hacer reset() cambian los defaultValues: si el slug ya tiene valor (modo editar) → lock
  const defaultSlug = (form.formState.defaultValues as { slug?: string } | undefined)?.slug ?? ""
  useEffect(() => {
    slugLocked.current = !!defaultSlug
  }, [defaultSlug])

  // Auto-generar slug mientras el usuario escribe el nombre, salvo que esté lockeado
  useEffect(() => {
    if (!slugLocked.current) {
      form.setValue("slug", slugify(watchedName), { shouldValidate: false })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedName])

  const { onChange: slugOnChange, ...slugRegisterRest } = form.register("slug")

  return (
    <div className="flex flex-col gap-4 py-2">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${fieldPrefix}-name`}>Nombre *</Label>
        <Input
          id={`${fieldPrefix}-name`}
          placeholder="Ej: Electrónica"
          disabled={isLoading}
          aria-invalid={!!form.formState.errors.name}
          autoFocus
          {...form.register("name")}
        />
        {form.formState.errors.name && (
          <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${fieldPrefix}-slug`}>Slug</Label>
        <Input
          id={`${fieldPrefix}-slug`}
          placeholder="auto-generado desde el nombre"
          disabled={isLoading}
          aria-invalid={!!form.formState.errors.slug}
          {...slugRegisterRest}
          onChange={(e) => {
            slugLocked.current = true
            slugOnChange(e)
          }}
        />
        {form.formState.errors.slug && (
          <p className="text-xs text-destructive">{form.formState.errors.slug.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${fieldPrefix}-description`}>Descripción</Label>
        <Textarea
          id={`${fieldPrefix}-description`}
          placeholder="Descripción opcional de la categoría..."
          disabled={isLoading}
          {...form.register("description")}
        />
      </div>
    </div>
  )
}
