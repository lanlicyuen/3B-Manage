<template>
  <div class="event-detail">
    <header>
      <h1>事件详情</h1>
      <div class="header-actions">
        <!-- 管理员功能按钮（需要权限） -->
        <button v-if="!editing && isAdmin" @click="startEdit" class="edit-btn">编辑</button>
        <button v-if="editing" @click="saveEdit" class="save-btn">保存</button>
        <button v-if="editing" @click="cancelEdit" class="cancel-btn">取消</button>
        <button v-if="!editing && isAdmin" @click="exportTxt" class="export-btn">导出TXT</button>
        <button v-if="!editing && isAdmin" @click="deleteEvent" class="delete-btn">删除</button>
        <button @click="$router.push('/')">返回</button>
      </div>
    </header>

    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="event" class="content">
      <!-- 编辑模式 -->
      <div v-if="editing" class="edit-card">
        <div class="form-group">
          <label>日期 *</label>
          <input type="date" v-model="editData.date" required>
        </div>

        <div class="form-group">
          <label>标题 *</label>
          <input v-model="editData.title" type="text" placeholder="输入事件标题" required />
        </div>

        <div class="form-group">
          <label>任务</label>
          <input v-model="editData.task" type="text" placeholder="例如：公会战、副本挑战">
        </div>

        <div class="form-group">
          <label>备注</label>
          <textarea v-model="editData.remark" rows="3" placeholder="其他说明"></textarea>
        </div>

        <h3>参与成员</h3>
        <div class="members-selector">
          <div class="search-box">
            <input
              v-model="memberSearch"
              type="text"
              placeholder="搜索成员..."
            />
          </div>

          <!-- 已选成员 - 拖拽排序 -->
          <div class="selected-members-section">
            <div class="section-header">
              <h4>已选成员（{{ selectedMemberIds.length }}人）</h4>
              <div class="bulk-actions">
                <button @click="selectAll" class="action-btn">全选</button>
                <button @click="clearAll" class="action-btn">清空</button>
              </div>
            </div>
            
            <div v-if="selectedMemberIds.length === 0" class="empty-message">
              请从下方选择成员
            </div>
            
            <draggable
              v-else
              v-model="selectedMemberIds"
              item-key="id"
              class="selected-members-list"
              :animation="200"
              handle=".drag-handle"
            >
              <template #item="{element, index}">
                <div class="selected-member-item">
                  <span class="drag-handle">☰</span>
                  <span class="member-order">{{ index + 1 }}.</span>
                  <span class="member-name-text">{{ getMemberName(element) }}</span>
                  <button @click="toggleMember(element)" class="remove-btn">×</button>
                </div>
              </template>
            </draggable>
          </div>

          <!-- 可选成员列表 -->
          <div class="members-grid">
            <label
              v-for="member in filteredMembers"
              :key="member.id"
              class="member-checkbox"
            >
              <input
                type="checkbox"
                :checked="selectedMemberIds.includes(member.id)"
                @change="toggleMember(member.id)"
              />
              <span>{{ member.name }}</span>
            </label>
          </div>
        </div>
      </div>

      <!-- 查看模式 -->
      <template v-else>
        <div class="info-card">
          <h2>基本信息</h2>
          <div class="info-grid">
            <div class="info-item full-width">
              <span class="label">标题</span>
              <span class="value">{{ event.title }}</span>
            </div>
            <div class="info-item">
              <span class="label">日期</span>
              <span class="value">{{ formatDate(event.date) }}</span>
            </div>
            <div class="info-item">
              <span class="label">任务</span>
              <span class="value">{{ event.task || '无' }}</span>
            </div>
            <div class="info-item full-width">
              <span class="label">备注</span>
              <span class="value">{{ event.remark || '无' }}</span>
            </div>
          </div>
        </div>

        <div class="members-card">
          <h2>参与成员 ({{ event.members.length }}人)</h2>
          <div class="members-list">
            <div v-for="(member, index) in event.members" :key="member.id" class="member-item">
              <span class="member-order">{{ index + 1 }}.</span>
              <span class="member-name">{{ member.name }}</span>
              <span v-if="member.note" class="member-note">{{ member.note }}</span>
            </div>
          </div>
        </div>

        <div class="preview-card">
          <h2>导出预览</h2>
          <div class="txt-preview">{{ txtPreview }}</div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import draggable from 'vuedraggable';
import { api } from '../api';
import { isAdmin as checkAdmin, requireAuth } from '../utils/auth';

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const error = ref(null);
const event = ref(null);
const editing = ref(false);
const memberSearch = ref('');
const members = ref([]);
const selectedMemberIds = ref([]);
const isAdmin = ref(false);

const editData = ref({
  date: '',
  title: '',
  task: '',
  remark: '',
  memberIds: []
});

// 格式化日期（显示用）
const formatDate = (dateStr) => {
  if (!dateStr) return '未指定';
  return dateStr;
};

// 格式化日期时间
const formatDateTime = (dateTime) => {
  if (!dateTime) return '未指定';
  const date = new Date(dateTime);
  return date.toLocaleString('zh-CN');
};

// 加载事件详情
const loadEvent = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const data = await api.getEvent(route.params.id);
    event.value = data;
  } catch (err) {
    console.error('加载事件失败:', err);
    error.value = `加载事件失败: ${err.message}`;
  } finally {
    loading.value = false;
  }
};

// 加载所有成员
const loadMembers = async () => {
  try {
    const data = await api.getMembers();
    members.value = data;
  } catch (err) {
    console.error('加载成员列表失败:', err);
    alert('加载成员列表失败');
  }
};

// 过滤成员列表
const filteredMembers = computed(() => {
  const search = memberSearch.value.toLowerCase();
  if (!search) return members.value;
  return members.value.filter(member =>
    member.name.toLowerCase().includes(search)
  );
});

// 获取成员名字
const getMemberName = (memberId) => {
  const member = members.value.find(m => m.id === memberId);
  return member ? member.name : `成员 ${memberId}`;
};

// 切换成员选择
const toggleMember = (memberId) => {
  const index = selectedMemberIds.value.indexOf(memberId);
  if (index > -1) {
    selectedMemberIds.value.splice(index, 1);
  } else {
    selectedMemberIds.value.push(memberId);
  }
};

// 全选
const selectAll = () => {
  const allIds = members.value.map(m => m.id);
  const newIds = allIds.filter(id => !selectedMemberIds.value.includes(id));
  selectedMemberIds.value.push(...newIds);
};

// 清空
const clearAll = () => {
  selectedMemberIds.value = [];
};

// TXT 预览
const txtPreview = computed(() => {
  if (!event.value) return '';
  
  let text = `事件：${event.value.title}\n`;
  text += `日期：${event.value.date || '未填写'}\n`;
  if (event.value.task) {
    text += `任务：${event.value.task}\n`;
  }
  if (event.value.remark) {
    text += `备注：${event.value.remark}\n`;
  }
  text += '\n参与成员：\n';
  event.value.members.forEach((member, index) => {
    text += `${index + 1}. ${member.name}`;
    if (member.note) {
      text += ` (${member.note})`;
    }
    text += '\n';
  });
  
  return text;
});

// 开始编辑（需要权限保护）
const startEdit = requireAuth(async () => {
  if (!checkAdmin()) {
    return; // requireAuth 已处理提示
  }
  
  await loadMembers();
  
  editData.value = {
    date: event.value.date || '',
    title: event.value.title,
    task: event.value.task || '',
    remark: event.value.remark || '',
  };
  
  // 保持原有顺序
  selectedMemberIds.value = event.value.members.map(m => m.id);
  
  editing.value = true;
});

// 保存编辑
const saveEdit = async () => {
  if (!editData.value.title.trim()) {
    alert('标题不能为空');
    return;
  }
  
  if (!editData.value.date) {
    alert('日期不能为空');
    return;
  }

  try {
    // 传递有序的成员ID数组
    const payload = {
      date: editData.value.date,
      title: editData.value.title.trim(),
      task: editData.value.task || '',
      remark: editData.value.remark || '',
      memberIds: selectedMemberIds.value
    };
    
    await api.updateEvent(route.params.id, payload);
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
  selectedMemberIds.value = [];
};

// 导出 TXT（需要权限保护）
const exportTxt = requireAuth(async () => {
  if (!checkAdmin()) {
    return;
  }
  
  try {
    await api.exportEventTxt(route.params.id);
  } catch (error) {
    console.error('导出失败:', error);
    alert(`导出失败: ${error.message}`);
  }
});

// 删除事件
const deleteEvent = requireAuth(async () => {
  if (!checkAdmin()) {
    return;
  }
  
  if (!confirm('确定要删除此事件吗？此操作不可恢复！')) {
    return;
  }

  try {
    await api.deleteEvent(route.params.id);
    alert('事件已删除');
    router.push('/');
  } catch (error) {
    console.error('删除失败:', error);
    alert('删除失败：' + error.message);
  }
});

onMounted(() => {
  isAdmin.value = checkAdmin();
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

/* 已选成员区域样式 */
.selected-members-section {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f0f7ff;
  border: 2px dashed #1976d2;
  border-radius: 8px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.section-header h4 {
  margin: 0;
  color: #1976d2;
  font-size: 16px;
}

.bulk-actions {
  display: flex;
  gap: 10px;
}

.action-btn {
  padding: 5px 15px;
  border: 1px solid #1976d2;
  background-color: white;
  color: #1976d2;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.action-btn:hover {
  background-color: #1976d2;
  color: white;
}

.empty-message {
  text-align: center;
  color: #999;
  padding: 30px;
  font-style: italic;
}

.selected-members-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.selected-member-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 15px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  transition: all 0.2s;
}

.selected-member-item:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.drag-handle {
  cursor: move;
  color: #999;
  font-size: 18px;
  padding: 0 5px;
  user-select: none;
}

.drag-handle:hover {
  color: #1976d2;
}

.member-order {
  font-weight: bold;
  color: #1976d2;
  min-width: 30px;
}

.member-name-text {
  flex: 1;
  color: #333;
  font-size: 14px;
}

.remove-btn {
  width: 24px;
  height: 24px;
  border: none;
  background-color: #f44336;
  color: white;
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.remove-btn:hover {
  background-color: #d32f2f;
  transform: scale(1.1);
}

/* 拖拽动画 */
.sortable-ghost {
  opacity: 0.4;
  background-color: #e3f2fd;
}

.sortable-drag {
  opacity: 0.8;
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

.member-item .member-order {
  font-weight: bold;
  color: #1976d2;
  min-width: 30px;
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
