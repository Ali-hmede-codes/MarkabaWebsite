import { APIResponse } from '../../components/API/types';

// Ad Types
export interface Ad {
  id: number;
  title: string;
  description?: string;
  image_path?: string;
  url: string;
  position: string;
  width: number;
  height: number;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  clicks: number;
  impressions: number;
  created_at: string;
  updated_at: string;
  position_display_name?: string;
  created_by_username?: string;
  status?: 'active' | 'inactive' | 'expired';
}

export interface AdPosition {
  id: number;
  position_name: string;
  display_name: string;
  width: number;
  height: number;
  max_ads: number;
  description?: string;
  current_ads?: number;
  active_ads?: number;
}

export interface AdFormData {
  title: string;
  description?: string;
  url: string;
  position: string;
  end_date: string;
  is_active: boolean;
  image?: File | null;
}

export interface AdFilters {
  page?: number;
  limit?: number;
  position?: string;
  status?: 'active' | 'inactive' | 'expired';
}

export interface AdsPaginationResponse {
  current_page: number;
  per_page: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface AdsResponse extends APIResponse<Ad[]> {
  pagination?: AdsPaginationResponse;
}

export type AdPositionsResponse = APIResponse<AdPosition[]>;
export type SingleAdResponse = APIResponse<Ad>;

// API Configuration - Following the same pattern as breaking-news.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
const API_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;
const getAuthHeaders = (token: string) => ({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
});

const getFormDataHeaders = (token: string) => ({
  'Authorization': `Bearer ${token}`,
  // Don't set Content-Type for FormData, let browser set it with boundary
});

// Ads API Service
export class AdsApiService {
  private baseUrl: string;
  private apiUrl: string;

  constructor() {
    // Use the same pattern as breaking-news.ts
    this.baseUrl = `${API_SITE_URL}/admin/administratorpage/ads`;
    // API URL for backend requests
    this.apiUrl = `${API_BASE_URL}/admin/ads`;
  }

  /**
   * Get all ads with optional filtering and pagination
   */
  async getAds(token: string, filters: AdFilters = {}): Promise<AdsResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.page) queryParams.append('page', filters.page.toString());
      if (filters.limit) queryParams.append('limit', filters.limit.toString());
      if (filters.position) queryParams.append('position', filters.position);
      if (filters.status) queryParams.append('status', filters.status);

      const url = `${this.apiUrl}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(token),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching ads:', error);
      throw error;
    }
  }

  /**
   * Get available ad positions
   */
  async getAdPositions(token: string): Promise<AdPositionsResponse> {
    try {
      const response = await fetch(`${this.apiUrl}/positions`, {
        method: 'GET',
        headers: getAuthHeaders(token),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching ad positions:', error);
      throw error;
    }
  }

  /**
   * Get a single ad by ID
   */
  async getAd(token: string, id: number): Promise<SingleAdResponse> {
    try {
      const response = await fetch(`${this.apiUrl}/${id}`, {
        method: 'GET',
        headers: getAuthHeaders(token),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching ad:', error);
      throw error;
    }
  }

  /**
   * Create a new ad
   */
  async createAd(token: string, adData: AdFormData): Promise<SingleAdResponse> {
    try {
      const formData = new FormData();
      
      formData.append('title', adData.title);
      if (adData.description) {
        formData.append('description', adData.description);
      }
      formData.append('url', adData.url);
      formData.append('position', adData.position);
      formData.append('end_date', adData.end_date);
      formData.append('is_active', adData.is_active.toString());
      
      if (adData.image) {
        formData.append('image', adData.image);
      }

      const response = await fetch(`${this.apiUrl}`, {
        method: 'POST',
        headers: getFormDataHeaders(token),
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error creating ad:', error);
      throw error;
    }
  }

  /**
   * Update an existing ad
   */
  async updateAd(token: string, id: number, adData: Partial<AdFormData>, currentImagePath?: string): Promise<SingleAdResponse> {
    try {
      const formData = new FormData();
      
      if (adData.title !== undefined) {
        formData.append('title', adData.title);
      }
      if (adData.description !== undefined) {
        formData.append('description', adData.description);
      }
      if (adData.url !== undefined) {
        formData.append('url', adData.url);
      }
      if (adData.position !== undefined) {
        formData.append('position', adData.position);
      }
      if (adData.end_date !== undefined) {
        formData.append('end_date', adData.end_date);
      }
      if (adData.is_active !== undefined) {
        formData.append('is_active', adData.is_active.toString());
      }
      
      if (adData.image) {
        formData.append('image', adData.image);
      }
      
      if (currentImagePath) {
        formData.append('current_image', currentImagePath);
      }

      const response = await fetch(`${this.apiUrl}/${id}`, {
        method: 'PUT',
        headers: getFormDataHeaders(token),
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error updating ad:', error);
      throw error;
    }
  }

  /**
   * Delete an ad
   */
  async deleteAd(token: string, id: number): Promise<APIResponse> {
    try {
      const response = await fetch(`${this.apiUrl}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(token),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error deleting ad:', error);
      throw error;
    }
  }

  /**
   * Toggle ad active status
   */
  async toggleAdStatus(token: string, id: number, isActive: boolean): Promise<SingleAdResponse> {
    try {
      // First get the current ad to know its current status if isActive is not provided
      const currentAd = await this.getAd(token, id);
      if (!currentAd.data) {
        throw new Error('Ad not found');
      }
      const newStatus = isActive !== undefined ? isActive : !currentAd.data.is_active;
      
      return await this.updateAd(token, id, { is_active: newStatus });
    } catch (error) {
      console.error('Error toggling ad status:', error);
      throw error;
    }
  }

  /**
   * Get ad analytics/statistics
   */
  async getAdAnalytics(token: string, id?: number): Promise<APIResponse> {
    try {
      const url = id 
        ? `${this.apiUrl}/${id}/stats`
        : `${this.apiUrl}/stats/overview`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(token),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching ad analytics:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const adsApi = new AdsApiService();

// Export default
export default adsApi;