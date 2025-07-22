import React, { useState, useContext, useRef } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import { User, UploadCloud } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const authContext = useContext(AuthContext);
  if (!authContext) return null;

  const { user, updatePfp, loading } = authContext;
  const [pfpPreview, setPfpPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
          setError("O arquivo é muito grande. O limite é 2MB.");
          setPfpPreview(null); // Clear previous preview on error
          return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setPfpPreview(event.target?.result as string);
      };
      reader.onerror = () => {
        setError("Não foi possível ler o arquivo.");
      }
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (pfpPreview) {
      updatePfp(pfpPreview);
      handleClose();
    } else {
        setError("Por favor, selecione uma imagem primeiro.");
    }
  };
  
  const handleClose = () => {
    setPfpPreview(null);
    setError(null);
    onClose();
  }

  const triggerFileSelect = () => fileInputRef.current?.click();

  const currentImage = pfpPreview || user?.pfp;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Alterar Foto de Perfil" size="sm">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-4 border-gray-300">
          {currentImage ? (
            <img src={currentImage} alt="Pré-visualização" className="w-full h-full object-cover" />
          ) : (
            <User className="w-16 h-16 text-gray-400" />
          )}
        </div>
        
        {error && <Alert type="danger" message={error} />}

        <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png, image/jpeg, image/gif"
            className="hidden"
        />

        <Button variant="secondary" onClick={triggerFileSelect}>
            <UploadCloud size={16} className="mr-2" />
            Escolher Imagem
        </Button>
        
        <div className="w-full flex justify-end gap-4 pt-4 border-t">
            <Button variant="secondary" onClick={handleClose}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!pfpPreview || !!error} isLoading={loading}>
                Salvar Alterações
            </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ProfileModal;
