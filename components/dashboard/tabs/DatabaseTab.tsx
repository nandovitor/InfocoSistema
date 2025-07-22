import React, { useState, useRef } from 'react';
import { useData } from '../../../contexts/DataContext';
import { DOCUMENT_FOLDERS } from '../../../constants';
import { ManagedFile } from '../../../types';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Select from '../../ui/Select';
import DataTable, { Column } from '../../ui/DataTable';
import { UploadCloud, Folder, FileText, Download, Eye, Trash2, ChevronRight } from 'lucide-react';
import DeleteConfirmationModal from '../../ui/DeleteConfirmationModal';
import PdfViewerModal from '../../ui/PdfViewerModal';
import { cn } from '../../../lib/utils';
import Alert from '../../ui/Alert';

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const DatabaseTab: React.FC = () => {
    const { financeData, documents, addFile, deleteFile } = useData();
    const [selectedMunicipality, setSelectedMunicipality] = useState('');
    const [selectedFolder, setSelectedFolder] = useState('');
    const [fileToDelete, setFileToDelete] = useState<ManagedFile | null>(null);
    const [pdfToView, setPdfToView] = useState<ManagedFile | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const municipalities = financeData.map(f => f.municipality).sort();

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > MAX_FILE_SIZE_BYTES) {
            setError(`O arquivo é muito grande. O tamanho máximo é de ${MAX_FILE_SIZE_MB}MB.`);
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            const newFile: Omit<ManagedFile, 'id'> = {
                name: file.name,
                type: file.type,
                size: file.size,
                dataUrl: dataUrl
            };
            addFile(selectedMunicipality, selectedFolder, newFile);
        };
        reader.onerror = () => setError("Não foi possível ler o arquivo.");
        reader.readAsDataURL(file);

        // Reset file input
        e.target.value = '';
    };

    const handleDownload = (file: ManagedFile) => {
        const link = document.createElement('a');
        link.href = file.dataUrl;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    const handleConfirmDelete = () => {
        if (fileToDelete) {
            deleteFile(selectedMunicipality, selectedFolder, fileToDelete.id);
            setFileToDelete(null);
        }
    };

    const files = selectedMunicipality && selectedFolder ? documents[selectedMunicipality]?.[selectedFolder] || [] : [];
    
    const columns: Column<ManagedFile>[] = [
        { key: 'name', header: 'Nome', render: (file) => <div className="flex items-center gap-2 font-medium text-gray-900"><FileText size={16} /><span>{file.name}</span></div> },
        { key: 'type', header: 'Tipo' },
        { key: 'size', header: 'Tamanho', render: (file) => `${(file.size / 1024 / 1024).toFixed(2)} MB` },
        {
            key: 'actions', header: 'Ações', className: 'text-right', render: (file) => (
                <div className="flex items-center justify-end gap-2">
                    {file.type === 'application/pdf' && (
                        <Button variant="secondary" size="sm" onClick={() => setPdfToView(file)} className="p-2 h-auto" aria-label="Visualizar">
                            <Eye size={16} />
                        </Button>
                    )}
                    <Button variant="secondary" size="sm" onClick={() => handleDownload(file)} className="p-2 h-auto" aria-label="Baixar">
                        <Download size={16} />
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => setFileToDelete(file)} className="p-2 h-auto" aria-label="Excluir">
                        <Trash2 size={16} />
                    </Button>
                </div>
            )
        },
    ];

    return (
        <div className="space-y-6">
            <Card>
                <h2 className="text-xl font-semibold text-gray-800 mb-1">Base de Dados por Município</h2>
                <p className="text-sm text-gray-500 mb-4">Selecione um município para gerenciar seus arquivos e documentos.</p>
                <Select value={selectedMunicipality} onChange={e => { setSelectedMunicipality(e.target.value); setSelectedFolder(''); }}>
                    <option value="">Selecione um município...</option>
                    {municipalities.map(m => <option key={m} value={m}>{m}</option>)}
                </Select>
            </Card>

            {selectedMunicipality && (
                <Card>
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Pastas de: {selectedMunicipality}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {DOCUMENT_FOLDERS.map(folder => {
                            const fileCount = documents[selectedMunicipality]?.[folder]?.length || 0;
                            return (
                                <button key={folder} onClick={() => setSelectedFolder(folder)} className={cn(
                                    "p-4 rounded-lg border-2 text-left transition-all duration-200 flex items-center justify-between",
                                    selectedFolder === folder ? 'bg-blue-100 border-blue-500 shadow-md' : 'bg-white border-gray-200 hover:border-blue-400 hover:bg-blue-50'
                                )}>
                                    <div>
                                        <Folder className={cn("w-8 h-8 mb-2", selectedFolder === folder ? "text-blue-600" : "text-gray-500")} />
                                        <p className="font-semibold text-gray-800">{folder}</p>
                                        <p className="text-xs text-gray-500">{fileCount} arquivo(s)</p>
                                    </div>
                                    <ChevronRight size={20} className={cn("text-gray-400 transition-transform", selectedFolder === folder && "transform translate-x-1 text-blue-600")} />
                                </button>
                            );
                        })}
                    </div>
                </Card>
            )}

            {selectedMunicipality && selectedFolder && (
                 <Card>
                     <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                        <h3 className="text-lg font-semibold text-gray-700">Arquivos em: <span className="font-bold text-blue-600">{selectedFolder}</span></h3>
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                        <Button onClick={() => fileInputRef.current?.click()}>
                            <UploadCloud size={16} className="mr-2"/>
                            Carregar Arquivo
                        </Button>
                    </div>
                    {error && <Alert type="danger" message={error} className="mb-4" />}
                    <DataTable
                        columns={columns}
                        data={files}
                        emptyMessage="Nenhum arquivo encontrado nesta pasta."
                    />
                </Card>
            )}
            
            <DeleteConfirmationModal
                isOpen={!!fileToDelete}
                onClose={() => setFileToDelete(null)}
                onConfirm={handleConfirmDelete}
                title="Confirmar Exclusão"
                message={`Tem certeza que deseja excluir o arquivo "${fileToDelete?.name}"? Esta ação não pode ser desfeita.`}
            />

            {pdfToView && (
                <PdfViewerModal
                    isOpen={!!pdfToView}
                    onClose={() => setPdfToView(null)}
                    pdfDataUrl={pdfToView.dataUrl}
                    title={pdfToView.name}
                />
            )}
        </div>
    );
};

export default DatabaseTab;
