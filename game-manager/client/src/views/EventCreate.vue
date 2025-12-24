<template>
  <div class="event-create">
    <header>
      <h1>➕ 创建新事件</h1>
      <button @click="$router.push('/')">← 返回首页</button>
    </header>

    <div class="loading" v-if="loading">加载中...</div>

    <form @submit.prevent="createEvent" v-else>
      <div class="form-section">
        <h2>事件信息</h2>
        
        <div class="form-group">
          <label>日期 *</label>
          <input type="date" v-model="eventData.date" required>
        </div>

        <div class="form-group">
          <label>标题 *</label>
          <input v-model="eventData.title" required placeholder="例如：公会战、副本挑战">
        </div>

        <div class="form-group">
          <label>任务</label>
          <select v-model="eventData.task" class="task-select">
            <option value="">-- 请选择任务 --</option>
            <optgroup v-for="category in tasksByCategory" :key="category.name" :label="category.name">
              <option v-for="task in category.tasks" :key="task.id" :value="task.name">
                {{ task.name }}
              </option>
            </optgroup>
          </select>
          <div class="task-hint">💡 选择预定义的任务类型，便于后续统计分析</div>
        </div>

        <div class="form-group">
          <label>备注</label>
          <textarea v-model="eventData.remark" rows="3" placeholder="其他说明"></textarea>
        </div>
      </div>

      <div class="form-section">
        <h2>参与成员</h2>
        <div class="search-box">
          <input 
            v-model="searchQuery" 
            placeholder="🔍 搜索成员..." 
            @input="filterMembers"
          >
          <button type="button" @click="selectAll" class="select-all-btn">
            全选
          </button>
          <button type="button" @click="clearAll" class="clear-all-btn">
            清空
          </button>
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
              :checked="selectedMemberIds.includes(member.id)"
              @change="toggleMember(member.id)"
            >
            <span class="member-id">{{ String(member.id).padStart(3, '0') }}</span>
            <span class="member-name">{{ member.name }}</span>
          </label>
        </div>
        
        <div class="selected-list" v-if="selectedMemberIds.length > 0">
          <div class="selected-count-title">已选择 {{ selectedMemberIds.length }} 人（可拖拽调整顺序）</div>
          <draggable 
            v-model="selectedMemberIds" 
            item-key="id"
            class="selected-members"
            :animation="200"
            handle=".drag-handle"
          >
            <template #item="{element, index}">
              <div class="selected-member-item">
                <span class="drag-handle">☰</span>
                <span class="member-order">{{ index + 1 }}.</span>
                <span class="member-name-text">{{ getMemberName(element) }}</span>
              </div>
            </template>
          </draggable>
        </div>
        <div v-else class="empty-hint">
          尚未选择成员
        </div>
      </div>

      <div class="form-actions">
        <button type="submit" :disabled="submitting">
          {{ submitting ? '创建中...' : '创建事件' }}
        </button>
        <button type="button" @click="$router.push('/')" class="cancel-btn">
          取消
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../api';
import draggable from 'vuedraggable';

const router = useRouter();
const loading = ref(true);
const submitting = ref(false);
const members = ref([]);
const tasks = ref([]);
const searchQuery = ref('');

const eventData = ref({
  date: new Date().toISOString().split('T')[0],
  title: '',
  task: '',
  remark: ''
});

// 单一真相源：选中成员ID数组（顺序就是展示顺序）
const selectedMemberIds = ref([]);

// 按分类组织任务
const tasksByCategory = computed(() => {
  const categoryMap = new Map();
  
  tasks.value.forEach(task => {
    const category = task.category || '其他';
    if (!categoryMap.has(category)) {
      categoryMap.set(category, []);
    }
    categoryMap.get(category).push(task);
  });

  return Array.from(categoryMap.entries()).map(([name, tasks]) => ({
    name,
    tasks
  })).sort((a, b) => {
    // 按分类名排序
    const order = ['公会战', '副本', '活动', '日常', '其他'];
    const aIndex = order.indexOf(a.name);
    const bIndex = order.indexOf(b.name);
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return a.name.localeCompare(b.name);
  });
});

// 过滤成员（未选中的排在前面，已选中的排在后面）
const filteredMembers = computed(() => {
  let result = members.value;
  
  // 如果有搜索条件，先过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(m => 
      m.name.toLowerCase().includes(query) || 
      String(m.id).includes(query)
    );
  }
  
  // 排序：未选中的在前，已选中的在后
  return result.sort((a, b) => {
    const aSelected = selectedMemberIds.value.includes(a.id);
    const bSelected = selectedMemberIds.value.includes(b.id);
    
    if (aSelected === bSelected) {
      return 0; // 保持原有顺序
    }
    return aSelected ? 1 : -1; // 未选中的(-1)排在前面，已选中的(1)排在后面
  });
});

// 加载成员列表
const loadMembers = async () => {
  loading.value = true;
  try {
    members.value = await api.getMembers();
  } catch (error) {
    console.error('加载成员失败:', error);
    alert(`加载成员失败: ${error.message}`);
  } finally {
    loading.value = false;
  }
};

// 加载任务列表
const loadTasks = async () => {
  try {
    tasks.value = await api.getTasks();
  } catch (error) {
    console.error('加载任务失败:', error);
    // 任务加载失败不阻止页面显示
  }
};

// 切换成员勾选状态（追踪顺序）
const toggleMember = (memberId) => {
  const index = selectedMemberIds.value.indexOf(memberId);
  if (index === -1) {
    // 勾选：添加到数组末尾
    selectedMemberIds.value.push(memberId);
  } else {
    // 取消勾选：从数组中移除
    selectedMemberIds.value.splice(index, 1);
  }
};

// 获取成员姓名
const getMemberName = (memberId) => {
  const member = members.value.find(m => m.id === memberId);
  return member ? member.name : '';
};

// 全选（按当前过滤列表顺序添加）
const selectAll = () => {
  filteredMembers.value.forEach(member => {
    if (!selectedMemberIds.value.includes(member.id)) {
      selectedMemberIds.value.push(member.id);
    }
  });
};

// 清空
const clearAll = () => {
  selectedMemberIds.value = [];
};

// 创建事件
const createEvent = async () => {
  if (!eventData.value.title.trim()) {
    alert('请输入事件标题');
    return;
  }

  if (selectedMemberIds.value.length === 0) {
    if (!confirm('未选择任何参与成员，确定要创建吗？')) {
      return;
    }
  }

  submitting.value = true;
  try {
    const payload = {
      ...eventData.value,
      memberIds: selectedMemberIds.value // 按数组顺序传递
    };
    const result = await api.createEvent(payload);
    alert('事件创建成功！');
    router.push(`/events/${result.id}`);
  } catch (error) {
    console.error('创建事件失败:', error);
    alert('创建事件失败');
  } finally {
    submitting.value = false;
  }
};

onMounted(() => {
  loadMembers();
  loadTasks();
});
</script>

<style scoped>
.event-create {
  padding: 20px;
  max-width: 900px;
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

header button {
  padding: 10px 20px;
  background-color: #757575;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

header button:hover {
  background-color: #616161;
}

.loading {
  text-align: center;
  padding: 50px;
  color: #666;
}

form {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.form-section {
  padding: 25px;
  border-bottom: 1px solid #e0e0e0;
}

.form-section:last-of-type {
  border-bottom: none;
}

.form-section h2 {
  margin-top: 0;
  color: #333;
  font-size: 18px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  color: #666;
  font-weight: bold;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
}

.task-select {
  cursor: pointer;
}

.task-select option {
  padding: 5px;
}

.task-hint {
  margin-top: 5px;
  font-size: 12px;
  color: #666;
  font-style: italic;
}

.search-box {
  margin-bottom: 15px;
  display: flex;
  gap: 10px;
}

.search-box input {
  flex: 1;
  padding: 10px;
  border: 2px solid #1976d2;
  border-radius: 4px;
  font-size: 14px;
}

.select-all-btn,
.clear-all-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  white-space: nowrap;
}

.select-all-btn {
  background-color: #4caf50;
  color: white;
}

.select-all-btn:hover {
  background-color: #45a049;
}

.clear-all-btn {
  background-color: #ff9800;
  color: white;
}

.clear-all-btn:hover {
  background-color: #f57c00;
}

.members-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
  max-height: 400px;
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

.member-id {
  font-family: monospace;
  color: #666;
  font-weight: bold;
}

.member-name {
  color: #333;
}

.selected-list {
  margin-top: 15px;
}

.selected-count-title {
  padding: 10px;
  background-color: #e3f2fd;
  border-radius: 4px 4px 0 0;
  text-align: center;
  font-weight: bold;
  color: #1976d2;
}

.selected-members {
  padding: 15px;
  background-color: #f5f5f5;
  border-radius: 0 0 4px 4px;
  border-top: 1px solid #ddd;
  max-height: 300px;
  overflow-y: auto;
}

.selected-member-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  margin-bottom: 8px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  transition: all 0.2s;
}

.selected-member-item:hover {
  border-color: #1976d2;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.drag-handle {
  cursor: move;
  color: #999;
  font-size: 18px;
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
  color: #333;
  flex: 1;
}

.empty-hint {
  padding: 20px;
  text-align: center;
  color: #999;
  background-color: #f5f5f5;
  border-radius: 4px;
  margin-top: 15px;
}

.form-actions {
  padding: 25px;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.form-actions button {
  padding: 12px 30px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.form-actions button[type="submit"] {
  background-color: #4caf50;
  color: white;
}

.form-actions button[type="submit"]:hover {
  background-color: #45a049;
}

.form-actions button[type="submit"]:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.cancel-btn {
  background-color: #757575;
  color: white;
}

.cancel-btn:hover {
  background-color: #616161;
}

/* 拖拽时的样式 */
.selected-members .sortable-ghost {
  opacity: 0.4;
  background-color: #e3f2fd;
}

.selected-members .sortable-drag {
  opacity: 0.8;
}
</style>
