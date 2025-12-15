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
          <input v-model="eventData.task" placeholder="例如：分组推进、BOSS 挑战">
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
              :checked="eventData.memberIds.includes(member.id)"
              @change="toggleMember(member.id)"
            >
            <span class="member-id">{{ String(member.id).padStart(3, '0') }}</span>
            <span class="member-name">{{ member.name }}</span>
          </label>
        </div>
        
        <div class="selected-list">
          <div class="selected-count-title">已选择 {{ eventData.memberIds.length }} 人</div>
          <div class="selected-members" v-if="eventData.memberIds.length > 0">
            <span 
              v-for="(memberId, index) in selectedMembersOrder" 
              :key="memberId"
              class="selected-member-item"
            >
              {{ index + 1 }}. {{ String(memberId).padStart(3, '0') }} {{ getMemberName(memberId) }}
            </span>
          </div>
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

const router = useRouter();
const loading = ref(true);
const submitting = ref(false);
const members = ref([]);
const searchQuery = ref('');

const eventData = ref({
  date: new Date().toISOString().split('T')[0],
  title: '',
  task: '',
  remark: '',
  memberIds: []
});

// 按勾选顺序记录的成员ID数组
const selectedMembersOrder = ref([]);

// 过滤成员
const filteredMembers = computed(() => {
  if (!searchQuery.value) {
    return members.value;
  }
  
  const query = searchQuery.value.toLowerCase();
  return members.value.filter(m => 
    m.name.toLowerCase().includes(query) || 
    String(m.id).includes(query)
  );
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

// 切换成员勾选状态（追踪顺序）
const toggleMember = (memberId) => {
  const index = eventData.value.memberIds.indexOf(memberId);
  if (index === -1) {
    // 勾选：添加到数组
    eventData.value.memberIds.push(memberId);
    selectedMembersOrder.value.push(memberId);
  } else {
    // 取消勾选：从两个数组中移除
    eventData.value.memberIds.splice(index, 1);
    const orderIndex = selectedMembersOrder.value.indexOf(memberId);
    if (orderIndex !== -1) {
      selectedMembersOrder.value.splice(orderIndex, 1);
    }
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
    if (!eventData.value.memberIds.includes(member.id)) {
      eventData.value.memberIds.push(member.id);
      selectedMembersOrder.value.push(member.id);
    }
  });
};

// 清空
const clearAll = () => {
  eventData.value.memberIds = [];
  selectedMembersOrder.value = [];
};

// 创建事件
const createEvent = async () => {
  if (!eventData.value.title.trim()) {
    alert('请输入事件标题');
    return;
  }

  if (eventData.value.memberIds.length === 0) {
    if (!confirm('未选择任何参与成员，确定要创建吗？')) {
      return;
    }
  }

  submitting.value = true;
  try {
    const result = await api.createEvent(eventData.value);
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
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
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
  max-height: 200px;
  overflow-y: auto;
}

.selected-member-item {
  display: inline-block;
  margin-right: 15px;
  margin-bottom: 8px;
  color: #333;
  font-size: 14px;
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
</style>
