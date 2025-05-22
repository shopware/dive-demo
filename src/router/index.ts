import { createRouter, createWebHistory } from 'vue-router'
import DiveQuickView from '@/views/DiveQuickView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'quick view',
      component: DiveQuickView
    },
    {
      path: '/ar',
      name: 'ar',
      component: () => import('../views/DiveAR.vue')
    },
  ]
})

export default router
