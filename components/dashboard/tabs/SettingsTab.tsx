
import React, { useState, useRef } from 'react';
import { useData } from '../../../contexts/DataContext';
import { UserRole, PermissionSet, FinanceData, ExternalSystem, ExternalSystemType } from '../../../types';
import { PERMISSION_LABELS, ROLE_LABELS, EXTERNAL_SYSTEM_TYPES } from '../../../constants';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import Select from '../../ui/Select';
import { UploadCloud, Image as ImageIcon, Trash2, Link as LinkIcon, PlusCircle } from 'lucide-react';
import Alert from '../../ui/Alert';
import Modal from '../../ui/Modal';
import DataTable, { Column } from '../../ui/DataTable';
import DeleteConfirmationModal from '../../ui/DeleteConfirmationModal';


const MAX_IMAGE_SIZE_MB = 2;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        if (file.size > MAX_IMAGE_SIZE_BYTES) {
            return reject(new Error(`O arquivo é muito grande. O limite é ${MAX_IMAGE_SIZE_MB}MB.`));
        }
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
};

const CoatOfArmsModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    municipality: FinanceData;
    onSave: (municipality: FinanceData) => void;
}> = ({ isOpen, onClose, municipality, onSave }) => {
    const [preview, setPreview] = useState<string | null>(municipality.coatOfArmsUrl || null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);
        const file = e.target.files?.[0];
        if (file) {
            try {
                const dataUrl = await readFileAsDataURL(file);
                setPreview(dataUrl);
            } catch (err: any) {
                setError(err.message);
                setPreview(null);
            }
        }
    };

    const handleSave = () => {
        onSave({ ...municipality, coatOfArmsUrl: preview || undefined });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Editar Brasão de ${municipality.municipality}`}>
            <div className="flex flex-col items-center space-y-4">
                <div className="w-32 h-32 rounded-lg bg-gray-200 flex items-center justify-center overflow-hidden border">
                    {preview ? <img src={preview} alt="Pré-visualização" className="w-full h-full object-contain" /> : <ImageIcon className="w-16 h-16 text-gray-400" />}
                </div>
                {error && <Alert type="danger" message={error} />}
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg, image/gif, image/svg+xml" className="hidden" />
                <Button variant="secondary" onClick={() => fileInputRef.current?.click()}><UploadCloud size={16} className="mr-2" />Escolher Imagem</Button>
                <div className="w-full flex justify-end gap-4 pt-4 border-t">
                    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave}>Salvar Alterações</Button>
                </div>
            </div>
        </Modal>
    );
};

const IntegrationForm: React.FC<{
  system: Partial<ExternalSystem>;
  setSystem: React.Dispatch<React.SetStateAction<Partial<ExternalSystem>>>;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}> = ({ system, setSystem, onSubmit, onCancel }) => (
    <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">Sistema</label>
                <Input type="text" placeholder="Nome do sistema externo" value={system.name || ''} onChange={e => setSystem({ ...system, name: e.target.value })} required />
            </div>
             <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">Tipo de Sistema</label>
                <Select value={system.type || ''} onChange={e => setSystem({ ...system, type: e.target.value as ExternalSystemType })} required >
                    <option value="" disabled>Selecione um tipo de sistema</option>
                    {EXTERNAL_SYSTEM_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                </Select>
            </div>
        </div>
        <div>
            <label className="block text-sm font-medium text-blue-700 mb-1">URL da API</label>
            <Input type="url" placeholder="https://api.sistema.com" value={system.apiUrl || ''} onChange={e => setSystem({ ...system, apiUrl: e.target.value })} required />
        </div>
        <div>
            <label className="block text-sm font-medium text-blue-700 mb-1">Access Token</label>
            <Input type="password" placeholder="EX: 1234567890" value={system.accessToken || ''} onChange={e => setSystem({ ...system, accessToken: e.target.value })} required />
        </div>
        <div>
            <label className="block text-sm font-medium text-blue-700 mb-1">Tipo do Token</label>
            <Input type="text" placeholder="EX: Bearer" value={system.tokenType || ''} onChange={e => setSystem({ ...system, tokenType: e.target.value })} required />
        </div>
        <div className="flex justify-end gap-4 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
            <Button type="submit">Salvar Integração</Button>
        </div>
    </form>
);


const SettingsTab: React.FC = () => {
    const { 
        permissions, updatePermissions, loginScreenImageUrl, updateLoginScreenImage, 
        financeData, updateMunicipality,
        externalSystems, addExternalSystem, updateExternalSystem, deleteExternalSystem
    } = useData();
    const [loginImagePreview, setLoginImagePreview] = useState<string | null>(loginScreenImageUrl);
    const [loginImageError, setLoginImageError] = useState<string | null>(null);
    const loginFileInputRef = useRef<HTMLInputElement>(null);
    const [isCoatModalOpen, setIsCoatModalOpen] = useState(false);
    const [selectedMunicipality, setSelectedMunicipality] = useState<FinanceData | null>(null);

    const [isIntegrationModalOpen, setIntegrationModalOpen] = useState(false);
    const [isIntegrationConfirmOpen, setIntegrationConfirmOpen] = useState(false);
    const [editingIntegration, setEditingIntegration] = useState<Partial<ExternalSystem>>({});
    const [deletingIntegrationId, setDeletingIntegrationId] = useState<number | null>(null);

    const configurableRoles = (Object.keys(permissions) as UserRole[]).filter(role => role !== 'admin');
    const permissionKeys = Object.keys(PERMISSION_LABELS) as Array<keyof PermissionSet>;

    const handlePermissionChange = (role: UserRole, pKey: keyof PermissionSet, checked: boolean) => {
        if (pKey === 'canManageSettings' || pKey === 'canManageUsers') return;
        updatePermissions(role, pKey, checked);
    };

    const handleLoginFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        setLoginImageError(null);
        const file = e.target.files?.[0];
        if (file) {
            try {
                const dataUrl = await readFileAsDataURL(file);
                setLoginImagePreview(dataUrl);
            } catch (err: any) {
                setLoginImageError(err.message);
                setLoginImagePreview(null);
            }
        }
    };
    
    const handleSaveLoginImage = () => {
        updateLoginScreenImage(loginImagePreview);
        alert("Imagem da tela de login atualizada com sucesso!");
    };

    const handleRemoveLoginImage = () => {
        setLoginImagePreview(null);
        updateLoginScreenImage(null);
        alert("Imagem da tela de login removida.");
    }
    
    const openCoatOfArmsModal = (municipality: FinanceData) => {
        setSelectedMunicipality(municipality);
        setIsCoatModalOpen(true);
    };

    // --- Integration Handlers ---
    const openIntegrationModalForNew = () => {
        setEditingIntegration({ tokenType: 'Bearer' });
        setIntegrationModalOpen(true);
    };
    const openIntegrationModalForEdit = (system: ExternalSystem) => {
        setEditingIntegration(system);
        setIntegrationModalOpen(true);
    };
    const handleSaveIntegration = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingIntegration.id) {
            updateExternalSystem(editingIntegration as ExternalSystem);
        } else {
            addExternalSystem(editingIntegration as Omit<ExternalSystem, 'id'>);
        }
        setIntegrationModalOpen(false);
    };
    const handleDeleteIntegrationRequest = (id: number) => {
        setDeletingIntegrationId(id);
        setIntegrationConfirmOpen(true);
    };
    const handleConfirmDeleteIntegration = () => {
        if (deletingIntegrationId) {
            deleteExternalSystem(deletingIntegrationId);
        }
        setIntegrationConfirmOpen(false);
        setDeletingIntegrationId(null);
    };
    
    const integrationColumns: Column<ExternalSystem>[] = [
        { key: 'name', header: 'Sistema', className: 'font-medium text-gray-900' },
        { key: 'type', header: 'Tipo' },
        { key: 'apiUrl', header: 'URL da API' },
        { key: 'actions', header: 'Ações', className: 'text-right' }
    ];

    return (
        <div className="space-y-8">
            <Card>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Aparência do Sistema</h2>
                <p className="text-sm text-gray-500 mb-6">Personalize a identidade visual do sistema.</p>
                <div className="space-y-4">
                    <h3 className="font-semibold text-gray-700">Logo da Tela de Login</h3>
                    {loginImageError && <Alert type="danger" message={loginImageError} />}
                    <div className="flex items-center gap-6">
                        <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-2">
                             {loginImagePreview ? (
                                <img src={loginImagePreview} alt="Preview" className="w-full h-full object-cover" />
                             ) : (
                                <ImageIcon className="w-12 h-12 text-gray-400" />
                             )}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                             <input type="file" ref={loginFileInputRef} onChange={handleLoginFileChange} accept="image/*" className="hidden" />
                            <Button variant="secondary" onClick={() => loginFileInputRef.current?.click()}><UploadCloud size={16} className="mr-2" />Alterar Imagem</Button>
                            <Button onClick={handleSaveLoginImage} disabled={loginImagePreview === loginScreenImageUrl}>Salvar</Button>
                            {loginScreenImageUrl && <Button variant="danger" onClick={handleRemoveLoginImage}><Trash2 size={16} className="mr-2"/>Remover</Button>}
                        </div>
                    </div>
                </div>
            </Card>

            <Card>
                <div className="flex items-center gap-3 mb-2">
                     <LinkIcon className="w-6 h-6 text-gray-700" />
                    <h2 className="text-xl font-semibold text-gray-800">Integrações</h2>
                </div>
                <p className="text-sm text-gray-500 mb-6">Gerencie conexões com sistemas externos para troca de informações.</p>
                <div className="flex justify-end mb-4">
                    <Button onClick={openIntegrationModalForNew}>
                        <PlusCircle size={16} className="mr-2" />
                        Adicionar Integração
                    </Button>
                </div>
                <DataTable 
                    columns={integrationColumns}
                    data={externalSystems}
                    onEdit={openIntegrationModalForEdit}
                    onDelete={handleDeleteIntegrationRequest}
                    emptyMessage="Nenhuma integração cadastrada."
                />
            </Card>

            <Card>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Gerenciamento de Municípios</h2>
                <p className="text-sm text-gray-500 mb-6">Edite os brasões que representam cada município no sistema.</p>
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {financeData.map(muni => (
                        <div key={muni.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white border rounded-md flex items-center justify-center overflow-hidden">
                                    {muni.coatOfArmsUrl ? <img src={muni.coatOfArmsUrl} alt={`Brasão de ${muni.municipality}`} className="w-full h-full object-contain p-1" /> : <ImageIcon className="w-6 h-6 text-gray-400" />}
                                </div>
                                <span className="font-medium text-gray-800">{muni.municipality}</span>
                            </div>
                            <Button size="sm" variant="secondary" onClick={() => openCoatOfArmsModal(muni)}>Editar Brasão</Button>
                        </div>
                    ))}
                </div>
            </Card>
            
            <Card>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Permissões por Função</h2>
                <p className="text-sm text-gray-500 mb-6">Controle o que cada função de usuário pode ver e fazer. As permissões de Administrador não podem ser alteradas.</p>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 min-w-[200px]">Permissão</th>
                                {configurableRoles.map(role => (
                                    <th key={role} scope="col" className="px-6 py-3 text-center">{ROLE_LABELS[role]}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {permissionKeys.map(pKey => {
                                if ((pKey === 'canManageSettings' || pKey === 'canManageUsers') && configurableRoles.includes('admin')) {
                                   return null;
                                }
                                return (
                                <tr key={pKey} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{PERMISSION_LABELS[pKey]}</td>
                                    {configurableRoles.map(role => (
                                        <td key={`${role}-${pKey}`} className="px-6 py-4 text-center">
                                            <label className="relative inline-flex items-center cursor-pointer justify-center">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={permissions[role]?.[pKey] || false}
                                                    onChange={(e) => updatePermissions(role, pKey, e.target.checked)}
                                                    disabled={pKey === 'canManageSettings' || pKey === 'canManageUsers'}
                                                />
                                                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
                                            </label>
                                        </td>
                                    ))}
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            </Card>
            {selectedMunicipality && (
                <CoatOfArmsModal 
                    isOpen={isCoatModalOpen} 
                    onClose={() => setIsCoatModalOpen(false)} 
                    municipality={selectedMunicipality}
                    onSave={updateMunicipality}
                />
            )}
             <Modal isOpen={isIntegrationModalOpen} onClose={() => setIntegrationModalOpen(false)} title={editingIntegration.id ? 'Editar Integração' : 'Cadastrar Sistema Externo'} size="lg">
                <IntegrationForm system={editingIntegration} setSystem={setEditingIntegration} onSubmit={handleSaveIntegration} onCancel={() => setIntegrationModalOpen(false)} />
            </Modal>
            <DeleteConfirmationModal
                isOpen={isIntegrationConfirmOpen}
                onClose={() => setIntegrationConfirmOpen(false)}
                onConfirm={handleConfirmDeleteIntegration}
                title="Confirmar Exclusão"
                message="Tem certeza que deseja excluir esta integração? A conexão com o sistema externo será perdida."
            />
        </div>
    );
};

export default SettingsTab;