/**
 * Upload a file (Disabled - not yet implemented in backend)
 */
export async function uploadFile(file, folder = 'timesheet-attachments') {
  throw new Error('File upload is not yet implemented in the backend API.')
}

/**
 * Delete a file (Disabled - not yet implemented in backend)
 */
export async function deleteFile(publicId) {
  console.warn('File deletion skipped: not yet implemented in backend')
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
