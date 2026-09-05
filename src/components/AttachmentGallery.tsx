import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ZoomImage } from '@/components/ImageLightbox';
import { Paperclip, X, FileText, Download, ImagePlus } from 'lucide-react';

export interface Attachment {
  id: string;
  name: string;
  type: string;
  data: string;
}

const MAX_BYTES = 3 * 1024 * 1024;

interface Props {
  value: Attachment[];
  onChange?: (next: Attachment[]) => void;
  readOnly?: boolean;
  compact?: boolean;
}

/** Image + file attachments (stored as base64). Images open fullscreen when clicked. */
export const AttachmentGallery = ({ value, onChange, readOnly, compact }: Props) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const items = value ?? [];

  const addFiles = (files: FileList | null) => {
    if (!files || !onChange) return;
    Array.from(files).forEach(f => {
      if (f.size > MAX_BYTES) {
        alert(`"${f.name}" é muito grande (máx 3MB).`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        onChange([
          ...(value ?? []),
          { id: crypto.randomUUID(), name: f.name, type: f.type || 'application/octet-stream', data: reader.result as string },
        ]);
      };
      reader.readAsDataURL(f);
    });
    if (fileRef.current) fileRef.current.value = '';
  };

  const remove = (id: string) => onChange?.(items.filter(a => a.id !== id));

  if (readOnly && items.length === 0) return null;

  const size = compact ? 'w-16 h-16' : 'w-20 h-20';

  return (
    <div className="space-y-2">
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {items.map(a => {
            const isImg = a.type.startsWith('image/') || a.data.startsWith('data:image');
            return (
              <div key={a.id} className="relative group">
                {isImg ? (
                  <ZoomImage
                    src={a.data}
                    alt={a.name}
                    className={`${size} rounded-lg ring-1 ring-border/60 bg-secondary`}
                    imgClassName="w-full h-full object-cover"
                  />
                ) : (
                  <a
                    href={a.data}
                    download={a.name}
                    className={`${size} rounded-lg ring-1 ring-border/60 bg-secondary flex flex-col items-center justify-center gap-1 p-1 text-center hover:ring-primary/60 transition`}
                  >
                    <FileText className="w-5 h-5 text-muted-foreground" />
                    <span className="text-[9px] leading-tight line-clamp-2 break-all">{a.name}</span>
                    <Download className="w-3 h-3 text-muted-foreground" />
                  </a>
                )}
                {!readOnly && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); remove(a.id); }}
                    className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5 shadow-md opacity-90 hover:opacity-100"
                    title="Remover"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!readOnly && (
        <>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/*,.pdf,.txt,.md,.json"
            className="hidden"
            onChange={e => addFiles(e.target.files)}
          />
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => fileRef.current?.click()}>
              <ImagePlus className="w-3.5 h-3.5" />Adicionar arquivos
            </Button>
            {items.length > 0 && (
              <Badge variant="secondary" className="text-[10px] gap-1">
                <Paperclip className="w-3 h-3" />{items.length}
              </Badge>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground">Imagens, PDFs ou textos até 3MB. Toque na imagem para abrir em tela cheia.</p>
        </>
      )}
    </div>
  );
};
