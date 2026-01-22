import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

import SellerAddProductView from '@/views/SellerAddProductView.vue'
import LoginCallbackView from '@/views/LoginCallbackView.vue'
import LoginView from '@/views/LoginView.vue'
import UserProfileView from '@/views/UserProfileView.vue'
import ChatView from '../views/ChatView.vue'
import SellerProfileView from '@/views/SellerProfileView.vue'
import SellerEditProductView from '@/views/SellerEditProductView.vue'
import UserOrdersView from '@/views/UserOrdersView.vue'
import SellerDashboardView from '@/views/SellerDashboardView.vue'
import CheckoutView from '@/views/CheckoutView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/home',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/seller/add',
      name: 'seller-add',
      component: SellerAddProductView
    },
    {
      path: '/login-callback',
      name: 'login-callback',
      component: LoginCallbackView,
    },
    {
      path: '/',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/profile',
      name: 'profie',
      component: UserProfileView,
    },
    {
      path: '/chat/:id',
      name: 'ChatView',
      component: ChatView,
      props: true
    },
    {
      path: '/seller/:id',
      name: 'seller-profile',
      component: SellerProfileView,
      props: true
    },
    {
      path: '/seller/edit/:id',
      name: 'seller-edit',
      component: SellerEditProductView,
      props: true
    },
    {
      path: '/orders',
      name: 'user-orders',
      component: UserOrdersView,
    },
    {
      path: '/seller/dashboard',
      name: 'seller-dashboard',
      component: SellerDashboardView,
    },
    {
      path: '/checkout/:orderId',
      name: 'Checkout',
      component: CheckoutView,
  }
  ],
})

export default router
