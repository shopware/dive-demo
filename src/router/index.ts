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
      name: 'augmented reality',
      component: () => import('../views/DiveAR.vue')
    },
    {
      path: '/switch-canvas',
      name: 'switch canvas',
      component: () => import('../views/DiveSwitchCanvas.vue')
    },
    {
      path: '/asset-loader-diagnostics',
      name: 'asset loader diagnostics',
      component: () => import('../views/DiveAssetLoaderDiagnostics.vue')
    },
    {
      path: '/place-on-floor',
      name: 'place on floor',
      component: () => import('../views/DivePlaceOnFloor.vue')
    },
    {
      path: '/focus-object',
      name: 'focus object',
      component: () => import('../views/DiveFocusObject.vue')
    },
    {
      path: '/orientation-display',
      name: 'orientation display',
      component: () => import('../views/DiveOD.vue')
    },
    {
      path: '/step-loader',
      name: 'step loader',
      component: () => import('../views/DiveStepLoader.vue')
    },
    {
      path: '/target-animation',
      name: 'target animation',
      component: () => import('../views/DiveTargetAnimation.vue')
    },
    {
      path: '/clip-animation',
      name: 'clip animation',
      component: () => import('../views/DiveClipAnimation.vue')
    },
    {
      path: '/hdr-environment',
      name: 'hdr environment',
      component: () => import('../views/DiveHDREnvironment.vue')
    }
  ]
})

export default router
