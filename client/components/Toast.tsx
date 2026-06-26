import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

let globalShowToast: ((message: string, type: ToastType) => void) | null = null;

export function showToast(message: string, type: ToastType) {
    if (globalShowToast) {
        globalShowToast(message, type);
    } else {
        console.error('Toast system not initialized:', message);
    }
}

interface ToastItemProps {
    toast: Toast;
    onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onRemove(toast.id);
        }, 5000);
        return () => clearTimeout(timer);
    }, [toast.id, onRemove]);

    const bgColor = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-blue-500',
    }[toast.type];

    const icon = {
        success: '\u2713',
        error: '\u2717',
        info: '\u2139',
    }[toast.type];

    return (
        <div
            className={`${bgColor} text-white px-4 py-3 rounded-md shadow-lg mb-2 flex items-start gap-2 max-w-sm animate-slide-in`}
            role="alert"
        >
            <p className="font-bold text-lg leading-none">{icon}</p>
            <p className="flex-1 break-words whitespace-pre-wrap">{toast.message}</p>
            <button
                onClick={() => onRemove(toast.id)}
                className="text-white hover:text-gray-200 font-bold text-lg leading-none ml-2"
                aria-label="Close"
            >
                &times;
            </button>
        </div>
    );
}

interface ToastProviderProps {
    children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const addToast = useCallback((message: string, type: ToastType) => {
        const id = Math.random().toString(36).slice(2, 10);
        setToasts((prev) => [...prev, { id, message, type }]);
    }, []);

    useEffect(() => {
        globalShowToast = addToast;
        return () => {
            globalShowToast = null;
        };
    }, [addToast]);

    return (
        <ToastContext.Provider value={{ showToast: addToast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
                {toasts.map((toast) => (
                    <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}
