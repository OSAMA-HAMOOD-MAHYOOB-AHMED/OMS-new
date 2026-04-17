import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

import HomePage from '../views/HomePage.vue'
import LoginPage from '../views/LoginPage.vue'
import RegisterPage from '../views/RegisterPage.vue'
import ProductsPage from '../views/ProductsPage.vue'
import CartPage from '../views/CartPage.vue'
import CustomerOrdersPage from '../views/CustomerOrdersPage.vue'
import WarehouseInventoryPage from '../views/WarehouseInventoryPage.vue'
import SalesDashboardPage from '../views/SalesDashboardPage.vue'
import WarehouseDashboardPage from '../views/WarehouseDashboardPage.vue'
import SalesOrdersPage from '../views/SalesOrdersPage.vue'

function roleHome(role) {
  if (role === 'Customer') return { name: 'products' }
  if (role === 'Retail Salesperson') return { name: 'salesDashboard' }
  if (role === 'Warehouse Manager') return { name: 'warehouseDashboard' }
  return { name: 'home' }
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomePage },
    { path: '/login', name: 'login', component: LoginPage, meta: { guestOnly: true } },
    { path: '/register', name: 'register', component: RegisterPage, meta: { guestOnly: true } },
    { path: '/products', name: 'products', component: ProductsPage, meta: { auth: true, roles: ['Customer', 'Warehouse Manager'] } },
    { path: '/cart', name: 'cart', component: CartPage, meta: { auth: true, roles: ['Customer'] } },
    { path: '/customer/orders', name: 'customerOrders', component: CustomerOrdersPage, meta: { auth: true, roles: ['Customer'] } },
    { path: '/warehouse/inventory', name: 'warehouseInventory', component: WarehouseInventoryPage, meta: { auth: true, roles: ['Warehouse Manager'] } },
    { path: '/dashboard/sales', name: 'salesDashboard', component: SalesDashboardPage, meta: { auth: true, roles: ['Retail Salesperson'] } },
    { path: '/sales/orders', name: 'salesOrders', component: SalesOrdersPage, meta: { auth: true, roles: ['Retail Salesperson'] } },
    { path: '/dashboard/warehouse', name: 'warehouseDashboard', component: WarehouseDashboardPage, meta: { auth: true, roles: ['Warehouse Manager'] } },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (!auth.token && localStorage.getItem('oms_auth')) auth.hydrate()

  if (to.meta.guestOnly && auth.token) return roleHome(auth.role)

  if (to.meta.auth) {
    if (!auth.token) return { name: 'login', query: { next: to.fullPath } }
    if (to.meta.roles && !to.meta.roles.includes(auth.role)) return roleHome(auth.role)
  }
})

export default router

