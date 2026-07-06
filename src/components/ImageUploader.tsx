import { useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  value: string;
  onChange: (val: string) => void;
  fallbackIcon?: React.ReactNode;
  className?: string;
}

/**
 * Portrait input: accepts URL or file upload (converted to base64).
 * Live preview with clear button.
 */
export const ImageUploader = ({ value, onChange, fallbackIcon, className }: ImageUploaderProps) => {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File | undefined) => {
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) {
      alert('Imagem muito grande (máx 2MB). Escolha uma menor.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(f);
  };

  return (
    <div className={`flex items-start gap-3 ${className || ''}`}>
      <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-secondary to-secondary/40 border-2 border-dashed border-border/60 flex items-center justify-center overflow-hidden shrink-0 ring-1 ring-primary/10">
        {value ? (
          <img src={value} alt="Retrato" className="w-full h-full object-cover" />
        ) : (
          fallbackIcon || <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
        )}
      </div>
      <div className="flex-1 space-y-2 min-w-0">
        <Input
          placeholder="Cole uma URL de imagem"
          value={value.startsWith('data:') ? '' : value}
          onChange={e => onChange(e.target.value)}
        />
        <div className="flex gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => handleFile(e.target.files?.[0])}
          />
          <Button type="button" variant="outline" size="sm" className="gap-1 flex-1" onClick={() => fileRef.current?.click()}>
            <Upload className="w-3.5 h-3.5" />Enviar arquivo
          </Button>
          {value && (
            <Button type="button" variant="outline" size="sm" className="text-destructive" onClick={() => onChange('')}>
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
        {value.startsWith('data:') && <p className="text-[10px] text-muted-foreground truncate">Imagem local carregada ✓</p>}
      </div>
    </div>
  );
};
