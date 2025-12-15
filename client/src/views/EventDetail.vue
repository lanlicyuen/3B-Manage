<template>
  <div class="event-detail">
    <header>
      <h1>📋 事件详情</h1>
      <div class="header-actions">
        <button v-if="!editing" @click="startEdit" class="edit-btn">✏️ 编辑</button>
        <button v-if="editing" @click="saveEdit" class="save-btn">💾 保存</button>
        <button v-if="editing" @click="cancelEdit" class="cancel-btn">❌ 取消</button>
        <button v-if="!editing" @click="exportTxt" class="export-btn">📥 导出 TXT</button>
        <button v-if="!editing" @click="deleteEvent" class="delete-btn">🗑️ 删除</button>
        <button @click="$router.push('/')">← 返回</button>
      </div>
    </header>

    <div class="loading" v-if="loading">加载中...</div>

    <div v-else-if="event" class="content">
      <!-- 编辑模式 -->
      <div v-if="editing" class="edit-card">
        <h2>编辑事件</h2>
        <form @submit.prevent="saveEdit">
          <div class="form-group">
            <label>日期 *</label>
            <input type="date" v-model="editData.date" required>
          </div>
          <div class="form-group">
            <label>标题 *</label>
            <input v-model="editData.title" required>
          </div>
          <div class="form-group">
            <label>任务</label>
            <input v-model="editData.task">
          </div>
          <div class="form-group">
            <label>备注</label>
            <textarea v-model="editData.remark" rows="3"></textarea>
          </div>
        </form>
        
        <h3>参与成员</h3>
        <div class="members-selector">
          <div class="search-box">
            <input 
              v-model="memberSearch" 
              placeholder="🔍 搜索成员..."
            >
          </div>
          <div class="members-grid">
            <label 
              v-for="member in filteredMembers" 
              :key="member.id" 
              class="member-checkbox"
            >
              <input 
                type="checkbox" 
                :value="member.id" 
                v-model="editData.memberIds"
              >
              <span class="member-id">{{ String(member.id).padStart(3, '0') }}</span>
              <span class="member-name">{{ member.name }}</span>
            </label>
          </div>
        </div>
      </div>
      
      <!-- 查看模式 -->
      <div v-else class="info-card">
        <h2>事件信息</h2>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">日期</span>
            <span class="value">{{ event.date }}</span>
          </div>
          <div class="info-item">
            <span class="label">标题</span>
            <span class="value">{{ event.title }}</span>
          </div>
          <div class="info-item">
            <span class="label">任务</span>
            <span class="value">{{ event.task || '-' }}</span>
          </div>
          <div class="info-item full-width">
            <span class="label">备注</span>
            <span class="value">{{ event.remark || '-' }}</span>
          </div>
        </div>
      </div>

      <div class="members-card">
        <h2>参与成员 ({{ event.members.length }})</h2>
        <div class="members-list">
          <div v-for="member in event.members" :key="member.id" class="member-item">
            <span class="member-id">{{ String(member.id).padStart(3, '0') }}</span>
            <span class="member-name">{{ member.name }}</span>
            <span v-if="member.note" class="member-note">{{ member.note }}</span>
          </div>
        </div>
      </div>

      <div class="preview-card">
        <h2>TXT 导出预览</h2>
        <pre class="txt-preview">{{ txtPreview }}</pre>
      </div>
    </div>

    <div v-else class="error">
      事件不存在或已被删除
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { api } from '../api';

const router = useRouter();
const route = useRoute();
const loading = ref(true);
const event = ref(null);
const editing = ref(false);
const allMembers = ref([]);
const memberSearch = ref('');
const editData = ref({
  date: '',
  title: '',
  task: '',
  remark: '',
  memberIds: []
});

// 过滤成员
const filteredMembers = computed(() => {
  if (!memberSearch.value) {
    return allMembers.value;
  }
  
  const query = memberSearch.value.toLowerCase();
  return allMembers.value.filter(m => 
    m.name.toLowerCase().includes(query) || 
    String(m.id).includes(query)
  );
});

// TXT 预览
const txtPreview = computed(() => {
  if (!event.value) return '';
  
  let txt = '[Event]\n';
  txt += `Date: ${event.value.date}\n`;
  txt += `Title: ${event.value.title}\n`;
  txt += `Task: ${event.value.task || ''}\n`;
  txt += `Remark: ${event.value.remark || ''}\n\n`;
  txt += '[Members]\n';
  
  event.value.members.forEach(m => {
    txt += `${String(m.id).padStart(3, '0')} ${m.name}`;
    if (m.note) txt += ` (${m.note})`;
    txt += '\n';
  });
  
  return txt;
});

// 加载事件详情
const loadEvent = async () => {
  loading.value = true;
  try {
    const eventId = route.params.id;
    event.value = await api.getEventDetail(eventId);
  } catch (error) {
    console.error('加载事件失败:', error);
    alert(`加载事件失败: ${error.message}`);
    event.value = null;
  } finally {
    loading.value = false;
  }
};

// 加载所有成员（用于编辑时选择）
const loadMembers = async () => {
  try {
    allMembers.value = await api.getMembers();
  } catch (error) {
    console.error('加载成员失败:', error);
  }
};

// 开始编辑
const startEdit = async () => {
  await loadMembers();
  
  editData.value = {
    date: event.value.date,
    title: event.value.title,
    task: event.value.task || '',
    remark: event.value.remark || '',
    memberIds: event.value.members.map(m => m.id)
  };
  
  editing.value = true;
};

// 保存编辑
const saveEdit = async () => {
  if (!editData.value.title.trim()) {
    alert('标题不能为空');
    return;
  }

  try {
    await api.updateEvent(route.params.id, editData.value);
    alert('保存成功！');
    editing.value = false;
    await loadEvent();
  } catch (error) {
    console.error('保存失败:', error);
    alert(`保存失败: ${error.message}`);
  }
};

// 取消编辑
const cancelEdit = () => {
  editing.value = false;
  memberSearch.value = '';
};

// 导出 TXT
const exportTxt = async () => {
  try {
    await api.exportEventTxt(route.params.id);
  } catch (error) {
    console.error('导出失败:', error);
    alert('导出失败');
  }
};

// 删除事件
const deleteEvent = async () => {
  if (!confirm('确定要删除此事件吗？此操作不可恢复！')) {
    return;
  }

  try {
    await api.deleteEvent(route.params.id);
    alert('事件已删除');
    router.push('/');
  } catch (error) {
    console.error('删除失败:', error);
    alert('删除失败');
  }
};

onMounted(() => {
  loadEvent();
});
</script>

<style scoped>
.event-detail {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

header h1 {
  margin: 0;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 10px;
}

header button {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: white;
}

.edit-btn {
  background-color: #2196f3;
}

.edit-btn:hover {
  background-color: #1976d2;
}

.save-btn {
  background-color: #4caf50;
}

.save-btn:hover {
  background-color: #45a049;
}

.cancel-btn {
  background-color: #9e9e9e;
}

.cancel-btn:hover {
  background-color: #757575;
}

.export-btn {
  background-color: #4caf50;
}

.export-btn:hover {
  background-color: #45a049;
}

.delete-btn {
  background-color: #f44336;
}

.delete-btn:hover {
  background-color: #d32f2f;
}

header button:last-child {
  background-color: #757575;
}

header button:last-child:hover {
  background-color: #616161;
}

.loading, .error {
  text-align: center;
  padding: 50px;
  color: #666;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.edit-card, .info-card, .members-card, .preview-card {
  background: white;
  padding: 25px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.edit-card .form-group {
  margin-bottom: 20px;
}

.edit-card label {
  display: block;
  margin-bottom: 5px;
  color: #666;
  font-weight: bold;
}

.edit-card input,
.edit-card textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
}

.edit-card h3 {
  margin-top: 20px;
  margin-bottom: 15px;
  color: #333;
}

.members-selector .search-box {
  margin-bottom: 15px;
}

.members-selector .search-box input {
  width: 100%;
  padding: 10px;
  border: 2px solid #1976d2;
  border-radius: 4px;
  font-size: 14px;
}

.members-selector .members-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
  max-height: 300px;
  overflow-y: auto;
  padding: 10px;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.member-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.member-checkbox:hover {
  background-color: #e3f2fd;
  border-color: #1976d2;
}

.member-checkbox input[type="checkbox"] {
  width: auto;
  cursor: pointer;
}

.info-card, .members-card, .preview-card {
  background: white;
  padding: 25px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

h2 {
  margin-top: 0;
  color: #333;
  font-size: 18px;
  border-bottom: 2px solid #1976d2;
  padding-bottom: 10px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-top: 20px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.info-item.full-width {
  grid-column: 1 / -1;
}

.label {
  color: #666;
  font-size: 14px;
  font-weight: bold;
}

.value {
  color: #333;
  font-size: 16px;
}

.members-list {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.member-id {
  font-family: monospace;
  font-weight: bold;
  color: #666;
}

.member-name {
  color: #333;
  font-weight: 500;
}

.member-note {
  color: #999;
  font-size: 14px;
  margin-left: auto;
}

.txt-preview {
  margin-top: 20px;
  padding: 20px;
  background-color: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-family: monospace;
  font-size: 14px;
  line-height: 1.6;
  overflow-x: auto;
  white-space: pre-wrap;
}
</style>
