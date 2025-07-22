
import React, { useState, useMemo, useRef } from 'react';
import { useData } from '../../../contexts/DataContext';
import { PaymentNote, ManagedFile } from '../../../types';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Select from '../../ui/Select';
import Input from '../../ui/Input';
import Modal from '../../ui/Modal';
import DataTable, { Column } from '../../ui/DataTable';
import Alert from '../../ui/Alert';
import DeleteConfirmationModal from '../../ui/DeleteConfirmationModal';
import { PlusCircle, Upload, FileText, Download, Trash2, Info } from 'lucide-react';
import { formatDate } from '../../../lib/utils';

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const NotesTab: React.FC = () => {
    const { financeData, paymentNotes, addPaymentNote, deletePaymentNote } = useData();
    const [selectedMunicipality, setSelectedMunicipality] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [noteToDelete, setNoteToDelete] = useState<PaymentNote | null>(null);
    const [newNoteData, setNewNoteData] = useState({ referenceMonth: '', description: '' });
    const [newNoteFile, setNewNoteFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const municipalities = useMemo(() => financeData.map(f => f.municipality).sort(), [financeData]);

    const currentNotes = useMemo(() => {
        return (selectedMunicipality ? paymentNotes[selectedMunicipality] || [] : []).sort((a,b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
    }, [paymentNotes, selectedMunicipality]);

    const resetModalState = () => {
        setIsModalOpen(false);
        setIsLoading(false);
        setError(null);
        setNewNoteData({ referenceMonth: '', description: '' });
        setNewNoteFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > MAX_FILE_SIZE_BYTES) {
            setError(`O arquivo é muito grande. O tamanho máximo é de ${MAX_FILE_SIZE_MB}MB.`);
            setNewNoteFile(null);
            return;
        }
        setNewNoteFile(file);
    };

    const handleSaveNote = async () => {
        if (!newNoteData.referenceMonth || !newNoteData.description || !newNoteFile) {
            setError("Todos os campos e o anexo são obrigatórios.");
            return;
        }
        setIsLoading(true);
        setError(null);

        try {
            const reader = new FileReader();
            reader.readAsDataURL(newNoteFile);
            reader.onload = () => {
                const managedFile: Omit<ManagedFile, 'id'> = {
                    name: newNoteFile!.name,
                    type: newNoteFile!.type,
                    size: newNoteFile!.size,
                    dataUrl: reader.result as string,
                };

                const noteToAdd: Omit<PaymentNote, 'id'> = {
                    referenceMonth: newNoteData.referenceMonth,
                    description: newNoteData.description,
                    file: { ...managedFile, id: Date.now() },
                    uploadDate: new Date().toISOString(),
                };
                
                addPaymentNote(selectedMunicipality, noteToAdd);
                resetModalState();
            };
            reader.onerror = () => {
                throw new Error("Não foi possível ler o arquivo.");
            };
        } catch (e: any) {
            setError(e.message || "Ocorreu um erro ao processar o arquivo.");
            setIsLoading(false);
        }
    };
    
    const handleDownload = (file: ManagedFile) => {
        const link = document.createElement('a');
        link.href = file.dataUrl;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDeleteRequest = (note: PaymentNote) => {
        setNoteToDelete(note);
        setIsConfirmOpen(true);
    };

    const handleConfirmDelete = () => {
        if (noteToDelete) {
            deletePaymentNote(selectedMunicipality, noteToDelete.id);
        }
        setIsConfirmOpen(false);
        setNoteToDelete(null);
    };
    
    const columns: Column<PaymentNote>[] = [
        { 
            key: 'referenceMonth', 
            header: 'Mês/Ano', 
            render: (note) => {
                const [year, month] = note.referenceMonth.split('-');
                return `${month}/${year}`;
            }
        },
        { key: 'description', header: 'Descrição', className: 'font-medium text-gray-900' },
        { 
            key: 'file', 
            header: 'Arquivo', 
            render: (note) => (
                <div className="flex items-center gap-2">
                    <FileText size={16} />
                    <span>{note.file.name}</span>
                </div>
            )
        },
        { key: 'uploadDate', header: 'Data de Upload', render: (note) => formatDate(note.uploadDate.split('T')[0]) },
        { 
            key: 'actions', 
            header: 'Ações', 
            className: 'text-right',
            render: (note) => (
                <div className="flex items-center justify-end gap-2">
                    <Button variant="secondary" size="sm" onClick={() => handleDownload(note.file)} className="p-2 h-auto" aria-label={`Baixar ${note.file.name}`}>
                        <Download size={16} />
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleDeleteRequest(note)} className="p-2 h-auto" aria-label={`Excluir nota de ${note.referenceMonth}`}>
                        <Trash2 size={16} />
                    </Button>
                </div>
            )
        },
    ];

    return (
        <div className="space-y-6">
            <Card>
                <h2 className="text-xl font-semibold text-gray-800 mb-1">Gestão de Notas de Pagamento</h2>
                <p className="text-sm text-gray-500 mb-4">Selecione um município para gerenciar suas notas de pagamento.</p>
                <Select value={selectedMunicipality} onChange={e => setSelectedMunicipality(e.target.value)}>
                    <option value="">Selecione um município...</option>
                    {municipalities.map(m => <option key={m} value={m}>{m}</option>)}
                </Select>
            </Card>

            {selectedMunicipality && (
                <Card>
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
                        <h3 className="text-lg font-semibold text-gray-700">Notas de: <span className="font-bold text-blue-600">{selectedMunicipality}</span></h3>
                        <Button onClick={() => setIsModalOpen(true)} className="w-full md:w-auto">
                            <PlusCircle size={16} className="mr-2" />
                            Adicionar Nota
                        </Button>
                    </div>

                    <div className="p-4 mb-4 text-sm rounded-lg flex items-center gap-3 bg-blue-50 text-blue-700">
                        <Info className="w-5 h-5" />
                        <span className="font-medium">Atenção:</span>
                        <span>As notas de pagamento são geralmente referentes à prestação de serviço do mês anterior ao mês de pagamento efetivo. Verifique o mês de referência ao adicionar uma nova nota.</span>
                    </div>

                    <DataTable
                        columns={columns}
                        data={currentNotes}
                        emptyMessage="Nenhuma nota de pagamento encontrada para este município."
                    />
                </Card>
            )}

            <Modal isOpen={isModalOpen} onClose={resetModalState} title={`Adicionar Nota para ${selectedMunicipality}`}>
                <form onSubmit={(e) => { e.preventDefault(); handleSaveNote(); }} className="space-y-4">
                    {error && <Alert type="danger" message={error} />}
                    <div>
                        <label className="block text-sm font-medium text-blue-700 mb-1">Mês/Ano de Referência</label>
                        <Input type="month" value={newNoteData.referenceMonth} onChange={(e) => setNewNoteData({...newNoteData, referenceMonth: e.target.value})} required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-blue-700 mb-1">Descrição da Nota</label>
                        <Input type="text" placeholder="Ex: Nota Fiscal de Serviço #123" value={newNoteData.description} onChange={(e) => setNewNoteData({...newNoteData, description: e.target.value})} required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-blue-700 mb-1">Anexar Arquivo (PDF, Imagem, etc.)</label>
                        <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                        <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                            <Upload size={16} className="mr-2" />
                            Selecionar Arquivo
                        </Button>
                        {newNoteFile && <p className="text-sm text-gray-600 mt-2">Arquivo selecionado: {newNoteFile.name}</p>}
                    </div>
                    <div className="flex justify-end gap-4 pt-4 border-t">
                        <Button type="button" variant="secondary" onClick={resetModalState} disabled={isLoading}>Cancelar</Button>
                        <Button type="submit" isLoading={isLoading}>Salvar Nota</Button>
                    </div>
                </form>
            </Modal>
            
            <DeleteConfirmationModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Confirmar Exclusão"
                message={`Tem certeza que deseja excluir a nota "${noteToDelete?.description}" referente a ${noteToDelete?.referenceMonth}? Esta ação não pode ser desfeita.`}
            />
        </div>
    );
};

export default NotesTab;
