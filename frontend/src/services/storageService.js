const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5231/api'

function getToken() {
  return localStorage.getItem('auth_token')
}

/**
 * Upload a file to the backend
 * @param {File} file - The file to upload
 * @param {string} folder - Subfolder name (e.g. 'timesheet-attachments', 'finance-receipts')
 * @returns {Promise<{url: string, fileName: string, fileType: string, fileSize: number}>}
 */
export async function uploadFile(file, folder = 'general') {
  const token = getToken()
  const formData = new FormData()
  formData.append('file', file)
  formData.append('folder', folder)

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: formData
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error || `Upload failed with status ${response.status}`)
  }

  const data = await response.json()
  // Return full URL for display/download
  const baseUrl = API_BASE_URL.replace('/api', '')
  return {
    url: `${baseUrl}${data.url}`,
    fileName: data.fileName,
    fileType: data.fileType,
    fileSize: data.fileSize,
    publicId: data.url // Use the relative path as the publicId for deletion
  }
}

/**
 * Delete a file from the backend
 * @param {string} publicId - The relative URL path (e.g. /uploads/general/abc123.jpg)
 */
export async function deleteFile(publicId) {
  if (!publicId) return { success: true }

  const token = getToken()
  // Extract relative path if full URL was passed
  const relPath = publicId.includes('/uploads/')
    ? publicId.substring(publicId.indexOf('/uploads/'))
    : publicId

  const response = await fetch(`${API_BASE_URL}/upload?url=${encodeURIComponent(relPath)}`, {
    method: 'DELETE',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  })

  if (!response.ok) {
    console.warn('File deletion failed:', response.status)
  }

  return { success: true }
}

/**
 * Format file size to human readable string
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

/**
 * Get a friendly file type label from MIME type
 * @param {string} mimeType
 * @returns {string}
 */
export function getFileTypeLabel(mimeType) {
  if (!mimeType) return 'File'
  if (mimeType.startsWith('image/')) return 'Image'
  if (mimeType === 'application/pdf') return 'PDF'
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType === 'text/csv') return 'Spreadsheet'
  if (mimeType.includes('document') || mimeType.includes('word')) return 'Document'
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'Presentation'
  if (mimeType.startsWith('video/')) return 'Video'
  if (mimeType.startsWith('audio/')) return 'Audio'
  if (mimeType.startsWith('text/')) return 'Text'
  if (mimeType.includes('zip') || mimeType.includes('compressed') || mimeType.includes('archive')) return 'Archive'
  return 'File'
}
