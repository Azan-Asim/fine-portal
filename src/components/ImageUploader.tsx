'use client';

import { useState, useRef } from 'react';
import { uploadImage } from '@/lib/uploadImage';
import { ImagePlus, X, Loader2, CheckCircle } from 'lucide-react';

interface ImageUploaderProps {
    value: string;           // current image URL (after upload)
    onChange: (url: string) => void;
    label?: string;
    required?: boolean;
}

export default function ImageUploader({ value, onChange, label, required }: ImageUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFile = async (file: File) => {
        if (!file.type.startsWith('image/')) {
            setError('Please select a valid image file.'); return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setError('Image must be under 10 MB.'); return;
        }

        setError('');
        setUploading(true);

        // Show local preview immediately
        const reader = new FileReader();
        reader.onload = e => setPreview(e.target?.result as string);
        reader.readAsDataURL(file);

        try {
            const url = await uploadImage(file);
            onChange(url);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Upload failed. Check ImgBB API key.');
            setPreview(null);
            onChange('');
        } finally {
            setUploading(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    };

    const handleClear = () => {
        setPreview(null);
        onChange('');
        setError('');
        if (inputRef.current) inputRef.current.value = '';
    };

    return (
        <div>
            {label && (
                <label className="label">
                    {label} {required && <span style={{ color: 'var(--danger)' }}>*</span>}
                </label>
            )}

            {/* Drop zone */}
            {!preview && !value && (
                <div
                    onClick={() => inputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={e => e.preventDefault()}
                    className="flex flex-col items-center justify-center gap-2 rounded-xl cursor-pointer transition-all"
                    style={{
                        border: '2px dashed var(--border)',
                        padding: '2rem 1rem',
                        background: 'var(--bg-secondary)',
                        minHeight: 120,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                >
                    {uploading ? (
                        <>
                            <Loader2 size={28} className="animate-spin" style={{ color: 'var(--accent)' }} />
                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Uploading...</p>
                        </>
                    ) : (
                        <>
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                                style={{ background: 'var(--accent-dim)' }}>
                                <ImagePlus size={22} style={{ color: 'var(--accent)' }} />
                            </div>
                            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                Click or drag & drop to upload
                            </p>
                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                PNG, JPG, WEBP up to 10MB
                            </p>
                        </>
                    )}
                </div>
            )}

            {/* Preview */}
            {(preview || value) && (
                <div className="relative rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preview || value} alt="Upload preview"
                        className="w-full object-contain"
                        style={{ maxHeight: 220, background: 'var(--bg-secondary)' }} />
                    <div className="absolute top-2 right-2 flex gap-2">
                        {value && !uploading && (
                            <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                                style={{ background: 'rgba(69,211,156,0.2)', color: '#0f6f52', border: '1px solid rgba(69,211,156,0.4)' }}>
                                <CheckCircle size={12} /> Uploaded
                            </div>
                        )}
                        {uploading && (
                            <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                                style={{ background: 'rgba(33,201,211,0.2)', color: '#15546a', border: '1px solid rgba(33,201,211,0.38)' }}>
                                <Loader2 size={12} className="animate-spin" /> Uploading…
                            </div>
                        )}
                        <button onClick={handleClear} type="button"
                            className="w-7 h-7 rounded-full flex items-center justify-center"
                            style={{ background: 'rgba(20,49,77,0.82)', color: '#fff' }}>
                            <X size={14} />
                        </button>
                    </div>
                </div>
            )}

            {error && (
                <p className="text-xs mt-1.5" style={{ color: 'var(--danger)' }}>{error}</p>
            )}

            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
        </div>
    );
}
