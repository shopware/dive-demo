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
    {
      path: '/switch-canvas',
      name: 'switch-canvas',
      component: () => import('../views/DiveSwitchCanvas.vue')
    },
    {
      path: '/place-on-floor',
      name: 'place-on-floor',
      component: () => import('../views/DivePlaceOnFloor.vue')
    },
    {
      path: '/focus-object',
      name: 'focus-object',
      component: () => import('../views/DiveFocusObject.vue')
    },
    {
      path: '/orientation-display',
      name: 'orientation-display',
      component: () => import('../views/DiveOD.vue')
    }
  ]
})

export default router
