import React, { useEffect } from 'react';


interface ModalProps {
    isVisible: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isVisible, onClose, children }) => {
    useEffect(() => {
        const handleOutsideClick = (event: MouseEvent) => {
            if ((event.target as Element).classList.contains("modal-overlay")) {
                onClose();
            }
        };

        if (isVisible) {
            document.addEventListener("click", handleOutsideClick);
        }

        return () => {
            document.removeEventListener("click", handleOutsideClick);
        };
    }, [isVisible, onClose]);

    if (!isVisible) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 modal-overlay" onClick={onClose}>
            <div className="bg-white p-6 rounded-lg shadow-lg relative w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                <button
                    className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
                    onClick={onClose}
                >
                    &times;
                </button>
                <div className="mt-4">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
