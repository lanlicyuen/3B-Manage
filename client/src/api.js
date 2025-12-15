const API_BASE = '/api';

// 获取认证头
function getAuthHeaders() {
  const token = localStorage.getItem('admin_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // 管理员登录
  async adminLogin(password) {
    const res = await fetch(`${API_BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: '登录失败' }));
      throw new Error(error.error || '密码错误');
    }
    return res.json();
  },
  
  // 退出登录
  async adminLogout() {
    const res = await fetch(`${API_BASE}/admin/logout`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return res.json();
  },
  
  // 成员相关
  async getMembers(search = '') {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await fetch(`${API_BASE}/members${params}`);
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${res.status}`);
    }
    return res.json();
  },
  
  async createMember(data) {
    const res = await fetch(`${API_BASE}/members`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${res.status}`);
    }
    return res.json();
  },
  
  async updateMember(id, data) {
    const res = await fetch(`${API_BASE}/members/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${res.status}`);
    }
    return res.json();
  },
  
  async importMembersJson(members) {
    const res = await fetch(`${API_BASE}/members/import-json`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ members })
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${res.status}`);
    }
    return res.json();
  },
  
  async deleteMember(id) {
    const res = await fetch(`${API_BASE}/members/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${res.status}`);
    }
    return res.json();
  },
  
  // 事件相关
  async getEventsList(from, to, q) {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    if (q) params.append('q', q);
    
    const res = await fetch(`${API_BASE}/events?${params}`);
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${res.status}`);
    }
    return res.json();
  },
  
  async getEvents(from, to) {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    
    const res = await fetch(`${API_BASE}/events/range?${params}`);
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${res.status}`);
    }
    return res.json();
  },
  
  async getEventDetail(id) {
    const res = await fetch(`${API_BASE}/events/${id}`);
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${res.status}`);
    }
    return res.json();
  },
  
  async createEvent(data) {
    const res = await fetch(`${API_BASE}/events`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${res.status}`);
    }
    return res.json();
  },
  
  async updateEvent(id, data) {
    const res = await fetch(`${API_BASE}/events/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${res.status}`);
    }
    return res.json();
  },
  
  async exportEventTxt(id) {
    const res = await fetch(`${API_BASE}/events/${id}/export-txt`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `event_${id}.txt`;
    a.click();
  },
  
  async deleteEvent(id) {
    const res = await fetch(`${API_BASE}/events/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${res.status}`);
    }
    return res.json();
  },
  
  // 报表相关
  async exportCsv(from, to, titleLike, memberIds) {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    if (titleLike) params.append('titleLike', titleLike);
    if (memberIds && memberIds.length > 0) {
      params.append('memberIds', memberIds.join(','));
    }
    
    const token = localStorage.getItem('admin_token');
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const res = await fetch(`${API_BASE}/reports/export-csv?${params}`, {
      headers
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: '导出失败' }));
      throw new Error(error.error || `Export failed: HTTP ${res.status}`);
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'report.csv';
    a.click();
  },
  
  async getStats() {
    const res = await fetch(`${API_BASE}/reports/stats`);
    return res.json();
  }
};

