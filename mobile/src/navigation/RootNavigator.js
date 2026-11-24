import { Ionicons } from '@expo/vector-icons'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Loading } from '../components/ui'
import { ROLES, useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { colors } from '../theme'

import LoginScreen from '../screens/auth/LoginScreen'
import RegisterScreen from '../screens/auth/RegisterScreen'
import VerifyPendingScreen from '../screens/auth/VerifyPendingScreen'

import CartScreen from '../screens/customer/CartScreen'
import CheckoutScreen from '../screens/customer/CheckoutScreen'
import MyOrdersScreen from '../screens/customer/MyOrdersScreen'
import OrderConfirmationScreen from '../screens/customer/OrderConfirmationScreen'
import ProductDetailsScreen from '../screens/customer/ProductDetailsScreen'
import ProductsScreen from '../screens/customer/ProductsScreen'

import InvoiceScreen from '../screens/common/InvoiceScreen'
import ProfileScreen from '../screens/common/ProfileScreen'

import InventoryAuditScreen from '../screens/staff/InventoryAuditScreen'
import InventoryScreen from '../screens/staff/InventoryScreen'
import OrdersManageScreen from '../screens/staff/OrdersManageScreen'
import SalesDashboardScreen from '../screens/staff/SalesDashboardScreen'
import WarehouseDashboardScreen from '../screens/staff/WarehouseDashboardScreen'

import AdminCustomersScreen from '../screens/admin/AdminCustomersScreen'
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen'
import AdminProductsScreen from '../screens/admin/AdminProductsScreen'
import AdminReportsScreen from '../screens/admin/AdminReportsScreen'
import ProductFormScreen from '../screens/admin/ProductFormScreen'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

const stackOptions = {
  headerStyle: { backgroundColor: colors.surface },
  headerTitleStyle: { fontWeight: '700', color: colors.text },
  headerTintColor: colors.primary,
  contentStyle: { backgroundColor: colors.bg },
}

const tabOptions = (icons) => ({ route }) => ({
  ...stackOptions,
  tabBarActiveTintColor: colors.primary,
  tabBarInactiveTintColor: colors.muted,
  tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
  tabBarIcon: ({ color, size, focused }) => {
    const name = icons[route.name] || 'ellipse'
    return <Ionicons name={focused ? name : `${name}-outline`} size={size} color={color} />
  },
})

// ---------- Customer ----------

function CustomerTabs() {
  const { count } = useCart()
  return (
    <Tab.Navigator screenOptions={tabOptions({ Shop: 'storefront', Cart: 'cart', MyOrders: 'receipt', Profile: 'person' })}>
      <Tab.Screen name="Shop" component={ProductsScreen} options={{ title: 'Shop' }} />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{ title: 'Cart', tabBarBadge: count > 0 ? count : undefined }}
      />
      <Tab.Screen name="MyOrders" component={MyOrdersScreen} options={{ title: 'My Orders' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}

function CustomerStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="CustomerHome" component={CustomerTabs} options={{ headerShown: false }} />
      <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} options={{ title: 'Product' }} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Checkout' }} />
      <Stack.Screen
        name="OrderConfirmation"
        component={OrderConfirmationScreen}
        options={{ title: 'Order placed', headerBackVisible: false, gestureEnabled: false }}
      />
      <Stack.Screen name="Invoice" component={InvoiceScreen} options={{ title: 'Invoice' }} />
    </Stack.Navigator>
  )
}

// ---------- Retail Salesperson ----------

function SalesTabs() {
  return (
    <Tab.Navigator screenOptions={tabOptions({ SalesDashboard: 'stats-chart', SalesOrders: 'receipt', Profile: 'person' })}>
      <Tab.Screen name="SalesDashboard" component={SalesDashboardScreen} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="SalesOrders" component={OrdersManageScreen} options={{ title: 'Orders' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}

function SalesStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="SalesHome" component={SalesTabs} options={{ headerShown: false }} />
    </Stack.Navigator>
  )
}

// ---------- Warehouse Manager ----------

function WarehouseTabs() {
  return (
    <Tab.Navigator
      screenOptions={tabOptions({ WarehouseDashboard: 'grid', Inventory: 'cube', Catalog: 'pricetags', Profile: 'person' })}
    >
      <Tab.Screen name="WarehouseDashboard" component={WarehouseDashboardScreen} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="Inventory" component={InventoryScreen} />
      <Tab.Screen name="Catalog" component={ProductsScreen} options={{ title: 'Products' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}

function WarehouseStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="WarehouseHome" component={WarehouseTabs} options={{ headerShown: false }} />
      <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} options={{ title: 'Product' }} />
      <Stack.Screen name="InventoryAudit" component={InventoryAuditScreen} options={{ title: 'Stock history' }} />
    </Stack.Navigator>
  )
}

// ---------- Admin ----------

function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={tabOptions({
        AdminDashboard: 'speedometer',
        AdminOrders: 'receipt',
        AdminProducts: 'pricetags',
        AdminCustomers: 'people',
        Profile: 'person',
      })}
    >
      <Tab.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="AdminOrders" component={OrdersManageScreen} options={{ title: 'Orders' }} />
      <Tab.Screen name="AdminProducts" component={AdminProductsScreen} options={{ title: 'Products' }} />
      <Tab.Screen name="AdminCustomers" component={AdminCustomersScreen} options={{ title: 'Customers' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}

function AdminStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="AdminHome" component={AdminTabs} options={{ headerShown: false }} />
      <Stack.Screen name="ProductForm" component={ProductFormScreen} options={{ title: 'Product' }} />
      <Stack.Screen name="AdminReports" component={AdminReportsScreen} options={{ title: 'Sales reports' }} />
      <Stack.Screen name="Invoice" component={InvoiceScreen} options={{ title: 'Order details' }} />
    </Stack.Navigator>
  )
}

// ---------- Signed out ----------

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Create account' }} />
      <Stack.Screen name="VerifyPending" component={VerifyPendingScreen} options={{ title: 'Verify email' }} />
    </Stack.Navigator>
  )
}

export default function RootNavigator() {
  const { ready, role } = useAuth()
  if (!ready) return <Loading />

  // `key` forces a fresh navigation tree when the role changes (login/logout).
  switch (role) {
    case ROLES.Customer:
      return <CustomerStack key="customer" />
    case ROLES.Sales:
      return <SalesStack key="sales" />
    case ROLES.Warehouse:
      return <WarehouseStack key="warehouse" />
    case ROLES.Admin:
      return <AdminStack key="admin" />
    default:
      return <AuthStack key="auth" />
  }
}
