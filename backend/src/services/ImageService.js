const crypto = require('crypto');
const { adminClient } = require('../config/supabase');

const BUCKET = 'attendance-photos';

/**
 * ImageService - Single Responsibility: Image upload and management
 * Wraps Supabase Storage operations for better abstraction
 */
class ImageService {
    constructor(bucket = BUCKET) {
        this.bucket = bucket;
    }

    /**
     * Upload image to Supabase Storage
     * @param {string} imageData - Base64 encoded image (raw or data URI)
     * @param {string} folder - Storage path prefix
     * @returns {Promise<string>} Public image URL
     */
    async uploadImage(imageData, folder = 'attendance') {
        try {
            const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(imageData);
            const contentType = match ? match[1] : 'image/jpeg';
            const base64Data = match ? match[2] : imageData;
            const extension = contentType.split('/')[1] || 'jpg';

            const buffer = Buffer.from(base64Data, 'base64');
            const path = `${folder}/${crypto.randomUUID()}.${extension}`;

            const { error } = await adminClient.storage
                .from(this.bucket)
                .upload(path, buffer, { contentType, upsert: false });

            if (error) throw error;

            const { data } = adminClient.storage.from(this.bucket).getPublicUrl(path);
            return data.publicUrl;
        } catch (error) {
            console.error('Image upload error:', error);
            throw new Error('Failed to upload image');
        }
    }

    /**
     * Delete image from Supabase Storage
     * @param {string} path - Storage object path (as returned by extractStoragePath)
     * @returns {Promise<Object>}
     */
    async deleteImage(path) {
        try {
            const { error } = await adminClient.storage.from(this.bucket).remove([path]);
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Image deletion error:', error);
            throw new Error('Failed to delete image');
        }
    }

    /**
     * Extract the storage object path from a public Supabase Storage URL
     * @param {string} url
     * @returns {string|null}
     */
    extractStoragePath(url) {
        const marker = `/object/public/${this.bucket}/`;
        const idx = url.indexOf(marker);
        return idx === -1 ? null : url.slice(idx + marker.length);
    }
}

module.exports = ImageService;
