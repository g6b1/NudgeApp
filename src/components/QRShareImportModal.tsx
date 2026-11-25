import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { Camera, Check, Copy, Download, QrCode, Upload } from 'lucide-react';
import { GlassSheet } from './ui/GlassSheet';
import { useNudge } from '../context/NudgeContext';
import { Backpack, Checklist, Routine, RoutineVersionType } from '../types/nudge';
import { createId } from '../storage/persistence';

export type SharePayload =
  | { v: 1; type: 'routine'; data: Routine }
  | { v: 1; type: 'checklist'; data: Checklist }
  | { v: 1; type: 'backpack'; data: Backpack };

interface QRShareImportModalProps {
  open: boolean;
  shareTarget: SharePayload | null;
  onClose: () => void;
}

export const QRShareImportModal: React.FC<QRShareImportModalProps> = ({
  open,
  shareTarget,
  onClose,
}) => {
  const { addRoutine, addChecklist, addBackpack } = useNudge();
  const [mode, setMode] = useState<'share' | 'import'>(shareTarget ? 'share' : 'import');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrError, setQrError] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Import state
  const [scanningCamera, setScanningCamera] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [rawCode, setRawCode] = useState('');
  const [previewPayload, setPreviewPayload] = useState<SharePayload | null>(null);
  const [importSuccess, setImportSuccess] = useState('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) {
      stopCamera();
      return;
    }
    setMode(shareTarget ? 'share' : 'import');
    setPreviewPayload(null);
    setImportSuccess('');
    setCameraError('');
    setQrError('');
    setRawCode('');
  }, [open, shareTarget]);

  useEffect(() => {
    if (!open || !shareTarget) {
      setQrDataUrl('');
      return;
    }
    const serialized = JSON.stringify(shareTarget);
    QRCode.toDataURL(serialized, {
      width: 320,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#302F2D', light: '#FFFFFF' },
    })
      .then((url) => {
        setQrDataUrl(url);
        setQrError('');
      })
      .catch(() => {
        setQrError('This item is too large to encode into a single QR code. You can copy or share the code text below instead.');
      });
  }, [open, shareTarget]);

  const stopCamera = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setScanningCamera(false);
  };

  const tryParsePayload = (text: string): SharePayload | null => {
    try {
      const parsed = JSON.parse(text);
      if (
        parsed &&
        parsed.v === 1 &&
        (parsed.type === 'routine' || parsed.type === 'checklist' || parsed.type === 'backpack') &&
        parsed.data &&
        typeof parsed.data.name === 'string'
      ) {
        return parsed as SharePayload;
      }
      return null;
    } catch {
      return null;
    }
  };

  const startCameraScan = async () => {
    setCameraError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera access is not available in this browser environment. You can upload a QR image or paste a share code below.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      setScanningCamera(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
          scanLoop();
        }
      });
    } catch {
      setCameraError('Camera permission was declined or unavailable. Upload a QR image or paste a share code instead.');
    }
  };

  const scanLoop = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !streamRef.current) return;
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const decoded = jsQR(imgData.data, imgData.width, imgData.height);
        if (decoded?.data) {
          const parsed = tryParsePayload(decoded.data);
          if (parsed) {
            setPreviewPayload(parsed);
            stopCamera();
            return;
          }
        }
      }
    }
    rafRef.current = requestAnimationFrame(scanLoop);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const decoded = jsQR(data.data, data.width, data.height);
      if (decoded?.data) {
        const parsed = tryParsePayload(decoded.data);
        if (parsed) {
          setPreviewPayload(parsed);
          setCameraError('');
          return;
        }
      }
      setCameraError('Could not read a valid Nudge QR code from that image.');
    };
    img.src = URL.createObjectURL(file);
  };

  const handleConfirmImport = () => {
    if (!previewPayload) return;
    if (previewPayload.type === 'routine') {
      const src = previewPayload.data;
      const clonedVersions: Routine['versions'] = {};
      (Object.keys(src.versions || {}) as RoutineVersionType[]).forEach((ver) => {
        const vData = src.versions[ver];
        if (vData) {
          clonedVersions[ver] = {
            activities: vData.activities.map((a) => ({ ...a, id: createId('act') })),
          };
        }
      });
      addRoutine({
        name: src.name,
        emoji: src.emoji || '🌿',
        color: src.color || '#788D70',
        description: src.description,
        activeVersion: src.activeVersion || 'normal',
        versions: clonedVersions,
        schedule: src.schedule,
      });
      setImportSuccess(`Imported routine "${src.name}" safely without overwriting existing items.`);
    } else if (previewPayload.type === 'checklist') {
      const src = previewPayload.data;
      addChecklist({
        name: src.name,
        emoji: src.emoji || '📝',
        color: src.color || '#788D70',
        description: src.description,
        items: (src.items || []).map((i) => ({
          id: createId('ci'),
          title: i.title,
          completed: false,
        })),
      });
      setImportSuccess(`Imported checklist "${src.name}" safely.`);
    } else if (previewPayload.type === 'backpack') {
      const src = previewPayload.data;
      addBackpack({
        name: src.name,
        emoji: src.emoji || '🎒',
        color: src.color || '#4B8E9C',
        category: src.category || 'Everyday',
        items: (src.items || []).map((i) => ({
          id: createId('bi'),
          name: i.name,
          quantity: i.quantity || 1,
          required: Boolean(i.required),
          packed: false,
        })),
      });
      setImportSuccess(`Imported backpack "${src.name}" safely.`);
    }
    setPreviewPayload(null);
  };

  const serializedShare = shareTarget ? JSON.stringify(shareTarget) : '';

  return (
    <GlassSheet
      open={open}
      onClose={onClose}
      title="QR Share & Import"
      subtitle="Share routines, checklists, and backpacks locally without accounts"
      maxWidthClass="max-w-lg"
    >
      {shareTarget && (
        <div className="flex gap-1 p-1 rounded-xl bg-black/5 dark:bg-white/5 mb-4">
          <button
            type="button"
            onClick={() => {
              stopCamera();
              setMode('share');
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-medium ${
              mode === 'share' ? 'bg-[var(--nudge-accent)] text-white' : 'text-[var(--nudge-muted)]'
            }`}
          >
            Share QR
          </button>
          <button
            type="button"
            onClick={() => setMode('import')}
            className={`flex-1 py-2 rounded-lg text-xs font-medium ${
              mode === 'import' ? 'bg-[var(--nudge-accent)] text-white' : 'text-[var(--nudge-muted)]'
            }`}
          >
            Scan / Import
          </button>
        </div>
      )}

      {mode === 'share' && shareTarget && (
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{shareTarget.data.emoji}</span>
            <h3 className="font-display text-lg font-medium text-[var(--nudge-ink)]">
              {shareTarget.data.name}
            </h3>
          </div>

          {qrDataUrl ? (
            <div className="p-4 rounded-3xl bg-white shadow-sm border border-[var(--nudge-glass-border)]">
              <img src={qrDataUrl} alt={`QR code for ${shareTarget.data.name}`} className="w-56 h-56" />
            </div>
          ) : (
            <p className="text-xs text-[var(--nudge-muted)]">{qrError || 'Generating QR code...'}</p>
          )}

          <div className="flex flex-wrap justify-center gap-2 w-full">
            {qrDataUrl && (
              <a
                href={qrDataUrl}
                download={`nudge-${shareTarget.type}-${shareTarget.data.name.toLowerCase().replace(/\s+/g, '-')}.png`}
                className="min-h-[44px] px-4 rounded-xl glass-panel text-xs font-medium flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Save QR Image
              </a>
            )}
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(serializedShare).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1800);
                });
              }}
              className="min-h-[44px] px-4 rounded-xl glass-panel text-xs font-medium flex items-center gap-2"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy Share Code'}
            </button>
          </div>
        </div>
      )}

      {mode === 'import' && (
        <div className="space-y-4">
          {importSuccess && (
            <div className="p-3 rounded-2xl bg-[var(--nudge-accent-soft)] text-sm text-[var(--nudge-ink)] flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" style={{ color: 'var(--nudge-accent)' }} />
              <span>{importSuccess}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={scanningCamera ? stopCamera : startCameraScan}
              className="tactile-btn min-h-[44px] px-4 rounded-xl text-xs font-semibold flex items-center gap-2"
              style={{ backgroundColor: 'var(--nudge-accent)', color: 'var(--nudge-accent-ink)' }}
            >
              <Camera className="w-4 h-4" />
              {scanningCamera ? 'Stop Camera' : 'Scan with Camera'}
            </button>

            <label className="min-h-[44px] px-4 rounded-xl glass-panel text-xs font-medium flex items-center gap-2 cursor-pointer">
              <Upload className="w-4 h-4" />
              Upload QR Image
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          </div>

          {scanningCamera && (
            <div className="rounded-2xl overflow-hidden border border-[var(--nudge-glass-border)] bg-black">
              <video ref={videoRef} playsInline muted className="w-full max-h-64 object-cover" />
              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}

          {cameraError && <p className="text-xs text-amber-700 dark:text-amber-300">{cameraError}</p>}

          <div className="space-y-2">
            <label className="block text-xs font-medium text-[var(--nudge-muted)]">
              Or paste a Nudge QR share code
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={rawCode}
                onChange={(e) => setRawCode(e.target.value)}
                placeholder='{"v":1,"type":"routine",...}'
                className="flex-1 min-h-[44px] px-3 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--nudge-glass-border)] text-xs font-mono-num"
              />
              <button
                type="button"
                onClick={() => {
                  const parsed = tryParsePayload(rawCode.trim());
                  if (parsed) {
                    setPreviewPayload(parsed);
                    setCameraError('');
                  } else {
                    setCameraError('That code does not match a valid Nudge routine, checklist, or backpack.');
                  }
                }}
                className="min-h-[44px] px-4 rounded-xl glass-panel text-xs font-medium flex items-center gap-1.5"
              >
                <QrCode className="w-4 h-4" />
                Preview
              </button>
            </div>
          </div>

          {previewPayload && (
            <div className="glass-panel-strong rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{previewPayload.data.emoji}</span>
                <div>
                  <p className="text-xs text-[var(--nudge-muted)] capitalize">
                    Ready to import {previewPayload.type}
                  </p>
                  <p className="font-medium text-base text-[var(--nudge-ink)]">
                    {previewPayload.data.name}
                  </p>
                </div>
              </div>
              <p className="text-xs text-[var(--nudge-muted)]">
                Importing adds a new copy alongside your existing data and never overwrites anything.
              </p>
              <button
                type="button"
                onClick={handleConfirmImport}
                className="tactile-btn w-full min-h-[44px] rounded-xl text-sm font-semibold"
                style={{ backgroundColor: 'var(--nudge-accent)', color: 'var(--nudge-accent-ink)' }}
              >
                Confirm Import
              </button>
            </div>
          )}
        </div>
      )}
    </GlassSheet>
  );
};
