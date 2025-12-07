import fs from 'fs'
import path from 'path'

/**
 * Check if demo mode is enabled
 */
export function isDemoMode(): boolean {
    return process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
}

/**
 * Get default demo data IDs from JSON files
 */
export function getDefaultDemoIds(type: 'User' | 'MenuItem' | 'Table'): string[] {
    if (!isDemoMode()) return []
    
    try {
        const filePath = path.join(process.cwd(), '.demo', 'default', `${type}.json`)
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
        return data.map((item: any) => item.id)
    } catch (error) {
        console.error(`Error reading demo data for ${type}:`, error)
        return []
    }
}

/**
 * Check if an ID is a default demo data
 */
export function isDefaultDemoData(id: string, type: 'User' | 'MenuItem' | 'Table'): boolean {
    if (!isDemoMode()) return false
    
    const defaultIds = getDefaultDemoIds(type)
    return defaultIds.includes(id)
}

/**
 * Validate if operation is allowed in demo mode
 * @throws Error if operation is not allowed
 */
export function validateDemoOperation(
    operation: 'update' | 'delete',
    id: string,
    type: 'User' | 'MenuItem' | 'Table'
): void {
    if (!isDemoMode()) return
    
    if (isDefaultDemoData(id, type)) {
        throw new Error(
            `Demo Mode: Cannot ${operation} default ${type.toLowerCase()} data. You can only modify data you created.`
        )
    }
}

/**
 * Validate if MinIO operation is allowed in demo mode
 * @throws Error if operation is not allowed
 */
export function validateMinioOperation(operation: 'upload' | 'delete'): void {
    if (!isDemoMode()) return
    
    throw new Error(
        `Demo Mode: File ${operation} is disabled in demo environment.`
    )
}
