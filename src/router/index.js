import { createRouter, createWebHistory } from 'vue-router'
import SearchResults from '../views/SearchResults.vue'
import About from '../views/About.vue'

const routes = [
  {
    path: '/settings',
    component: () => import('../views/Settings.vue')
  },
  {
    path: '/manage-categories',
    component: () => import('../views/ManageCategories.vue')
  },
  {
    path: '/search',
    component: SearchResults
  },
  {
    path: '/about',
    component: About
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
