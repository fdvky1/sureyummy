"use client";

import useModalStore from "@/stores/modal";
import { useEffect } from "react";

export default function Modal(){
    const store = useModalStore();
    useEffect(()=>{
      if(store.isActive){
        (document.getElementById('modal') as HTMLDialogElement).showModal()
      }
    }, [store])
    return store.isActive ? (
      <dialog id="modal" className="modal">
        <div className="modal-box">
          {!store.hideCloseBtn ? (
            <form method="dialog">
              <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
            </form>
          ): <></>}
          {store.title ? <h3 className="font-bold text-lg">{store.title}</h3> : <></>}
          {store.content ? <p className="py-4">{store.content}</p> : <></>}
          
          {store.inputField && (
            <div className="form-control py-4">
              {store.inputField.label && (
                <label className="label">
                  <span className="label-text">{store.inputField.label}</span>
                </label>
              )}
              <input
                type="text"
                value={store.inputField.value}
                onChange={(e) => {
                  store.updateInputValue(e.target.value)
                  store.inputField?.onChange?.(e.target.value)
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && store.confirmButton?.onClick) {
                    e.preventDefault()
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    store.confirmButton.onClick(e as any)
                  }
                }}
                className="input input-bordered w-full"
                placeholder={store.inputField.placeholder}
                autoFocus
              />
            </div>
          )}
          
          {store.cancelButton?.active || store.confirmButton?.active ? (
            <div className="modal-action justify-end gap-2">
                {store.cancelButton?.active ? (
                  <>
                    <form method="dialog">
                      <button className={store.cancelButton.className + " btn"} onClick={store.cancelButton.onClick}>{store.cancelButton.text}</button>
                    </form>
                  </>
                ): <></>}
                {store.confirmButton?.active ? <button type="button" className={store.confirmButton.className + " btn"} onClick={store.confirmButton.onClick}>{store.confirmButton.text}</button> : <></>}
            </div>
          ): <></>}
        </div>
      </dialog>
    ) : (<></>)
}