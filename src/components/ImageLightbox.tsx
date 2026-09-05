import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, ZoomIn, ZoomOut, RotateCw, X } from 'lucide-react';

interface LightboxProps {
  src: string;
  alt?: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

/** Fullscreen image viewer with zoom, rotate and download. */
export const ImageLightbox = ({ src, alt, open, onOpenChange }: LightboxProps) => {
  const [scale, setScale] = useState(1);
  const [rot, setRot] = useState(0);

  const close = (v: boolean) => {
    if (!v) { setScale(1); setRot(0); }
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent
        hideClose
        className="max-w-[100vw] w-[100vw] h-[100dvh] sm:max-w-[95vw] sm:w-[95vw] sm:h-[92dvh] p-0 overflow-hidden bg-background/95 backdrop-blur-xl border-border/40"
      >
        <div className="relative w-full h-full flex items-center justify-center overflow-auto">
          <img
            src={src}
            alt={alt || 'Imagem'}
            className="max-w-none transition-transform duration-200 select-none"
            style={{
              transform: `scale(${scale}) rotate(${rot}deg)`,
              maxHeight: '85dvh',
              maxWidth: '92vw',
              objectFit: 'contain',
            }}
            onDoubleClick={() => setScale(s => (s > 1 ? 1 : 2))}
          />

          <div className="absolute top-3 right-3 flex gap-1 bg-card/85 backdrop-blur-md border border-border/40 rounded-lg p-1 shadow-lg">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setScale(s => Math.min(5, s + 0.25))} title="Aproximar">
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setScale(s => Math.max(0.25, s - 0.25))} title="Afastar">
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setRot(r => r + 90)} title="Girar">
              <RotateCw className="w-4 h-4" />
            </Button>
            <a href={src} download={alt || 'imagem'} target="_blank" rel="noreferrer">
              <Button variant="ghost" size="icon" className="h-8 w-8" title="Baixar">
                <Download className="w-4 h-4" />
              </Button>
            </a>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => close(false)} title="Fechar">
              <X className="w-4 h-4" />
            </Button>
          </div>

          {alt && (
            <div className="absolute bottom-3 left-3 right-3 text-center text-xs text-muted-foreground truncate">
              {alt}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface ZoomImageProps {
  src: string;
  alt?: string;
  className?: string;
  imgClassName?: string;
}

/** Thumbnail that opens the fullscreen viewer when clicked. */
export const ZoomImage = ({ src, alt, className, imgClassName }: ZoomImageProps) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className={`group relative overflow-hidden ${className || ''}`}
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        title="Ver em tela cheia"
      >
        <img src={src} alt={alt || ''} className={imgClassName || 'w-full h-full object-cover'} loading="lazy" />
        <span className="absolute inset-0 bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <ZoomIn className="w-5 h-5 text-foreground" />
        </span>
      </button>
      <ImageLightbox src={src} alt={alt} open={open} onOpenChange={setOpen} />
    </>
  );
};
