import { create } from "zustand"
import { MouseEvent } from "react"

type Btn = {
    text?: string;
    active?: boolean;
    className?: string;
    onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
}

type InputField = {
    value: string;
    placeholder?: string;
    label?: string;
    onChange?: (value: string) => void;
}

type Modal = {
    isActive: boolean;
    title?: string;
    content?: string;
    hideCloseBtn: boolean;
    inputField?: InputField;
    cancelButton?: Btn;
    confirmButton?: Btn;
    setModal: (opt: { 
        title?: string, 
        content?: string, 
        hideCloseBtn?: boolean, 
        inputField?: InputField,
        cancelButton?: Btn, 
        confirmButton?: Btn 
    }) => void
    resetModal: () => void;
    updateInputValue: (value: string) => void;
}

const useModalStore = create<Modal>()((set, get)=>({
    isActive: false,
    hideCloseBtn: false,
    setModal: (opt) => {
        get().resetModal();
        set(() => ({...opt, isActive: true, hideCloseBtn: (opt.hideCloseBtn || false)}));
    },
    resetModal: () => {
        set(() => ({ 
            title: undefined, 
            content: undefined, 
            inputField: undefined,
            cancelButton: undefined, 
            confirmButton: undefined, 
            isActive: false, 
            hideCloseBtn: false 
        }));
    },
    updateInputValue: (value: string) => {
        set((state) => ({
            ...state,
            inputField: state.inputField ? { ...state.inputField, value } : undefined
        }));
    }
}));

export default useModalStore;