'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Scan, Upload, Loader2, X, CheckCircle2, FileImage, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface OCRResult {
    amount?: string;
    date?: string;
    merchant?: string;
    category?: string;
    description?: string;
    tags?: string;
    rawText?: string;
}

interface OCRScannerProps {
    onResult: (result: OCRResult) => void;
    onFileSelect: (file: File) => void;
}

export default function OCRScanner({ onResult, onFileSelect }: OCRScannerProps) {
    const [isScanning, setIsScanning] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);

    const extractFromText = (text: string): OCRResult => {
        const result: OCRResult = { rawText: text };

        // Extract amount (various formats)
        const amountPatterns = [
            // Strict matches with keywords - optional decimal
            /(?:total|amount|sum|due|subtotal|grand\s*total|net\s*payable|balance)[^\d]*([\d,]+(?:\.\d{2})?)/gi,
            // Currency symbols before/after numbers - optional decimal
            /(?:rs\.?|inr|usd|eur|gbp|[\$£€¥₹])\s*([\d,]+(?:\.\d{2})?)/gi,
            /([\d,]+(?:\.\d{2})?)\s*(?:usd|eur|gbp|inr|aed|rs)/gi,
            // Fallback 1: Any number with a comma AND a decimal (e.g., 1,500.00)
            /\b(\d{1,3}(?:,\d{3})+\.\d{2})\b/g,
            // Fallback 2: Any number with a comma WITHOUT a decimal (e.g., 1,500)
            /\b(\d{1,3}(?:,\d{3})+)\b/g,
            // Fallback 3: Any pure number with exactly two decimals that is reasonably large (e.g., > 10.00)
            /\b(\d+\.\d{2})\b/g
        ];

        let maxAmount = 0;
        for (const pattern of amountPatterns) {
            let match;
            while ((match = pattern.exec(text)) !== null) {
                const valstr = match[1] || match[0];
                const val = parseFloat(valstr.replace(/,/g, ''));
                if (!isNaN(val) && val > maxAmount && val < 10000000) {
                    // Sanity check to prevent picking 10 digit phone numbers if they get accidentally parsed
                    maxAmount = val;
                }
            }
            if (maxAmount > 0) {
                result.amount = maxAmount.toString();
                break;
            }
        }

        // Extract date
        const datePatterns = [
            /(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/,
            /(\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/,
            /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4})/i,
        ];
        for (const pattern of datePatterns) {
            const match = text.match(pattern);
            if (match) {
                try {
                    const parsed = new Date(match[1]);
                    if (!isNaN(parsed.getTime())) {
                        result.date = parsed.toISOString().split('T')[0];
                        break;
                    }
                } catch { }
            }
        }

        // Extract merchant (first non-empty line, often company name)
        const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 2 && l.length < 60);
        if (lines.length > 0) {
            // Skip generic words
            const skipWords = ['receipt', 'invoice', 'bill', 'tax', 'total', 'date', 'thank'];
            const merchantLine = lines.find((l) => !skipWords.some((w) => l.toLowerCase().includes(w)));
            if (merchantLine) result.merchant = merchantLine;
        }

        // Auto-guess Category
        const lowerText = text.toLowerCase();
        if (lowerText.match(/hotel|resort|inn|motel|airbnb|booking\.com|goibibo|oyo|accommodation/)) result.category = 'accommodation';
        else if (lowerText.match(/flight|airline|air|taxi|uber|lyft|transit|train|rail|transport/)) result.category = 'travel';
        else if (lowerText.match(/restaurant|cafe|coffee|food|meal|pizza|burger|grill|bar/)) result.category = 'meals';
        else if (lowerText.match(/software|cloud|aws|hosting|subscription|domain|github|digitalocean/)) result.category = 'software';
        else if (lowerText.match(/monitor|laptop|mouse|keyboard|cable|apple|dell|hardware/)) result.category = 'equipment';
        else if (lowerText.match(/doctor|pharmacy|hospital|clinic|health/)) result.category = 'medical';
        else if (lowerText.match(/tutor|course|udemy|coursera|training/)) result.category = 'training';

        // Auto-generate Description and Tags based on Merchant and Category
        if (result.merchant) {
            const catName = result.category ? result.category.charAt(0).toUpperCase() + result.category.slice(1) : 'General';
            result.description = `${catName} expense at ${result.merchant}`;

            const autoTags = ['receipt', 'ocr-scanned'];
            if (result.category) autoTags.push(result.category);
            result.tags = autoTags.join(', ');
        }

        return result;
    };

    const processFile = useCallback(async (file: File) => {
        setIsScanning(true);
        setOcrResult(null);
        onFileSelect(file);

        // Create preview
        const url = URL.createObjectURL(file);
        setPreview(url);
        setFileName(file.name);

        try {
            // Dynamically import Tesseract.js
            const { createWorker } = await import('tesseract.js');
            const worker = await createWorker('eng');

            const { data: { text } } = await worker.recognize(file);
            await worker.terminate();

            const result = extractFromText(text);
            setOcrResult(result);
            onResult(result);

            if (result.amount || result.date || result.merchant) {
                toast.success('Receipt scanned! Fields auto-filled.');
            } else {
                toast('Could not extract data automatically. Please fill manually.', { icon: '⚠️' });
            }
        } catch (error) {
            console.error('OCR error:', error);
            toast.error('OCR scanning failed. Please fill details manually.');
        } finally {
            setIsScanning(false);
        }
    }, [onResult, onFileSelect]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: (files) => {
            if (files[0]) processFile(files[0]);
        },
        accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'], 'application/pdf': ['.pdf'] },
        maxFiles: 1,
        maxSize: 10 * 1024 * 1024, // 10MB
    });

    const clear = () => {
        setPreview(null);
        setOcrResult(null);
        setFileName(null);
    };

    return (
        <div className="space-y-3">
            {!preview ? (
                <div
                    {...getRootProps()}
                    id="receipt-dropzone"
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${isDragActive
                        ? 'border-primary bg-primary/10'
                        : 'border-border/50 hover:border-primary/50 hover:bg-secondary/30'
                        }`}
                >
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center gap-3">
                        {isDragActive ? (
                            <>
                                <Upload className="w-10 h-10 text-primary animate-bounce" />
                                <p className="text-primary font-medium">Drop your receipt here</p>
                            </>
                        ) : (
                            <>
                                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                                    <Scan className="w-7 h-7 text-primary" />
                                </div>
                                <div>
                                    <p className="font-medium mb-1">Upload Receipt for OCR</p>
                                    <p className="text-sm text-muted-foreground">
                                        Drag & drop or click to browse
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        JPG, PNG, PDF up to 10MB — Auto-extracts amount, date & merchant
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            ) : (
                <div className="glass-card p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FileImage className="w-5 h-5 text-primary" />
                            <span className="text-sm font-medium truncate max-w-[200px]">{fileName}</span>
                        </div>
                        <button onClick={clear} className="btn-ghost p-1.5 text-muted-foreground">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {preview && !preview.endsWith('.pdf') && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={preview}
                            alt="Receipt preview"
                            className="w-full max-h-40 object-contain rounded-xl bg-black/20"
                        />
                    )}

                    {isScanning && (
                        <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-xl text-sm">
                            <Loader2 className="w-4 h-4 text-primary animate-spin flex-shrink-0" />
                            <div>
                                <p className="text-primary font-medium">Scanning receipt with OCR...</p>
                                <p className="text-muted-foreground text-xs">This may take a few seconds</p>
                            </div>
                        </div>
                    )}

                    {ocrResult && !isScanning && (
                        <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/20 space-y-2">
                            <div className="flex items-center gap-2 text-green-400 font-medium text-sm">
                                <CheckCircle2 className="w-4 h-4" />
                                OCR Extraction Complete
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                                {ocrResult.amount && (
                                    <div className="bg-black/20 rounded-lg p-2">
                                        <p className="text-muted-foreground">Amount</p>
                                        <p className="font-semibold text-green-300">{ocrResult.amount}</p>
                                    </div>
                                )}
                                {ocrResult.date && (
                                    <div className="bg-black/20 rounded-lg p-2">
                                        <p className="text-muted-foreground">Date</p>
                                        <p className="font-semibold text-green-300">{ocrResult.date}</p>
                                    </div>
                                )}
                                {ocrResult.merchant && (
                                    <div className="bg-black/20 rounded-lg p-2 col-span-3">
                                        <p className="text-muted-foreground">Merchant</p>
                                        <p className="font-semibold text-green-300 truncate">{ocrResult.merchant}</p>
                                    </div>
                                )}
                                {ocrResult.category && (
                                    <div className="bg-black/20 rounded-lg p-2">
                                        <p className="text-muted-foreground">Category</p>
                                        <p className="font-semibold text-green-300 capitalize truncate">{ocrResult.category}</p>
                                    </div>
                                )}
                                {ocrResult.tags && (
                                    <div className="bg-black/20 rounded-lg p-2 col-span-2">
                                        <p className="text-muted-foreground">Tags</p>
                                        <p className="font-semibold text-green-300 truncate">{ocrResult.tags}</p>
                                    </div>
                                )}
                            </div>
                            {!ocrResult.amount && !ocrResult.date && (
                                <div className="flex items-center gap-2 text-amber-400 text-xs">
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    Could not extract data automatically
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
