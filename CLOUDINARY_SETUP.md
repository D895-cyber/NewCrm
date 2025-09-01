# Cloudinary Setup Guide

## 🚀 Getting Started with Cloudinary

### 1. Create Cloudinary Account
1. Go to [cloudinary.com](https://cloudinary.com)
2. Sign up for a free account
3. Get your credentials from the dashboard

### 2. Environment Variables
Create a `.env` file in the `server` directory with your Cloudinary credentials:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### 3. Find Your Credentials
In your Cloudinary dashboard:
- **Cloud Name**: Found in the dashboard URL
- **API Key**: Listed in the dashboard
- **API Secret**: Listed in the dashboard

### 4. Folder Structure
Cloudinary will automatically create this folder structure:
```
projectorcare/
├── 406024011/          # Serial Number
│   ├── VISIT-001/      # Visit ID
│   │   ├── 1733520472315_abc123.jpg
│   │   └── 1733520472316_def456.png
│   └── VISIT-002/
│       └── 1733520472317_ghi789.jpg
└── 406176013/          # Another Serial Number
    └── VISIT-003/
        └── 1733520472318_jkl012.jpg
```

## ✨ Cloudinary Features

### Automatic Image Optimization
- **Resize**: Large images automatically resized to 1200x800
- **Quality**: Auto-optimized for web delivery
- **Format**: Auto-converted to best format for browser

### CDN Delivery
- **Global CDN**: Images served from nearest edge location
- **Fast Loading**: Optimized delivery worldwide
- **Caching**: Automatic browser and CDN caching

### Image Transformations
- **URL-based**: Transform images via URL parameters
- **On-the-fly**: No need to store multiple versions
- **Responsive**: Different sizes for different devices

## 🔧 Usage Examples

### Upload Photo
```javascript
// Photos are automatically uploaded to Cloudinary
// with folder structure: projectorcare/{serialNumber}/{visitId}/
```

### Access Photo
```javascript
// Direct Cloudinary URL
const photoUrl = "https://res.cloudinary.com/your-cloud-name/image/upload/projectorcare/406024011/VISIT-001/1733520472315_abc123.jpg";

// With transformations
const optimizedUrl = "https://res.cloudinary.com/your-cloud-name/image/upload/w_800,h_600,c_fill/projectorcare/406024011/VISIT-001/1733520472315_abc123.jpg";
```

### Delete Photo
```javascript
// Automatically deleted from Cloudinary when service visit is deleted
```

## 📊 Cloudinary Dashboard

Monitor your usage in the Cloudinary dashboard:
- **Storage**: Total storage used
- **Bandwidth**: Data transfer
- **Transformations**: Image processing
- **Requests**: API calls

## 💰 Free Tier Limits
- **Storage**: 25 GB
- **Bandwidth**: 25 GB/month
- **Transformations**: 25,000/month
- **Requests**: 25,000/month

## 🔒 Security
- **API Key**: Keep your API secret secure
- **Environment Variables**: Never commit credentials to git
- **Signed URLs**: Optional for private images

## 🚀 Benefits
1. **Global CDN**: Fast image delivery worldwide
2. **Auto Optimization**: Images optimized automatically
3. **Transformations**: Resize, crop, filter on-the-fly
4. **Analytics**: Track image usage and performance
5. **Backup**: Automatic backup and versioning
6. **Scalability**: Handles unlimited images

## 📱 Mobile Optimization
Cloudinary automatically:
- Serves WebP to supported browsers
- Resizes images for mobile devices
- Optimizes quality for different screen sizes
- Caches images for faster loading 