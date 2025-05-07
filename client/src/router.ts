import { createRouter, createWebHistory } from "vue-router";
import Home from "./pages/Home.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: Home
    },
    {
      path: '/join',
      component: () => import('./pages/Join.vue')
    },
    {
      path: '/join/:id',
      component: () => import('./pages/Pull.vue')
    }
  ]
})

export default router
