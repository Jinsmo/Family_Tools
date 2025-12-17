import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '../store/auth';

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/home' },
  { path: '/login', name: 'Login', component: () => import('../../pages/Login.vue'), meta: { title: '登录' } },
  { path: '/home', name: 'Home', component: () => import('../../pages/Home.vue'), meta: { title: '首页' } },
  { path: '/tools', name: 'Tools', component: () => import('../../pages/Tools.vue'), meta: { title: '工具' } },
  { path: '/profile', name: 'Profile', component: () => import('../../pages/Profile.vue'), meta: { title: '我的' } },
  { path: '/user-info', name: 'UserInfo', component: () => import('../../pages/UserInfo.vue'), meta: { title: '个人信息' } },
  { path: '/family', name: 'Family', component: () => import('../../pages/Family.vue'), meta: { title: '我的家人' } },
  { path: '/register', name: 'Register', component: () => import('../../pages/Register.vue'), meta: { title: '注册' } },
  { path: '/forgot', name: 'Forgot', component: () => import('../../pages/Forgot.vue'), meta: { title: '忘记密码' } },
  { path: '/menu', name: 'MenuHome', component: () => import('../../pages/MenuHome.vue'), meta: { title: '家庭菜单' } },
  { path: '/menu/confirm', name: 'OrderConfirm', component: () => import('../../pages/OrderConfirm.vue'), meta: { title: '确认订单' } },
  { path: '/orders', name: 'Orders', component: () => import('../../pages/Orders.vue'), meta: { title: '我的订单' } },
  { path: '/orders/:id', name: 'OrderDetail', component: () => import('../../pages/OrderDetail.vue'), meta: { title: '订单详情' } },
  { path: '/password', name: 'PasswordHome', component: () => import('../../pages/password/PasswordHome.vue'), meta: { title: '密码助手' } },
  { path: '/password/edit', name: 'PasswordEdit', component: () => import('../../pages/password/PasswordEdit.vue'), meta: { title: '编辑密码' } },
  { path: '/password/category', name: 'CategoryManage', component: () => import('../../pages/password/CategoryManage.vue'), meta: { title: '分类管理' } },
  { path: '/admin', name: 'Admin', component: () => import('../../pages/Admin.vue'), meta: { title: '后台管理' } },
  { path: '/admin/users', name: 'UserManage', component: () => import('../../pages/admin/UserManage.vue'), meta: { title: '用户管理' } },
  { path: '/admin/menus', name: 'MenuManage', component: () => import('../../pages/admin/MenuManage.vue'), meta: { title: '菜品管理' } },
  { path: '/admin/permissions', name: 'PermissionManage', component: () => import('../../pages/admin/PermissionManage.vue'), meta: { title: '权限管理' } },
  { path: '/admin/schedule', name: 'ScheduleManage', component: () => import('../../pages/admin/ScheduleManage.vue'), meta: { title: '日程安排' } },
  { path: '/wishlist', name: 'WishlistHome', component: () => import('../../pages/wishlist/WishlistHome.vue'), meta: { title: '种草清单' } },
  { path: '/wishlist/edit', name: 'WishlistEdit', component: () => import('../../pages/wishlist/WishlistEdit.vue'), meta: { title: '编辑种草' } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const auth = useAuthStore();
  const publicPages = ['Login', 'Register', 'Forgot'];
  const authRequired = !publicPages.includes(to.name as string);

  if (authRequired && !auth.token) {
    next({ name: 'Login' });
  } else if (to.name === 'Login' && auth.token) {
    next({ name: 'Home' });
  } else {
    next();
  }
});

export default router;
