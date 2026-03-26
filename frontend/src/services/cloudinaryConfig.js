// ──────────────────────────────────────────────────────────────
// Cloudinary Configuration (Free Tier — 25 GB storage/month)
// ──────────────────────────────────────────────────────────────
//
// HOW TO SET UP (one-time, takes 2 minutes):
//
// 1. Go to https://cloudinary.com and create a FREE account
// 2. After sign-up, you'll see your Dashboard
//    → Copy your "Cloud Name" (e.g. "dxyz1234")
// 3. Go to Settings (gear icon) → Upload tab
//    → Scroll to "Upload presets" → click "Add upload preset"
//    → Set "Signing Mode" to "Unsigned"
//    → Click Save
//    → Copy the preset name (e.g. "ml_default")
// 4. Paste both values below and save this file
// ──────────────────────────────────────────────────────────────

export const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'YOUR_CLOUD_NAME_HERE'
export const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'YOUR_UPLOAD_PRESET_HERE'

// Upload endpoint (auto-detects file type: image, video, pdf, raw)
export const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`
