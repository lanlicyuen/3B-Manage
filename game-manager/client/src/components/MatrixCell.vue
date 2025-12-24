<template>
  <div class="matrix-cell" 
       :class="{ 'has-events': hasEvents }" 
       @click="handleClick"
       :title="tooltipText">
    <template v-if="hasEvents">
      <span v-if="eventCount <= 3" v-for="n in eventCount" :key="n" class="dot">●</span>
      <span v-else class="dot-many">●●● +{{ eventCount - 3 }}</span>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  events: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['click']);

const hasEvents = computed(() => props.events.length > 0);
const eventCount = computed(() => {
  // 去重事件（按event_id）
  const uniqueEventIds = new Set();
  props.events.forEach(e => {
    if (e.event_id) uniqueEventIds.add(e.event_id);
  });
  return uniqueEventIds.size;
});

// 生成tooltip文本
const tooltipText = computed(() => {
  if (!hasEvents.value) return '';
  
  // 获取唯一事件
  const uniqueEvents = [];
  const seenIds = new Set();
  
  props.events.forEach(event => {
    if (event.event_id && !seenIds.has(event.event_id)) {
      seenIds.add(event.event_id);
      uniqueEvents.push(event);
    }
  });
  
  return uniqueEvents.map(e => {
    let text = e.title || '';
    if (e.task) text += ` - ${e.task}`;
    return text;
  }).join('\n');
});

const handleClick = () => {
  if (hasEvents.value) {
    emit('click', props.events);
  }
};
</script>

<style scoped>
.matrix-cell {
  width: 40px;
  height: 40px;
  border: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
  flex-wrap: wrap;
  padding: 2px;
  position: relative;
}

.matrix-cell:hover {
  background-color: #f5f5f5;
}

.matrix-cell.has-events {
  background-color: #e3f2fd;
}

.matrix-cell.has-events:hover {
  background-color: #bbdefb;
}

.dot {
  font-size: 12px;
  color: #1976d2;
  line-height: 1;
  margin: 1px;
}

.dot-many {
  font-size: 9px;
  color: #1976d2;
  line-height: 1.2;
  text-align: center;
  font-weight: bold;
}
</style>
