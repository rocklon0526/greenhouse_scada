import React, { useState } from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';

interface EmbeddedPageProps {
    title: string;
    url: string;
    description: string;
}

const EmbeddedPage: React.FC<EmbeddedPageProps> = ({ title, url, description }) => {
    const [loading, setLoading] = useState(true);

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
                    <p className="text-slate-400">{description}</p>
                </div>
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                >
                    <ExternalLink size={18} className="mr-2" /> Open in New Tab
                </a>
            </div>

            <div className="flex-1 bg-white rounded-xl overflow-hidden relative border border-slate-800">
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-10">
                        <Loader2 className="animate-spin text-emerald-500" size={48} />
                    </div>
                )}
                <iframe
                    src={url}
                    className="w-full h-full border-0"
                    onLoad={() => setLoading(false)}
                    title={title}
                />
            </div>
        </div>
    );
};

export default EmbeddedPage;
