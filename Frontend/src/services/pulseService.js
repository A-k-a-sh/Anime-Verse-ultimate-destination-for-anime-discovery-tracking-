import api from './api';

export const pulseService = {
  /**
   * Fetch all pulses with optional filters (sort, tag, mediaId, search, page, limit)
   */
  getAllPulses: async (params = {}) => {
    const response = await api.get('/pulses', { params });
    return response.data;
  },

  /**
   * Fetch single pulse by URL slug for public reader
   */
  getPulseBySlug: async (slug) => {
    const response = await api.get(`/pulses/${slug}`);
    return response.data;
  },

  /**
   * Fetch single pulse by MongoDB ID (used in edit studio)
   */
  getPulseById: async (id) => {
    const response = await api.get(`/pulses/id/${id}`);
    return response.data;
  },

  /**
   * Create a new Pulse
   */
  createPulse: async (pulseData) => {
    const response = await api.post('/pulses', pulseData);
    return response.data;
  },

  /**
   * Update an existing Pulse (Author only)
   */
  updatePulse: async (id, pulseData) => {
    const response = await api.put(`/pulses/${id}`, pulseData);
    return response.data;
  },

  /**
   * Delete a Pulse (Author or Admin)
   */
  deletePulse: async (id) => {
    const response = await api.delete(`/pulses/${id}`);
    return response.data;
  },

  /**
   * Lock/Unlock comments (Author or Admin)
   */
  toggleComments: async (id, commentsEnabled) => {
    const response = await api.patch(`/pulses/${id}/toggle-comments`, { commentsEnabled });
    return response.data;
  },

  /**
   * Vote up/down on a Pulse
   */
  votePulse: async (id, direction) => {
    const response = await api.post(`/pulses/${id}/vote`, { direction });
    return response.data;
  },

  /**
   * Upload an image buffer to Cloudinary
   */
  uploadPulseImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post('/pulses/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  /**
   * Fetch threaded comment discussion tree for a Pulse
   */
  getPulseComments: async (pulseId) => {
    const response = await api.get(`/pulses/${pulseId}/comments`);
    return response.data;
  },

  /**
   * Post a new comment or nested reply
   */
  createComment: async (pulseId, { content, parentId = null }) => {
    const response = await api.post(`/pulses/${pulseId}/comments`, { content, parentId });
    return response.data;
  },

  /**
   * Delete a comment (masks content if replies exist)
   */
  deleteComment: async (pulseId, commentId) => {
    const response = await api.delete(`/pulses/${pulseId}/comments/${commentId}`);
    return response.data;
  },

  /**
   * Vote on a comment
   */
  voteComment: async (pulseId, commentId, direction) => {
    const response = await api.post(`/pulses/${pulseId}/comments/${commentId}/vote`, { direction });
    return response.data;
  },

  /**
   * Cleanup discarded/uncommitted uploaded assets from Cloudinary
   */
  cleanupDiscardedAssets: async (publicIds) => {
    if (!Array.isArray(publicIds) || publicIds.length === 0) return { success: true };
    const response = await api.post('/pulses/cleanup-assets', { publicIds });
    return response.data;
  }
};

export default pulseService;
