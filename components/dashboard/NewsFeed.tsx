
import React, { useEffect, useCallback } from 'react';
import { useData } from '../../contexts/DataContext';
import Card from '../ui/Card';
import { Newspaper, ExternalLink, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

const NewsFeed: React.FC = () => {
    const { news, newsSources, fetchNews, isNewsLoading, newsError } = useData();

    const initialFetch = useCallback(() => {
        if (news.length === 0 && !isNewsLoading) {
            fetchNews();
        }
    }, [news.length, isNewsLoading, fetchNews]);


    useEffect(() => {
        initialFetch();
    }, [initialFetch]);

    const SkeletonItem: React.FC = () => (
        <div className="flex gap-4 p-3 animate-pulse">
            <div className="w-10 h-10 rounded-lg bg-gray-300 flex-shrink-0"></div>
            <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
        </div>
    );

    const renderContent = () => {
        if (isNewsLoading) {
            return (
                <div className="space-y-2">
                    {[...Array(5)].map((_, i) => <SkeletonItem key={i} />)}
                </div>
            );
        }

        if (newsError) {
            return (
                <div className="text-center py-8 text-red-600">
                    <AlertCircle className="mx-auto w-12 h-12 mb-4" />
                    <h3 className="font-semibold">Erro ao carregar notícias</h3>
                    <p className="text-sm text-red-500 mt-2">{newsError}</p>
                    <button onClick={fetchNews} className="mt-4 text-sm text-blue-600 hover:underline">Tentar novamente</button>
                </div>
            );
        }

        if (news.length === 0) {
            return (
                <div className="text-center py-10 text-gray-500">
                    <Newspaper className="mx-auto w-12 h-12 mb-4" />
                    <h3 className="font-semibold">Nenhuma notícia encontrada</h3>
                    <p className="text-sm mt-2">O feed de notícias está vazio no momento.</p>
                </div>
            );
        }

        return (
            <div className="space-y-1">
                {news.map((item, index) => (
                    <a
                        key={index}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-3 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                    >
                        <div className="flex items-start gap-4">
                             <div className="w-10 h-10 mt-1 rounded-lg bg-indigo-100 flex-shrink-0 flex items-center justify-center">
                                <Newspaper size={20} className="text-indigo-600" />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-semibold text-sm text-blue-700 hover:underline">
                                        {item.title}
                                    </h4>
                                    <ExternalLink size={16} className="text-gray-400 flex-shrink-0 ml-2 mt-1" />
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{item.summary}</p>
                                <p className="text-xs text-gray-500 mt-2">Fonte: {item.sourceTitle}</p>
                            </div>
                        </div>
                    </a>
                ))}
            </div>
        );
    };

    return (
        <Card className="flex flex-col h-full">
            <div className="p-6 pb-2">
                 <h2 className="text-lg font-semibold text-gray-800">Feed de Notícias</h2>
                 <p className="text-sm text-gray-500">Últimas atualizações sobre licitações e órgãos de controle.</p>
            </div>
            <div className="flex-1 overflow-y-auto px-3">
                {renderContent()}
            </div>
             {newsSources && newsSources.length > 0 && (
                <div className="p-4 border-t bg-gray-50 rounded-b-xl mt-2">
                    <h4 className="text-xs font-semibold text-gray-600 flex items-center gap-2 mb-2">
                        <LinkIcon size={14}/>
                        Fontes utilizadas pela IA
                    </h4>
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                        {newsSources.map((source, index) => source.web && (
                             <a 
                                href={source.web.uri} 
                                key={index} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline truncate"
                                title={source.web.uri}
                            >
                                {source.web.title || new URL(source.web.uri).hostname}
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </Card>
    );
};

export default NewsFeed;
