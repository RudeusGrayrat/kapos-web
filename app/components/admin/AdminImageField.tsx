"use client";

import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { Eye, ImagePlus, RotateCcw, Trash2, X, ZoomIn } from "lucide-react";

type AdminImageFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onUpload?: (file: File) => Promise<{ value: string; detail?: string }>;
  previewSrc?: string | null;
  description?: string;
  placeholder?: string;
  accept?: string;
  maxBytes?: number;
  maxWidth?: number;
  maxHeight?: number;
  onError?: (message: string) => void;
  onInfo?: (message: string) => void;
};

type ProcessedImage = {
  dataUrl: string;
  detail: string;
};

const defaultAccept = "image/png,image/jpeg,image/webp,image/avif";
const defaultMaxBytes = 150 * 1024;
const defaultMaxWidth = 1200;
const defaultMaxHeight = 600;

export function AdminImageField({
  label,
  value,
  onChange,
  onUpload,
  previewSrc,
  description,
  placeholder = "https://... o data:image/...",
  accept = defaultAccept,
  maxBytes = defaultMaxBytes,
  maxWidth = defaultMaxWidth,
  maxHeight = defaultMaxHeight,
  onError,
  onInfo,
}: AdminImageFieldProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [zoom, setZoom] = useState(1);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const imageSrc = previewSrc ?? value;

  const helperText = useMemo(() => {
    const size = formatBytes(maxBytes);
    return onUpload
      ? `PNG, JPG, WEBP o AVIF. Maximo permitido: ${size}. El archivo quedara disponible para tickets, reportes y catalogos.`
      : `PNG, JPG, WEBP o AVIF. Maximo recomendado: ${size}. Si pesa mas, Kapos intentara optimizarlo.`;
  }, [maxBytes, onUpload]);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      onError?.("El archivo debe ser una imagen.");
      return;
    }

    setIsProcessing(true);
    try {
      if (onUpload) {
        const result = await onUpload(file);
        onChange(result.value);
        onInfo?.(result.detail ?? "Imagen subida correctamente. Guarda para confirmar el cambio.");
      } else {
        const result = await processImage(file, { maxBytes, maxWidth, maxHeight });
        onChange(result.dataUrl);
        onInfo?.(result.detail);
      }
    } catch (error) {
      onError?.(error instanceof Error ? error.message : "No se pudo procesar la imagen.");
    } finally {
      setIsProcessing(false);
    }
  }

  function openImage() {
    if (!imageSrc) return;
    window.open(imageSrc, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="rounded-[28px] border border-[#E4E4E4] bg-[#F8F8F8] p-4">
      <div className="grid gap-5 lg:grid-cols-[260px_1fr] lg:items-start">
        <div className="space-y-3">
          <div className="flex min-h-40 items-center justify-center overflow-hidden rounded-[24px] border border-[#A1A1A1] bg-white p-4">
            {imageSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageSrc} alt={label} className="max-h-32 max-w-full object-contain" />
            ) : (
              <div className="grid place-items-center gap-2 text-center text-sm text-[#A1A1A1]">
                <ImagePlus className="size-8" />
                <span>Sin imagen configurada</span>
              </div>
            )}
          </div>
          {value ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#A1A1A1] bg-white px-3 py-2 text-xs font-black text-[#0D0D0D] transition hover:border-[#00C70D]"
                onClick={() => setIsPreviewOpen(true)}
              >
                <ZoomIn className="size-4" />
                Ampliar
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#A1A1A1] bg-white px-3 py-2 text-xs font-black text-[#0D0D0D] transition hover:border-[#00C70D]"
                onClick={openImage}
              >
                <Eye className="size-4" />
                Abrir
              </button>
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-black text-[#0D0D0D]">{label}</p>
            {description ? <p className="mt-1 text-sm leading-6 text-[#535353]">{description}</p> : null}
          </div>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-[#0D0D0D]">URL de imagen</span>
            <input
              className="w-full rounded-[20px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00C70D]"
              placeholder={placeholder}
              value={value}
              onChange={(event) => onChange(event.target.value)}
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleFileChange} />
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full bg-[#0D0D0D] px-4 py-2 text-sm font-black text-white shadow-[0_14px_30px_rgba(32,36,21,0.18)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => inputRef.current?.click()}
              disabled={isProcessing}
            >
              <ImagePlus className="size-4" />
              {isProcessing ? "Optimizando..." : value ? "Reemplazar archivo" : "Subir archivo"}
            </button>
            {value ? (
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-[#A1A1A1] bg-white px-4 py-2 text-sm font-black text-[#0D0D0D] transition hover:border-[#d35f48] hover:text-[#d35f48]"
                onClick={() => onChange("")}
              >
                <Trash2 className="size-4" />
                Quitar
              </button>
            ) : null}
          </div>

          <p className="text-xs leading-5 text-[#535353]">{helperText}</p>
        </div>
      </div>

      {isPreviewOpen ? (
        <div className="fixed inset-0 z-[10001] grid place-items-center bg-[#0D0D0D]/70 p-5 backdrop-blur-sm">
          <div className="w-full max-w-4xl rounded-[32px] border border-white/20 bg-[#F1F1F1] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.35)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-[#0D0D0D]">Vista ampliada</p>
                <p className="text-xs text-[#535353]">Usa el zoom para revisar bordes, proporción y legibilidad.</p>
              </div>
              <button
                type="button"
                className="grid size-10 place-items-center rounded-full bg-white text-[#0D0D0D] shadow-sm"
                onClick={() => setIsPreviewOpen(false)}
                aria-label="Cerrar vista ampliada"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="flex max-h-[60vh] items-center justify-center overflow-auto rounded-[26px] border border-[#A1A1A1] bg-white p-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageSrc} alt={label} style={{ transform: `scale(${zoom})` }} className="max-h-[46vh] max-w-full object-contain transition-transform" />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="text-xs font-black text-[#535353]">Zoom</span>
              <input
                type="range"
                min="1"
                max="2.5"
                step="0.1"
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
                className="h-2 min-w-52 accent-[#00C70D]"
              />
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-[#A1A1A1] bg-white px-3 py-2 text-xs font-black text-[#0D0D0D]"
                onClick={() => setZoom(1)}
              >
                <RotateCcw className="size-4" />
                Restablecer
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

async function processImage(
  file: File,
  options: { maxBytes: number; maxWidth: number; maxHeight: number },
): Promise<ProcessedImage> {
  const originalDataUrl = await readFileAsDataUrl(file);
  if (file.size <= options.maxBytes) {
    return {
      dataUrl: originalDataUrl,
      detail: `Imagen cargada correctamente (${formatBytes(file.size)}). Guarda para confirmar el cambio.`,
    };
  }

  const optimized = await resizeRasterImage(originalDataUrl, options);
  const optimizedBytes = estimateDataUrlBytes(optimized);
  if (optimizedBytes > options.maxBytes) {
    throw new Error(`La imagen sigue pesando ${formatBytes(optimizedBytes)} despues de optimizar. Usa una version mas ligera o pega una URL.`);
  }

  return {
    dataUrl: optimized,
    detail: `Imagen optimizada de ${formatBytes(file.size)} a ${formatBytes(optimizedBytes)}. Guarda para confirmar el cambio.`,
  };
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("No se pudo leer el archivo."));
    reader.readAsDataURL(file);
  });
}

async function resizeRasterImage(
  source: string,
  options: { maxBytes: number; maxWidth: number; maxHeight: number },
) {
  const image = await loadImage(source);
  const scale = Math.min(1, options.maxWidth / image.width, options.maxHeight / image.height);
  let width = Math.max(1, Math.round(image.width * scale));
  let height = Math.max(1, Math.round(image.height * scale));

  for (const quality of [0.9, 0.82, 0.74, 0.66, 0.58]) {
    const result = drawImage(image, width, height, quality);
    if (estimateDataUrlBytes(result) <= options.maxBytes) return result;
    width = Math.max(1, Math.round(width * 0.88));
    height = Math.max(1, Math.round(height * 0.88));
  }

  return drawImage(image, width, height, 0.52);
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("No se pudo abrir la imagen seleccionada."));
    image.src = source;
  });
}

function drawImage(image: HTMLImageElement, width: number, height: number, quality: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("El navegador no pudo preparar la imagen.");
  context.clearRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL("image/webp", quality);
}

function estimateDataUrlBytes(dataUrl: string) {
  const base64 = dataUrl.split(",")[1] ?? "";
  return Math.ceil((base64.length * 3) / 4);
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
