/**
 * CIC Enugu 1995 Alumni Association Portal
 * REST API Client & LocalStorage Sync Adapter
 * Seamless bridge connecting static frontend with Node.js Express backend.
 */

(function (window) {
  'use strict';

  // Determine API base URL
  const DEFAULT_API_BASE = (function () {
    if (typeof window !== 'undefined' && window.location) {
      const origin = window.location.origin;
      // If served directly from Node.js backend port
      if (origin.includes(':5050')) {
        return `${origin}/api`;
      }
      // If running on local dev server or static file
      if (origin.includes('localhost') || origin.includes('127.0.0.1') || origin.startsWith('file:')) {
        return 'http://localhost:5050/api';
      }
      // Production relative path
      return `${origin}/api`;
    }
    return 'http://localhost:5050/api';
  })();

  const ApiClient = {
    baseUrl: DEFAULT_API_BASE,
    isOnline: false,

    /**
     * Set custom API Base URL
     */
    setBaseUrl(url) {
      this.baseUrl = url.replace(/\/$/, '');
    },

    /**
     * Check if Node.js backend is accessible
     */
    async ping() {
      try {
        const res = await fetch(`${this.baseUrl}/`, {
          method: 'GET',
          headers: { Accept: 'application/json' }
        });
        const data = await res.json();
        this.isOnline = Boolean(data && data.status === 'online');
        return this.isOnline;
      } catch (_) {
        this.isOnline = false;
        return false;
      }
    },

    /**
     * Standard Fetch Wrapper with Credentials (HttpOnly cookie support)
     */
    async request(endpoint, options = {}) {
      const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
      
      const headers = {
        Accept: 'application/json',
        ...(options.headers || {})
      };

      // Add Authorization header if client token exists in localStorage
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('cic_admin_token') : null;
      if (token && !headers.Authorization) {
        headers.Authorization = `Bearer ${token}`;
      }

      if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(options.body);
      }

      const fetchOptions = {
        credentials: 'include', // Important: passes HttpOnly cookies
        ...options,
        headers
      };

      try {
        const response = await fetch(url, fetchOptions);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || `Request failed with status ${response.status}`);
        }

        return data;
      } catch (err) {
        console.warn(`[ApiClient] Request to ${endpoint} failed:`, err.message);
        throw err;
      }
    },

    // -------------------------------------------------------------
    // AUTHENTICATION
    // -------------------------------------------------------------
    Auth: {
      async login(email, password, pin) {
        const res = await ApiClient.request('/auth/login', {
          method: 'POST',
          body: { email, password, pin }
        });
        // Securely store only sanitized user profile; token is kept in tamper-proof HttpOnly cookie
        if (res.user && typeof localStorage !== 'undefined') {
          localStorage.setItem('cic_admin_user', JSON.stringify(res.user));
        }
        return res;
      },

      async logout() {
        try {
          await ApiClient.request('/auth/logout', { method: 'POST' });
        } catch (_) {}
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('cic_admin_token');
          localStorage.removeItem('cic_admin_user');
        }
        return true;
      },

      async getMe() {
        return ApiClient.request('/auth/me');
      },

      async updatePassword(currentPassword, newPassword) {
        return ApiClient.request('/auth/update-password', {
          method: 'POST',
          body: { currentPassword, newPassword }
        });
      },

      async updatePin(newPin) {
        return ApiClient.request('/auth/update-pin', {
          method: 'POST',
          body: { newPin }
        });
      }
    },

    // -------------------------------------------------------------
    // ZERO-LOGIN PAYMENTS & RECEIPTS
    // -------------------------------------------------------------
    Payments: {
      async initialize(paymentData) {
        return ApiClient.request('/payments/initialize', {
          method: 'POST',
          body: paymentData
        });
      },

      async verify(reference) {
        return ApiClient.request(`/payments/verify/${encodeURIComponent(reference)}`, {
          method: 'POST'
        });
      },

      async verifyLookup(refOrReceipt) {
        return ApiClient.request(`/payments/verify-lookup/${encodeURIComponent(refOrReceipt)}`);
      },

      async getReceipt(reference) {
        return ApiClient.request(`/payments/receipt/${encodeURIComponent(reference)}`);
      },

      async recordManual(paymentData) {
        return ApiClient.request('/payments/manual', {
          method: 'POST',
          body: paymentData
        });
      },

      async getLedger(params = {}) {
        const query = new URLSearchParams(params).toString();
        return ApiClient.request(`/payments${query ? `?${query}` : ''}`);
      },

      getExportCsvUrl() {
        return `${ApiClient.baseUrl}/payments/export/csv`;
      }
    },

    // -------------------------------------------------------------
    // ALUMNI MEMBERS
    // -------------------------------------------------------------
    Members: {
      async getAll(params = {}) {
        const query = new URLSearchParams(params).toString();
        return ApiClient.request(`/members${query ? `?${query}` : ''}`);
      },

      async getById(id) {
        return ApiClient.request(`/members/${id}`);
      },

      async create(memberData) {
        return ApiClient.request('/members', {
          method: 'POST',
          body: memberData
        });
      },

      async update(id, memberData) {
        return ApiClient.request(`/members/${id}`, {
          method: 'PUT',
          body: memberData
        });
      },

      async delete(id) {
        return ApiClient.request(`/members/${id}`, {
          method: 'DELETE'
        });
      },

      getExportCsvUrl() {
        return `${ApiClient.baseUrl}/members/export/csv`;
      }
    },

    // -------------------------------------------------------------
    // CAPITAL PROJECTS
    // -------------------------------------------------------------
    Projects: {
      async getAll(params = {}) {
        const query = new URLSearchParams(params).toString();
        return ApiClient.request(`/projects${query ? `?${query}` : ''}`);
      },

      async getById(id) {
        return ApiClient.request(`/projects/${id}`);
      },

      async create(projectData) {
        return ApiClient.request('/projects', {
          method: 'POST',
          body: projectData
        });
      },

      async update(id, projectData) {
        return ApiClient.request(`/projects/${id}`, {
          method: 'PUT',
          body: projectData
        });
      },

      async allocateFunds(id, addedAmount, donorName) {
        return ApiClient.request(`/projects/${id}/allocate`, {
          method: 'POST',
          body: { addedAmount, donorName }
        });
      },

      async delete(id) {
        return ApiClient.request(`/projects/${id}`, {
          method: 'DELETE'
        });
      },

      async clearAll() {
        return ApiClient.request('/projects', {
          method: 'DELETE'
        });
      }
    },

    // -------------------------------------------------------------
    // LEADERSHIP COUNCIL
    // -------------------------------------------------------------
    Leadership: {
      async getAll() {
        return ApiClient.request('/leadership');
      },

      async create(leaderData) {
        return ApiClient.request('/leadership', {
          method: 'POST',
          body: leaderData
        });
      },

      async update(id, leaderData) {
        return ApiClient.request(`/leadership/${id}`, {
          method: 'PUT',
          body: leaderData
        });
      },

      async delete(id) {
        return ApiClient.request(`/leadership/${id}`, {
          method: 'DELETE'
        });
      },

      async reorder(items) {
        return ApiClient.request('/leadership/reorder', {
          method: 'PUT',
          body: { items }
        });
      }
    },

    // -------------------------------------------------------------
    // DUES CATEGORIES
    // -------------------------------------------------------------
    Categories: {
      async getAll() {
        return ApiClient.request('/categories');
      },

      async create(catData) {
        return ApiClient.request('/categories', {
          method: 'POST',
          body: catData
        });
      },

      async update(id, catData) {
        return ApiClient.request(`/categories/${id}`, {
          method: 'PUT',
          body: catData
        });
      },

      async delete(id) {
        return ApiClient.request(`/categories/${id}`, {
          method: 'DELETE'
        });
      },

      async getPayers(id) {
        return ApiClient.request(`/categories/${id}/payers`);
      }
    },

    // -------------------------------------------------------------
    // ASSOCIATION CONFIG
    // -------------------------------------------------------------
    Config: {
      async get() {
        return ApiClient.request('/config');
      },

      async update(configData) {
        return ApiClient.request('/config', {
          method: 'PUT',
          body: configData
        });
      }
    },

    // -------------------------------------------------------------
    // EXECUTIVE REPORTS & DASHBOARD
    // -------------------------------------------------------------
    Reports: {
      async getDashboard() {
        return ApiClient.request('/reports/dashboard');
      },

      async getMonthly() {
        return ApiClient.request('/reports/monthly');
      }
    },

    // -------------------------------------------------------------
    // FILE / IMAGE UPLOADS
    // -------------------------------------------------------------
    Upload: {
      async uploadBase64(base64DataUrl, folder = 'general') {
        return ApiClient.request('/upload', {
          method: 'POST',
          body: { base64: base64DataUrl, folder }
        });
      },

      async uploadFile(file, folder = 'general') {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder);
        return ApiClient.request('/upload', {
          method: 'POST',
          body: formData
        });
      }
    },

    // -------------------------------------------------------------
    // BIDIRECTIONAL SYNC ENGINE WITH LOCALSTORAGE
    // -------------------------------------------------------------
    async syncWithLocalStorage() {
      const isUp = await this.ping();
      if (!isUp) {
        console.log('ℹ️ Node.js backend offline. Running in zero-config offline mode with LocalStorage.');
        return false;
      }

      console.log('⚡ Node.js backend connected. Synchronizing LocalStorage cache with database...');

      try {
        // Sync Config
        const cfgRes = await this.Config.get().catch(() => null);
        if (cfgRes?.data && typeof window.DataStore?.saveConfig === 'function') {
          window.DataStore.saveConfig(cfgRes.data);
        }

        // Sync Categories
        const catRes = await this.Categories.getAll().catch(() => null);
        if (catRes?.data && typeof window.DataStore?.saveCategories === 'function') {
          window.DataStore.saveCategories(catRes.data);
        }

        // Sync Projects
        const prjRes = await this.Projects.getAll().catch(() => null);
        if (prjRes?.data && typeof window.DataStore?.saveProjects === 'function') {
          window.DataStore.saveProjects(prjRes.data);
        }

        // Sync Leadership
        const leadRes = await this.Leadership.getAll().catch(() => null);
        if (leadRes?.data && typeof window.DataStore?.saveLeadership === 'function') {
          window.DataStore.saveLeadership(leadRes.data);
        }

        // Sync Members
        const memRes = await this.Members.getAll({ all: 'true' }).catch(() => null);
        if (memRes?.data && typeof window.DataStore?.saveMembers === 'function') {
          window.DataStore.saveMembers(memRes.data);
        }

        // Sync Payments
        const payRes = await this.Payments.getLedger({ all: 'true' }).catch(() => null);
        if (payRes?.data && typeof window.DataStore?.savePayments === 'function') {
          window.DataStore.savePayments(payRes.data);
        }

        console.log('✅ Synchronization complete. LocalStorage updated with database records.');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('datastore:synced'));
        }
        return true;
      } catch (err) {
        console.warn('⚠️ Sync encountered error:', err.message);
        return false;
      }
    }
  };

  // Auto-run sync on startup when DOM is ready
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => ApiClient.syncWithLocalStorage());
    } else {
      setTimeout(() => ApiClient.syncWithLocalStorage(), 100);
    }
  }

  window.ApiClient = ApiClient;
})(typeof window !== 'undefined' ? window : globalThis);
