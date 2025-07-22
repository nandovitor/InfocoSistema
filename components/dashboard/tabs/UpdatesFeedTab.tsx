
import React, { useState, useContext } from 'react';
import { useData } from '../../../contexts/DataContext';
import { AuthContext } from '../../../contexts/AuthContext';
import { UpdatePost } from '../../../types';
import { timeAgo, getSystemUser, getUserInitials } from '../../../lib/utils';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import DeleteConfirmationModal from '../../ui/DeleteConfirmationModal';
import { PlusCircle, Edit, Trash2, User as UserIcon } from 'lucide-react';

// Markdown-like renderer
const PostContent: React.FC<{ content: string }> = ({ content }) => {
    const renderContent = () => {
        let html = '';
        let inList = false;
        const lines = content.split('\n');

        const processInline = (line: string) => line
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');

        lines.forEach(line => {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
                if (!inList) {
                    html += '<ul>';
                    inList = true;
                }
                html += `<li style="margin-left: 20px; list-style-type: disc;">${processInline(trimmedLine.substring(2))}</li>`;
            } else {
                if (inList) {
                    html += '</ul>';
                    inList = false;
                }
                if (trimmedLine) {
                    html += `<p>${processInline(line)}</p>`;
                }
            }
        });
        if (inList) html += '</ul>';
        return <div className="text-sm text-gray-700 space-y-2" dangerouslySetInnerHTML={{ __html: html }} />;
    };
    return renderContent();
};

const PostFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (content: string) => void;
    initialContent?: string;
}> = ({ isOpen, onClose, onSave, initialContent = '' }) => {
    const [content, setContent] = useState(initialContent);

    const handleSave = () => {
        if (content.trim()) {
            onSave(content);
            onClose();
        }
    };
    
    React.useEffect(() => {
        if (isOpen) {
            setContent(initialContent);
        }
    }, [isOpen, initialContent]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialContent ? 'Editar Publicação' : 'Nova Publicação'}>
            <div className="space-y-4">
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={8}
                    className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    placeholder="Escreva sua atualização aqui... Use **negrito** e *itálico* para formatar."
                />
                <div className="flex justify-end gap-4">
                    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave}>Salvar</Button>
                </div>
            </div>
        </Modal>
    );
};

const UpdatesFeedTab: React.FC = () => {
    const { updatePosts, addUpdatePost, updateUpdatePost, deleteUpdatePost, systemUsers, permissions } = useData();
    const authContext = useContext(AuthContext);
    const currentUser = authContext?.user;
    const userPermissions = currentUser ? permissions[currentUser.role] : null;
    
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [editingPost, setEditingPost] = useState<UpdatePost | null>(null);
    const [deletingPostId, setDeletingPostId] = useState<number | null>(null);
    
    const sortedPosts = [...updatePosts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const handleOpenNewPostModal = () => {
        setEditingPost(null);
        setIsFormModalOpen(true);
    };

    const handleOpenEditPostModal = (post: UpdatePost) => {
        setEditingPost(post);
        setIsFormModalOpen(true);
    };

    const handleSavePost = (content: string) => {
        if (editingPost) {
            updateUpdatePost({ ...editingPost, content });
        } else if (currentUser) {
            const systemUserAuthor = systemUsers.find(u => u.email === currentUser.email);
            if (systemUserAuthor) {
                addUpdatePost({ authorId: systemUserAuthor.id, content });
            } else {
                console.error("Não foi possível encontrar o usuário do sistema para atribuir a publicação.");
            }
        }
    };

    const handleDeleteRequest = (id: number) => {
        setDeletingPostId(id);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if (deletingPostId) {
            deleteUpdatePost(deletingPostId);
        }
        setDeletingPostId(null);
        setIsConfirmModalOpen(false);
    };
    
    const canPost = userPermissions?.canPostUpdates;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Notas de Atualização</h2>
                {canPost && (
                    <Button onClick={handleOpenNewPostModal}>
                        <PlusCircle size={16} className="mr-2"/>
                        Nova Publicação
                    </Button>
                )}
            </div>

            {sortedPosts.length > 0 ? (
                <div className="space-y-6">
                    {sortedPosts.map(post => {
                        const author = getSystemUser(post.authorId, systemUsers);
                        return (
                            <Card key={post.id}>
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold shrink-0">
                                        {author ? getUserInitials(author.name) : <UserIcon />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold text-gray-900">{author?.name || 'Usuário Desconhecido'}</p>
                                                <p className="text-xs text-gray-500">{timeAgo(post.createdAt)}</p>
                                            </div>
                                            {canPost && (
                                                <div className="flex items-center gap-2">
                                                    <Button variant="secondary" size="sm" className="p-2 h-auto" onClick={() => handleOpenEditPostModal(post)}><Edit size={16}/></Button>
                                                    <Button variant="danger" size="sm" className="p-2 h-auto" onClick={() => handleDeleteRequest(post.id)}><Trash2 size={16}/></Button>
                                                </div>
                                            )}
                                        </div>
                                        <div className="mt-4">
                                           <PostContent content={post.content} />
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        )
                    })}
                </div>
            ) : (
                <Card className="text-center py-12">
                    <h3 className="text-lg font-medium text-gray-700">Nenhuma atualização publicada ainda.</h3>
                    <p className="text-gray-500 mt-2">Volte em breve para ver as novidades!</p>
                </Card>
            )}

            <PostFormModal 
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                onSave={handleSavePost}
                initialContent={editingPost?.content}
            />
            
            <DeleteConfirmationModal 
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Confirmar Exclusão"
                message="Tem certeza que deseja excluir esta publicação? Esta ação é irreversível."
            />
        </div>
    );
};

export default UpdatesFeedTab;
