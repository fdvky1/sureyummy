import { Client } from 'minio'
import { randomUUID } from 'crypto'

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
//   port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || '',
  secretKey: process.env.MINIO_SECRET_KEY || '',
})

export const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'sureyummy'

export async function ensureBucketExists() {
  try {
    const exists = await minioClient.bucketExists(BUCKET_NAME)
    if (!exists) {
      await minioClient.makeBucket(BUCKET_NAME, 'us-east-1')
      
      // Set bucket policy to allow public read access
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

    // Upload to MinIO
    await minioClient.putObject(BUCKET_NAME, filename, buffer, buffer.length, {
      'Content-Type': file.type,
    })

    // Generate public URL
    const url = `${process.env.MINIO_PUBLIC_URL || 'http://localhost:9000'}/${BUCKET_NAME}/${filename}`

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
