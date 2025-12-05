import { Client } from 'minio'
import { randomUUID } from 'crypto'

// Compatible with MinIO, S3, and Cloudflare R2
// For Cloudflare R2:
// - MINIO_ENDPOINT: <account_id>.r2.cloudflarestorage.com (NO https://, just hostname!)
// - MINIO_USE_SSL: true
// - MINIO_ACCESS_KEY: R2 Access Key ID
// - MINIO_SECRET_KEY: R2 Secret Access Key
// - MINIO_PUBLIC_URL: https://<custom-domain> or https://<bucket>.r2.dev (if public access enabled)

// Parse endpoint to remove protocol if accidentally included
function parseEndpoint(endpoint: string): string {
  if (!endpoint) return 'localhost'
  // Remove https:// or http:// if present
  return endpoint.replace(/^https?:\/\//, '')
}

const minioClient = new Client({
  endPoint: parseEndpoint(process.env.MINIO_ENDPOINT || 'localhost'),
  port: process.env.MINIO_PORT ? parseInt(process.env.MINIO_PORT) : undefined,
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || '',
  secretKey: process.env.MINIO_SECRET_KEY || '',
  // R2 doesn't use regions but we can set it for compatibility
  region: process.env.MINIO_REGION || 'auto',
})

export const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'sureyummy'

export async function ensureBucketExists() {
  try {
    const exists = await minioClient.bucketExists(BUCKET_NAME)
    if (!exists) {
      // Create bucket with region (auto for R2, us-east-1 for MinIO/S3)
      const region = process.env.MINIO_REGION || 'auto'
      await minioClient.makeBucket(BUCKET_NAME, region)
      
      // Set bucket policy to allow public read access
      // Note: For R2, you may need to enable public access in R2 dashboard
      // and use Custom Domains or r2.dev subdomain for public URLs
      try {
        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`],
            },
          ],
        }
        await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy))
      } catch (policyError) {
        // R2 might not support bucket policies the same way, that's okay
        console.warn('Could not set bucket policy (might be R2):', policyError)
      }
    }
  } catch (error) {
    console.error('Error ensuring bucket exists:', error)
    throw error
  }
}

export async function uploadImage(file: File) {
  try {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
    if (!validTypes.includes(file.type)) {
      return { success: false, error: 'Format file tidak valid. Gunakan JPG, PNG, atau WEBP' }
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: 'Ukuran file maksimal 5MB' }
    }

    // Ensure bucket exists
    await ensureBucketExists()

    // Generate unique filename
    const ext = file.name.split('.').pop()
    const filename = `menu/${randomUUID()}.${ext}`

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to MinIO/S3/R2
    await minioClient.putObject(BUCKET_NAME, filename, buffer, buffer.length, {
      'Content-Type': file.type,
    })

    // Generate public URL
    // For R2: use custom domain (e.g., https://cdn.yourdomain.com/filename)
    // or public R2.dev URL (e.g., https://pub-xxx.r2.dev/filename)
    const publicUrl = process.env.MINIO_PUBLIC_URL || 'http://localhost:9000'
    
    // Check if public URL already includes bucket name
    const url = `${publicUrl}/${filename}`

    return { success: true, url }
  } catch (error) {
    console.error('Error uploading image:', error)
    return { success: false, error: 'Gagal mengupload gambar' }
  }
}

export async function deleteImage(imageUrl: string) {
  try {
    // Extract filename from URL
    const url = new URL(imageUrl)
    const filename = url.pathname.split(`/${BUCKET_NAME}/`)[1]
    
    if (filename) {
      await minioClient.removeObject(BUCKET_NAME, filename)
    }
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting image:', error)
    return { success: false, error: 'Gagal menghapus gambar' }
  }
}

export default minioClient
