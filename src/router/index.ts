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
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/DiveAR.vue')
    },
    {
      path: '/material',
      name: 'material',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/DiveMaterial.vue')
    },
    {
      path: '/primitives',
      name: 'primitives',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/DivePrimitives.vue')
    },
    {
      path: '/groups',
      name: 'groups',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/DiveGroups.vue')
    },
    {
      path: '/transform',
      name: 'transform',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/DiveTransform.vue')
    },
    {
      path: '/asset-loader',
      name: 'asset-loader',
      component: () => import('../views/DiveAssetLoader.vue')
    },
    {
      path: '/asset-exporter',
      name: 'asset-exporter',
      component: () => import('../views/DiveAssetExporter.vue')
    }
  ]
})

export default router
