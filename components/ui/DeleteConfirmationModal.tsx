import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isLoading?: boolean;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  isLoading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
        </div>
        <div className="mt-3 text-center sm:mt-5">
            <h3 className="text-lg leading-6 font-medium text-gray-900">{title}</h3>
            <div className="mt-2">
                <p className="text-sm text-gray-500">{message}</p>
            </div>
        </div>
      </div>
      <div className="mt-5 sm:mt-6 flex justify-center gap-4">
        <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="button" variant="danger" onClick={onConfirm} isLoading={isLoading}>
          Confirmar Exclusão
        </Button>
      </div>
    </Modal>
  );
};

export default DeleteConfirmationModal;
