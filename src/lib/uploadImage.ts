/**
 * Uploads an image file to ImgBB and returns the image URL.
 * Free API at https://api.imgbb.com — get your free key at imgbb.com
 */
export async function uploadImage(file: File): Promise<string> {
    const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;

    if (!apiKey) {
        throw new Error('ImgBB API key not configured. Add NEXT_PUBLIC_IMGBB_API_KEY to .env.local');
    }

    // Convert file to base64
    const base64 = await fileToBase64(file);

    const formData = new FormData();
    formData.append('key', apiKey);
    formData.append('image', base64);

    const res = await fetch('https://api.imgbb.com/1/upload', {
        method: 'POST',
        body: formData,
    });

    if (!res.ok) throw new Error(`Image upload failed: ${res.status}`);

    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'Image upload failed');

    return json.data.url as string;
}

function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            // Strip the data:image/...;base64, prefix
            const result = (reader.result as string).split(',')[1];
            resolve(result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
