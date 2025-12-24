import { createRouter, createWebHistory } from 'vue-router';
import MatrixView from './views/MatrixView.vue';
import MembersView from './views/MembersView.vue';
import EventCreate from './views/EventCreate.vue';
import EventDetail from './views/EventDetail.vue';
import EventsListView from './views/EventsListView.vue';
import ReportView from './views/ReportView.vue';
import TaskManageView from './views/TaskManageView.vue';

// 需要登录的路由
const authRequiredRoutes = ['/members', '/events/create', '/events', '/reports', '/tasks'];

const routes = [
  {
    path: '/',
    name: 'Matrix',
    component: MatrixView
  },
  {
    path: '/members',
    name: 'Members',
    component: MembersView,
    meta: { requiresAuth: true }
  },
  {
    path: '/events',
    name: 'EventsList',
    component: EventsListView
  },
  {
    path: '/events/create',
    name: 'EventCreate',
    component: EventCreate,
    meta: { requiresAuth: true }
  },
  {
    path: '/events/:id',
    name: 'EventDetail',
    component: EventDetail
  },
  {
    path: '/reports',
    name: 'Reports',
    component: ReportView,
    meta: { requiresAuth: true }
  },
  {
    path: '/tasks',
    name: 'Tasks',
    component: TaskManageView,
    meta: { requiresAuth: true }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('admin_token');
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  
  if (requiresAuth && !token) {
    alert('需要总督登录才能访问此页面');
    next('/');
  } else {
    next();
  }
});

export default router;
