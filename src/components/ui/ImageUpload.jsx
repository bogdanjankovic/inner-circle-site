import { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';

const ImageUpload = ({ onImageSelect, initialImage, placeholder = "Upload", size = "64px", round = false }) => {
    const [preview, setPreview] = useState(initialImage);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Basic Size Validation (Limit to 500kb for localStorage sanity)
        if (file.size > 500000) {
            alert("Slika je prevelika! Molimo koristite sliku manju od 500kb.");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result;
            setPreview(base64);
            onImageSelect(base64);
        };
        reader.readAsDataURL(file);
    };

    const handleClear = (e) => {
        e.stopPropagation();
        setPreview(null);
        onImageSelect(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div
            onClick={() => fileInputRef.current.click()}
            style={{
                width: size,
                height: size,
                borderRadius: round ? '50%' : '8px',
                border: '2px dashed var(--border)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                backgroundColor: 'var(--bg-main)',
                transition: 'border-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
            onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
        >
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                style={{ display: 'none' }}
            />

            {preview ? (
                <>
                    <img src={preview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                        onClick={handleClear}
                        style={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            background: 'rgba(0,0,0,0.6)',
                            border: 'none',
                            color: '#fff',
                            borderRadius: '0 0 0 4px',
                            cursor: 'pointer',
                            padding: '2px'
                        }}
                    >
                        <X size={12} />
                    </button>
                </>
            ) : (
                <div style={{ textAlign: 'center', color: '#666', fontSize: '0.7rem' }}>
                    <Upload size={16} style={{ marginBottom: '2px' }} />
                    <div>{placeholder}</div>
                </div>
            )}
        </div>
    );
};

export default ImageUpload;
