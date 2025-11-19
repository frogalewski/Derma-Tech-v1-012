


import React from 'react';
import { GroundingSource } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { LinkIcon } from './Icons';

interface SourceLinksProps {
    sources: GroundingSource[];
}

const SourceLinks: React.FC<SourceLinksProps> = ({ sources }) => {
    const { t } = useLanguage();
    if (sources.length === 0) {
        return null;
    }

    return (
        <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                <LinkIcon className="h-6 w-6 mr-2 text-gray-500"/>
                {t('researchSources')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {t('googleSearchDisclaimer')}
            </p>
            <div className="mt-4 space-y-4">
                {sources.map((source, index) => (
                    <div key={index} className="p-4 bg-gray-100/50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 transition-all hover:shadow-sm hover:border-gray-300 dark:hover:border-gray-600">
                        <a
                            href={source.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline"
                            title={source.title}
                        >
                            <span className="font-bold">{index + 1}. {source.title}</span>
                        </a>
                        {source.snippet && (
                            <blockquote className="mt-2 pl-3 border-l-2 border-gray-300 dark:border-gray-600">
                                <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                                    "...{source.snippet}..."
                                </p>
                            </blockquote>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SourceLinks;