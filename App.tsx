
import React, { useState, useCallback } from 'react';
import Card from './components/Card';
import Spinner from './components/Spinner';
import { PDFIcon, UploadIcon } from './components/icons';

// TypeScript declaration for the pdf.js library loaded from a CDN.
declare var pdfjsLib: any;

type AppState = 'idle' | 'loading' | 'success' | 'error';

const App: React.FC = () => {
    const [appState, setAppState] = useState<AppState>('idle');
    const [extractedText, setExtractedText] = useState('');
    const [wordCount, setWordCount] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);

    // Configure the worker for pdf.js. This is crucial for performance.
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`;

    const resetState = () => {
        setAppState('idle');
        setExtractedText('');
        setWordCount(0);
        setError(null);
        setFileName(null);
    };

    const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            setError('Please upload a valid PDF file.');
            setAppState('error');
            return;
        }

        setAppState('loading');
        setError(null);
        setFileName(file.name);

        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
            const numPages = pdf.numPages;
            let fullText = '';

            for (let i = 1; i <= numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map((item: any) => item.str).join(' ');
                fullText += pageText + '\n';
            }
            
            const trimmedText = fullText.trim();
            setExtractedText(trimmedText);
            
            const words = trimmedText.split(/\s+/).filter(word => word.length > 0);
            setWordCount(words.length);
            setAppState('success');

        } catch (e) {
            console.error(e);
            setError('Failed to extract text. The PDF might be image-based, encrypted, or corrupted.');
            setAppState('error');
        }
    }, []);
    
    const FileUploader: React.FC<{ onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void }> = ({ onFileChange }) => (
        <Card>
            <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center">
                <PDFIcon className="w-16 h-16 mb-4 text-cyan-500" />
                <h2 className="text-2xl font-bold text-white mb-2">PDF Word Counter</h2>
                <p className="text-slate-400 mb-6">Upload your document to get started.</p>
                <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-primary hover:bg-primary-hover text-white font-bold py-3 px-6 rounded-lg transition-transform duration-200 ease-in-out hover:scale-105 inline-flex items-center gap-2"
                >
                    <UploadIcon className="w-5 h-5" />
                    <span>Choose PDF File</span>
                </label>
                <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    accept=".pdf"
                    onChange={onFileChange}
                />
            </div>
        </Card>
    );

    const LoadingState: React.FC<{ fileName: string | null }> = ({ fileName }) => (
        <Card>
            <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center">
                <Spinner />
                <h2 className="text-xl font-semibold text-white mt-4">Analyzing Document</h2>
                <p className="text-slate-400 mt-1 truncate max-w-xs">{fileName}</p>
            </div>
        </Card>
    );

    const ResultsDisplay: React.FC = () => (
         <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
            <Card>
                <div className="p-6">
                    <p className="text-slate-400 mb-1">Total Word Count</p>
                    <p className="text-6xl font-bold text-cyan-400">{wordCount.toLocaleString()}</p>
                    <p className="text-slate-400 mt-4 truncate">File: <span className="font-medium text-slate-300">{fileName}</span></p>
                </div>
            </Card>
            <Card>
                <div className="p-6">
                    <h3 className="text-lg font-semibold text-white mb-3">Extracted Text</h3>
                    <textarea
                        readOnly
                        value={extractedText}
                        className="w-full h-96 p-4 bg-slate-900 border border-slate-700 rounded-md text-slate-300 focus:ring-2 focus:ring-cyan-500 focus:outline-none font-mono text-sm"
                        placeholder="Extracted text will appear here..."
                    />
                </div>
            </Card>
            <div className="text-center">
                <button
                    onClick={resetState}
                    className="bg-primary hover:bg-primary-hover text-white font-bold py-3 px-6 rounded-lg transition-transform duration-200 ease-in-out hover:scale-105"
                >
                    Analyze Another PDF
                </button>
            </div>
        </div>
    );
    
    const ErrorState: React.FC<{ message: string | null }> = ({ message }) => (
       <Card>
            <div className="p-8 text-center">
                <h2 className="text-xl font-bold text-red-500 mb-4">An Error Occurred</h2>
                <p className="text-slate-400 mb-6">{message}</p>
                <button
                    onClick={resetState}
                    className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-lg transition"
                >
                    Try Again
                </button>
            </div>
        </Card>
    );
    
    const renderContent = () => {
        switch (appState) {
            case 'loading':
                return <LoadingState fileName={fileName} />;
            case 'success':
                return <ResultsDisplay />;
            case 'error':
                return <ErrorState message={error} />;
            case 'idle':
            default:
                return <FileUploader onFileChange={handleFileChange} />;
        }
    };

    return (
        <main className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
            <div className="w-full max-w-md">
                 {renderContent()}
            </div>
        </main>
    );
};

export default App;
