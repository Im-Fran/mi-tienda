import { useRef } from "react"
import { Upload, X, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface UploadedImage {
  id: string
  url: string
  isMain?: boolean
}

interface ImageUploaderProps {
  value: UploadedImage[]
  onUpload: (files: File[]) => void
  onDelete: (id: string) => void
  onSetMain?: (id: string) => void
  multiple?: boolean
  className?: string
}

export function ImageUploader({
  value,
  onUpload,
  onDelete,
  onSetMain,
  multiple = false,
  className,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    onUpload(Array.from(files))
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    handleFiles(e.dataTransfer.files)
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div
        className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          Click or drag & drop to upload {multiple ? "images" : "an image"}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {value.map((img) => (
            <div key={img.id} className="relative group rounded-md overflow-hidden border aspect-square">
              <img
                src={img.url}
                alt=""
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                {onSetMain && !img.isMain && (
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-7 w-7"
                    onClick={() => onSetMain(img.id)}
                    title="Set as main"
                  >
                    <Star className="h-3 w-3" />
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="destructive"
                  className="h-7 w-7"
                  onClick={() => onDelete(img.id)}
                  title="Delete"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              {img.isMain && (
                <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-1 rounded">
                  Main
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
