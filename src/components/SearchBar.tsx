'use client'

import { useState, useEffect } from 'react'

type SearchBarProps = {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    className?: string
}

export default function SearchBar({ value, onChange, placeholder = "Cari...", className = "" }: SearchBarProps) {
    const [localValue, setLocalValue] = useState(value)

    useEffect(() => {
        setLocalValue(value)
    }, [value])

    function handleChange(newValue: string) {
        setLocalValue(newValue)
        onChange(newValue)
    }

    function handleClear() {
        setLocalValue('')
        onChange('')
    }

    return (
        <label className={`input input-bordered flex items-center gap-2 ${className}`}>
            <svg className="h-[1em] opacity-70" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <g strokeLinejoin="round" strokeLinecap="round" strokeWidth="2.5" fill="none" stroke="currentColor">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.3-4.3"></path>
                </g>
            </svg>
            <input 
                type="search" 
                className="grow" 
                placeholder={placeholder}
                value={localValue}
                onChange={(e) => handleChange(e.target.value)}
            />
            {/* {localValue && (
                <button 
                    className="btn btn-ghost btn-xs btn-circle"
                    onClick={handleClear}
                    type="button"
                    aria-label="Clear search"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            )} */}
        </label>
    )
}
