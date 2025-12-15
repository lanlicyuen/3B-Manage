<template>
  <div class="members-view">
    <header>
      <h1>👥 成员管理</h1>
      <button @click="$router.push('/')">← 返回首页</button>
    </header>

    <div class="add-member">
      <h2>添加新成员</h2>
      <form @submit.prevent="addMember">
        <div class="form-group">
          <label>姓名 *</label>
          <input v-model="newMember.name" required placeholder="请输入成员姓名">
        </div>
        <div class="form-group">
          <label>备注</label>
          <input v-model="newMember.remark" placeholder="可选备注信息">
        </div>
        <button type="submit">添加成员</button>
      </form>
    </div>

    <div class="import-json">
      <h2>📥 JSON批量导入</h2>
      <div class="import-help">
        <p>格式示例：</p>
        <code>[{"name":"小明","remark":"主号"}, {"id":1,"name":"小明","remark":"更新"}]</code>
        <p>有id则更新，无id则新增</p>
      </div>
      <textarea 
        v-model="jsonInput" 
        rows="4" 
        placeholder='粘贴JSON数据，例如：[{"name":"小明","remark":"主号"}]'
      ></textarea>
      <button @click="importJson" :disabled="importing">
        {{ importing ? '导入中...' : '导入' }}
      </button>
      <div v-if="importResult" class="import-result">
        <p>✅ 新增: {{ importResult.inserted }}</p>
        <p>🔄 更新: {{ importResult.updated }}</p>
        <p v-if="importResult.failed > 0" class="error">❌ 失败: {{ importResult.failed }}</p>
        <ul v-if="importResult.errors && importResult.errors.length > 0">
          <li v-for="(err, idx) in importResult.errors" :key="idx">{{ err }}</li>
        </ul>
      </div>
    </div>

    <div class="members-list">
      <div class="list-header">
        <h2>成员列表 ({{ members.length }})</h2>
        <div class="search-box">
          <input 
            v-model="searchQuery" 
            @input="searchMembers"
            placeholder="🔍 搜索ID或姓名..."
          >
        </div>
      </div>
      <div class="loading" v-if="loading">加载中...</div>
      <div v-else-if="members.length === 0" class="empty">
        暂无成员，请先添加
      </div>
      <table v-else>
        <thead>
          <tr>
            <th>ID</th>
            <th>姓名</th>
            <th>备注</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="member in members" :key="member.id">
            <td>{{ String(member.id).padStart(3, '0') }}</td>
            <td>
              <input 
                v-if="editingId === member.id"
                v-model="editData.name"
                class="edit-input"
                @keyup.enter="saveMember"
                @keyup.esc="cancelEdit"
              >
              <strong v-else>{{ member.name }}</strong>
            </td>
            <td>
              <input 
                v-if="editingId === member.id"
                v-model="editData.remark"
                class="edit-input"
                @keyup.enter="saveMember"
                @keyup.esc="cancelEdit"
              >
              <span v-else>{{ member.remark || '-' }}</span>
            </td>
            <td>{{ formatDate(member.created_at) }}</td>
            <td class="actions">
              <template v-if="editingId === member.id">
                <button class="save-btn" @click="saveMember" :disabled="saving">
                  {{ saving ? '保存中...' : '保存' }}
                </button>
                <button class="cancel-btn" @click="cancelEdit" :disabled="saving">
                  取消
                </button>
              </template>
              <template v-else>
                <button class="edit-btn" @click="startEdit(member)">
                  编辑
                </button>
                <button 
                  class="delete-btn" 
                  @click="deleteMember(member.id)"
                  :disabled="deleting"
                >
                  删除
                </button>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { api } from '../api';

const loading = ref(true);
const deleting = ref(false);
const importing = ref(false);
const saving = ref(false);
const members = ref([]);
const searchQuery = ref('');
const jsonInput = ref('');
const importResult = ref(null);
const editingId = ref(null);
const editData = ref({ name: '', remark: '' });
const newMember = ref({
  name: '',
  remark: ''
});

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN');
};

// 加载成员列表
const loadMembers = async (search = '') => {
  loading.value = true;
  try {
    members.value = await api.getMembers(search);
  } catch (error) {
    console.error('加载成员失败:', error);
    alert(`加载成员失败: ${error.message}`);
  } finally {
    loading.value = false;
  }
};

// 搜索成员
const searchMembers = () => {
  loadMembers(searchQuery.value);
};

// 添加成员
const addMember = async () => {
  if (!newMember.value.name.trim()) {
    alert('请输入成员姓名');
    return;
  }

  try {
    await api.createMember(newMember.value);
    alert('成员添加成功！');
    newMember.value = { name: '', remark: '' };
    await loadMembers(searchQuery.value);
  } catch (error) {
    console.error('添加成员失败:', error);
    alert(`添加成员失败: ${error.message}`);
  }
};

// JSON批量导入
const importJson = async () => {
  if (!jsonInput.value.trim()) {
    alert('请输入JSON数据');
    return;
  }

  try {
    const data = JSON.parse(jsonInput.value);
    if (!Array.isArray(data)) {
      throw new Error('JSON必须是数组格式');
    }

    importing.value = true;
    importResult.value = null;
    
    const result = await api.importMembersJson(data);
    importResult.value = result;
    
    if (result.inserted > 0 || result.updated > 0) {
      await loadMembers(searchQuery.value);
      if (result.failed === 0) {
        jsonInput.value = '';
      }
    }
  } catch (error) {
    console.error('导入失败:', error);
    alert(`导入失败: ${error.message}`);
  } finally {
    importing.value = false;
  }
};

// 开始编辑
const startEdit = (member) => {
  editingId.value = member.id;
  editData.value = {
    name: member.name,
    remark: member.remark || ''
  };
};

// 保存编辑
const saveMember = async () => {
  if (!editData.value.name.trim()) {
    alert('姓名不能为空');
    return;
  }

  saving.value = true;
  try {
    await api.updateMember(editingId.value, editData.value);
    alert('保存成功！');
    editingId.value = null;
    await loadMembers(searchQuery.value);
  } catch (error) {
    console.error('保存失败:', error);
    alert(`保存失败: ${error.message}`);
  } finally {
    saving.value = false;
  }
};

// 取消编辑
const cancelEdit = () => {
  editingId.value = null;
  editData.value = { name: '', remark: '' };
};

// 删除成员
const deleteMember = async (id) => {
  if (!confirm('确定要删除该成员吗？此操作不可恢复！')) {
    return;
  }

  deleting.value = true;
  try {
    await api.deleteMember(id);
    alert('成员已删除');
    await loadMembers(searchQuery.value);
  } catch (error) {
    console.error('删除成员失败:', error);
    alert(`删除成员失败: ${error.message}`);
  } finally {
    deleting.value = false;
  }
};

onMounted(() => {
  loadMembers();
});
</script>

<style scoped>
.members-view {
  padding: 20px;
  max-width: 1200px;
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

.add-member {
  background: white;
  padding: 25px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 30px;
}

.add-member h2 {
  margin-top: 0;
  color: #333;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  color: #666;
  font-weight: bold;
}

.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.add-member button[type="submit"] {
  padding: 10px 30px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.add-member button[type="submit"]:hover {
  background-color: #45a049;
}

.import-json {
  background: white;
  padding: 25px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 30px;
}

.import-json h2 {
  margin-top: 0;
  color: #333;
}

.import-help {
  background-color: #e3f2fd;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 15px;
}

.import-help p {
  margin: 5px 0;
  color: #1976d2;
}

.import-help code {
  display: block;
  background-color: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
  overflow-x: auto;
  margin: 10px 0;
}

.import-json textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: monospace;
  font-size: 13px;
  resize: vertical;
  margin-bottom: 10px;
}

.import-json button {
  padding: 10px 30px;
  background-color: #ff9800;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.import-json button:hover {
  background-color: #f57c00;
}

.import-json button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.import-result {
  margin-top: 15px;
  padding: 15px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.import-result p {
  margin: 5px 0;
  font-weight: bold;
}

.import-result .error {
  color: #f44336;
}

.import-result ul {
  margin: 10px 0 0 20px;
  color: #f44336;
}

.members-list {
  background: white;
  padding: 25px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.list-header h2 {
  margin: 0;
  color: #333;
}

.search-box {
  flex: 0 0 300px;
}

.search-box input {
  width: 100%;
  padding: 10px;
  border: 2px solid #1976d2;
  border-radius: 4px;
  font-size: 14px;
}

.members-list h2 {
  margin-top: 0;
  color: #333;
}

.loading, .empty {
  text-align: center;
  padding: 30px;
  color: #666;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

th {
  background-color: #f5f5f5;
  font-weight: bold;
  color: #333;
}

tr:hover {
  background-color: #f9f9f9;
}

tr:hover {
  background-color: #f9f9f9;
}

table button {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  margin-right: 5px;
}

.edit-btn {
  background-color: #2196f3;
  color: white;
}

.edit-btn:hover {
  background-color: #1976d2;
}

.save-btn {
  background-color: #4caf50;
  color: white;
}

.save-btn:hover:not(:disabled) {
  background-color: #45a049;
}

.cancel-btn {
  background-color: #ff9800;
  color: white;
}

.cancel-btn:hover:not(:disabled) {
  background-color: #f57c00;
}

.delete-btn {
  background-color: #f44336;
  color: white;
}

.delete-btn:hover {
  background-color: #d32f2f;
}

table button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.edit-input {
  width: 100%;
  padding: 4px 8px;
  border: 2px solid #2196f3;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.edit-input:focus {
  outline: none;
  border-color: #1976d2;
}

td.actions {
  white-space: nowrap;
}
</style>
