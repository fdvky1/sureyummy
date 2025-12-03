"use client";

import useToastStore from "@/stores/toast";

export default function Toast(){
    const { text, type } = useToastStore();
    return text.length > 0 ? (
        <div className="toast toast-top toast-end z-[999999]">
          <div className={"alert text-white alert-" + type}>
            <span>{text}</span>
          </div>
        </div>
    ) : (<></>)
}