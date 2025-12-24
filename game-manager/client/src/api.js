const API_BASE = '/api';

// 获取管理员 Token（用于权限验证）
function getAdminToken() {
  return localStorage.getItem('admin_token');
}

// 获取认证头（包含管理员权限验证）
function getAuthHeaders() {
  const adminToken = getAdminToken();
  const headers = { 'Content-Type': 'application/json' };
  
  // 添加管理员权限 Token（后端验证用）
  if (adminToken) {
    headers['Authorization'] = `Bearer ${adminToken}`;
    headers['X-Admin-Token'] = adminToken;
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
  
  // 获取单个事件详情
  async getEventDetail(id) {
    const res = await fetch(`${API_BASE}/events/${id}`);
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: '事件不存在' }));
      throw new Error(error.error || `HTTP ${res.status}: ${res.statusText}`);
    }
    return res.json();
  },
  
  // getEvent 别名（兼容旧代码）
  async getEvent(id) {
    return this.getEventDetail(id);
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
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: '导出失败' }));
      throw new Error(error.error || `HTTP ${res.status}`);
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `event_${id}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
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
  },

  async getTaskParticipation(from, to, taskName, memberIds) {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    if (taskName) params.append('taskName', taskName);
    if (memberIds && memberIds.length > 0) {
      params.append('memberIds', memberIds.join(','));
    }
    
    const token = localStorage.getItem('admin_token');
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const res = await fetch(`${API_BASE}/reports/task-participation?${params}`, { headers });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${res.status}`);
    }
    return res.json();
  },

  async getMemberParticipationSummary(from, to, memberIds) {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    if (memberIds && memberIds.length > 0) {
      params.append('memberIds', memberIds.join(','));
    }
    
    const token = localStorage.getItem('admin_token');
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const res = await fetch(`${API_BASE}/reports/member-participation-summary?${params}`, { headers });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${res.status}`);
    }
    return res.json();
  },

  async exportMemberSummaryCsv(from, to) {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    
    const token = localStorage.getItem('admin_token');
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      headers['X-Admin-Token'] = token;
    }
    
    const res = await fetch(`${API_BASE}/reports/export-member-summary-csv?${params}`, { headers });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: '导出失败' }));
      throw new Error(error.error || `Export failed: HTTP ${res.status}`);
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `member_summary_${from}_${to}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  },

  async exportTaskParticipationCsv(from, to, taskName) {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    if (taskName) params.append('taskName', taskName);
    
    const token = localStorage.getItem('admin_token');
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      headers['X-Admin-Token'] = token;
    }
    
    const res = await fetch(`${API_BASE}/reports/export-task-participation-csv?${params}`, { headers });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: '导出失败' }));
      throw new Error(error.error || `Export failed: HTTP ${res.status}`);
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `task_participation_${from}_${to}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  },

  // 任务定义相关
  async getTasks() {
    const res = await fetch(`${API_BASE}/tasks`);
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${res.status}`);
    }
    return res.json();
  },

  async getTaskCategories() {
    const res = await fetch(`${API_BASE}/tasks/categories`);
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${res.status}`);
    }
    return res.json();
  },

  async createTask(data) {
    const res = await fetch(`${API_BASE}/tasks`, {
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

  async updateTask(id, data) {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
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

  async deleteTask(id) {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${res.status}`);
    }
    return res.json();
  }
};

