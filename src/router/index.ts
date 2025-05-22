import { createRouter, createWebHistory } from 'vue-router'
import DiveInit from '@/views/DiveInit.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: DiveInit
    },
    {
      path: '/ar',
      name: 'ar',
      component: () => import('../views/DiveAR.vue')
    },
  ]
})

export default router
