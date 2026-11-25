import { Ionicons } from '@expo/vector-icons'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { View } from 'react-native'
import { Loading } from '../components/ui'
import { ROLES, useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useI18n } from '../i18n'
import { colors, fonts } from '../theme'

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
  headerTitleStyle: { fontFamily: fonts.heading, color: colors.text },
  headerTintColor: colors.ink,
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.bg },
}

const tabOptions = (icons) => ({ route }) => ({
  ...stackOptions,
  tabBarActiveTintColor: colors.ink,
  tabBarInactiveTintColor: colors.muted,
  tabBarLabelStyle: { fontSize: 11, fontFamily: fonts.medium },
  tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, paddingTop: 6 },
  tabBarBadgeStyle: { backgroundColor: colors.ink, color: '#fff', fontSize: 10 },
  tabBarIcon: ({ color, focused }) => {
    const name = icons[route.name] || 'ellipse'
    return (
      <View
        style={{
          width: 52,
          height: 30,
          borderRadius: 15,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: focused ? colors.gold : 'transparent',
        }}
      >
        <Ionicons name={focused ? name : `${name}-outline`} size={20} color={color} />
      </View>
    )
  },
})

// ---------- Customer ----------

function CustomerTabs() {
  const { count } = useCart()
  const { t } = useI18n()
  return (
    <Tab.Navigator screenOptions={tabOptions({ Shop: 'home', Cart: 'cart', MyOrders: 'receipt', Profile: 'person' })}>
      <Tab.Screen name="Shop" component={ProductsScreen} options={{ title: t('tabs.home'), headerShown: false }} />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{ title: t('tabs.cart'), tabBarBadge: count > 0 ? count : undefined }}
      />
      <Tab.Screen name="MyOrders" component={MyOrdersScreen} options={{ title: t('tabs.orders') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: t('tabs.profile') }} />
    </Tab.Navigator>
  )
}

function CustomerStack() {
  const { t } = useI18n()
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="CustomerHome" component={CustomerTabs} options={{ headerShown: false }} />
      <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: t('titles.checkout') }} />
      <Stack.Screen
        name="OrderConfirmation"
        component={OrderConfirmationScreen}
        options={{ title: t('titles.orderPlaced'), headerBackVisible: false, gestureEnabled: false }}
      />
      <Stack.Screen name="Invoice" component={InvoiceScreen} options={{ title: t('titles.invoice') }} />
    </Stack.Navigator>
  )
}

// ---------- Retail Salesperson ----------

function SalesTabs() {
  const { t } = useI18n()
  return (
    <Tab.Navigator screenOptions={tabOptions({ SalesDashboard: 'stats-chart', SalesOrders: 'receipt', Profile: 'person' })}>
      <Tab.Screen name="SalesDashboard" component={SalesDashboardScreen} options={{ title: t('tabs.dashboard') }} />
      <Tab.Screen name="SalesOrders" component={OrdersManageScreen} options={{ title: t('tabs.salesOrders') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: t('tabs.profile') }} />
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
  const { t } = useI18n()
  return (
    <Tab.Navigator
      screenOptions={tabOptions({ WarehouseDashboard: 'grid', Inventory: 'cube', Catalog: 'pricetags', Profile: 'person' })}
    >
      <Tab.Screen name="WarehouseDashboard" component={WarehouseDashboardScreen} options={{ title: t('tabs.dashboard') }} />
      <Tab.Screen name="Inventory" component={InventoryScreen} options={{ title: t('tabs.inventory') }} />
      <Tab.Screen name="Catalog" component={ProductsScreen} options={{ title: t('tabs.products'), headerShown: false }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: t('tabs.profile') }} />
    </Tab.Navigator>
  )
}

function WarehouseStack() {
  const { t } = useI18n()
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="WarehouseHome" component={WarehouseTabs} options={{ headerShown: false }} />
      <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="InventoryAudit" component={InventoryAuditScreen} options={{ title: t('titles.stockHistory') }} />
    </Stack.Navigator>
  )
}

// ---------- Admin ----------

function AdminTabs() {
  const { t } = useI18n()
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
      <Tab.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ title: t('tabs.dashboard') }} />
      <Tab.Screen name="AdminOrders" component={OrdersManageScreen} options={{ title: t('tabs.salesOrders') }} />
      <Tab.Screen name="AdminProducts" component={AdminProductsScreen} options={{ title: t('tabs.products') }} />
      <Tab.Screen name="AdminCustomers" component={AdminCustomersScreen} options={{ title: t('tabs.customers') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: t('tabs.profile') }} />
    </Tab.Navigator>
  )
}

function AdminStack() {
  const { t } = useI18n()
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="AdminHome" component={AdminTabs} options={{ headerShown: false }} />
      <Stack.Screen name="ProductForm" component={ProductFormScreen} options={{ title: t('titles.product') }} />
      <Stack.Screen name="AdminReports" component={AdminReportsScreen} options={{ title: t('titles.salesReports') }} />
      <Stack.Screen name="Invoice" component={InvoiceScreen} options={{ title: t('titles.orderDetails') }} />
    </Stack.Navigator>
  )
}

// ---------- Signed out ----------

function AuthStack() {
  const { t } = useI18n()
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ title: t('titles.createAccount') }} />
      <Stack.Screen name="VerifyPending" component={VerifyPendingScreen} options={{ title: t('titles.verifyEmail') }} />
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
