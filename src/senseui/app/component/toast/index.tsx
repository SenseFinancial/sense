"use client"

export default function Toast({ isOpen, onRequestClose, message }: { isOpen: boolean, onRequestClose: () => void, message: string }) {
    return (
        isOpen ?
            (<div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-xl">
                <span>{message}</span>
                <button className="text-slate-400 hover:text-white" onClick={onRequestClose}>&times;</button>
            </div>) : null
    );
}