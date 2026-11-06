import { RefObject, useEffect, useLayoutEffect, useRef } from 'react';

export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 4;
const clamp = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(z * 100) / 100));

/** Zoom suave num container com rolagem: roda do mouse, pinça no trackpad e dois dedos no celular.
 *  O ponto embaixo do cursor/dedos fica parado. O conteúdo deve ter largura = zoom * 100%. */
export function useStageZoom(
  stageRef: RefObject<HTMLDivElement>,
  zoom: number,
  onZoom: (z: number) => void,
  onPinchStart?: () => void,
) {
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const cb = useRef({ onZoom, onPinchStart });
  cb.current = { onZoom, onPinchStart };
  const anchor = useRef<{ fx: number; fy: number; px: number; py: number } | null>(null);

  const zoomAt = (next: number, clientX?: number, clientY?: number) => {
    const st = stageRef.current;
    const z = clamp(next);
    if (!st || z === zoomRef.current) return;
    const r = st.getBoundingClientRect();
    const px = clientX !== undefined ? clientX - r.left : r.width / 2;
    const py = clientY !== undefined ? clientY - r.top : r.height / 2;
    const c = st.firstElementChild as HTMLElement | null;
    const w = c?.offsetWidth || st.scrollWidth, h = c?.offsetHeight || st.scrollHeight;
    const ox = c?.offsetLeft ?? 0, oy = c?.offsetTop ?? 0;
    anchor.current = { fx: (st.scrollLeft + px - ox) / w, fy: (st.scrollTop + py - oy) / h, px, py };
    zoomRef.current = z;
    cb.current.onZoom(z);
  };

  // Depois do novo tamanho, rola para manter o ponto parado.
  useLayoutEffect(() => {
    const st = stageRef.current, a = anchor.current;
    if (!st || !a) return;
    anchor.current = null;
    const c = st.firstElementChild as HTMLElement | null;
    const w = c?.offsetWidth || st.scrollWidth, h = c?.offsetHeight || st.scrollHeight;
    st.scrollLeft = a.fx * w + (c?.offsetLeft ?? 0) - a.px;
    st.scrollTop = a.fy * h + (c?.offsetTop ?? 0) - a.py;
  }, [zoom, stageRef]);

  useEffect(() => {
    const st = stageRef.current;
    if (!st) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      zoomAt(zoomRef.current * Math.exp(-dy * (e.ctrlKey ? 0.01 : 0.0018)), e.clientX, e.clientY);
    };
    let pinch: { d: number; z: number } | null = null;
    const dist = (t: TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    const onTS = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        pinch = { d: dist(e.touches), z: zoomRef.current };
        cb.current.onPinchStart?.();
        e.preventDefault();
      }
    };
    const onTM = (e: TouchEvent) => {
      if (!pinch || e.touches.length !== 2) return;
      e.preventDefault();
      const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      zoomAt(pinch.z * (dist(e.touches) / pinch.d), cx, cy);
    };
    const onTE = (e: TouchEvent) => { if (e.touches.length < 2) pinch = null; };
    st.addEventListener('wheel', onWheel, { passive: false });
    st.addEventListener('touchstart', onTS, { passive: false, capture: true });
    st.addEventListener('touchmove', onTM, { passive: false, capture: true });
    st.addEventListener('touchend', onTE);
    st.addEventListener('touchcancel', onTE);
    const captureOptions: AddEventListenerOptions = { capture: true };
    return () => {
      st.removeEventListener('wheel', onWheel);
      st.removeEventListener('touchstart', onTS, captureOptions);
      st.removeEventListener('touchmove', onTM, captureOptions);
      st.removeEventListener('touchend', onTE);
      st.removeEventListener('touchcancel', onTE);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageRef.current]);

  return {
    zoomIn: () => zoomAt(zoomRef.current * 1.25),
    zoomOut: () => zoomAt(zoomRef.current / 1.25),
    reset: () => zoomAt(1),
  };
}
