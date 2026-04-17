# Software Requirements Specification

**Project:** Al-Wakeel Al-Shamel Order Management System (OMS)

**Pattern:** Model-View-Controller (MVC)

## 1. Technology Stack

- **Frontend:** HTML, CSS, JavaScript, Vue.js
    
- **Backend:** ASP.NET Core (C#)
    
- **Database:** MySQL
    
- **Hosting/Deployment:** Firebase Hosting
    
- **IDE:** Visual Studio Code
    

## 2. Actors

1. **Customer:** Browses products, manages cart, places orders (cash/credit), tracks history.
    
2. **Retail Salesperson:** Manages customer orders, updates order statuses, approves/rejects credit requests, views sales dashboards.
    
3. **Warehouse Manager:** Updates inventory levels, performs stock check-ups, views inventory dashboards.
    
4. **Administrator (Admin):** Manages products, orders, and customers; views admin dashboards and sales reports.
    
5. **System-Automated:** Updates global inventory upon order placement, dispatches invoice emails, generates invoices.
    

## 3. Functional Requirements (Core Workflows)

### Authentication Subsystem

- **FR1 (Register):** Users can register by providing Name, Email, Phone, Address, Role, and Password. System must validate unique email/IC and send verification.
    
- **FR2 (Login):** Users authenticate with Email/Password. System redirects based on Role (Customer -> Catalog, Sales -> Order Dashboard, Warehouse -> Inventory Dashboard).
    

### Order Management Subsystem

- **FR3 (Catalog):** Customers can browse available products and view details.
    
- **FR4 (Cart):** Customers can add selected products and quantities to an electronic cart.
    
- **FR5 (Checkout):** Customers choose a payment method (Cash or Credit) and place the order.
    
- **FR6 (Order History):** Customers can view their past orders and current fulfillment statuses, filter by status/date, and view order details.
    
- **FR7 (Order Handling):** Retail Salesperson can view all orders and mutate order statuses.
    
- **FR8 (Credit Approval):** Retail Salesperson can accept or reject deferred payment (Credit) requests from customers.
    
- **FR9 (Invoicing):** System automatically sends an invoice to the customer post-checkout.
    
- **FR9.1 (Invoice Access):** Customers can view/download invoice content for an order from Order History.
    
- **FR9.2 (Reorder):** Customers can re-order a previous order (recreates cart items and proceeds to checkout).
    

### Inventory Management Subsystem

- **FR10 (Inventory Sync):** System automatically deducts available stock when an order is successfully placed.
    
- **FR11 (Manual Update):** Warehouse Manager can manually add new stock quantities received from suppliers.
    
- **FR12 (Audit):** Warehouse Manager can perform and log periodic inventory check-ups.
    
- **FR13 (Dashboards):** Role-specific analytics dashboards for Sales (sales trends) and Warehouse (stock alerts).

### Customer Account Subsystem (Figma)

- **FR14 (User Profile):** Customers can view and update profile information (name, phone, address).
    
- **FR15 (Password Change):** Customers can change their password after authenticating.

### Admin Subsystem (Figma)

- **FR16 (Admin Login):** Admins authenticate via a dedicated admin login route and are redirected to the admin dashboard.
    
- **FR17 (Admin Dashboard):** Admin dashboard shows summary metrics (orders, revenue, low-stock alerts, recent orders, customer growth if available).
    
- **FR18 (Product Management):** Admin can create, edit, delete products; manage stock; assign categories; manage product images (optional).
    
- **FR19 (Admin Order Management):** Admin can view orders with search/filtering, inspect order details, update order statuses, manage shipping fields (optional), and export orders (CSV).
    
- **FR20 (Customer Management):** Admin can list customers, search, view customer details and order history, and manage account status (optional).
    
- **FR21 (Sales Reports):** Admin can view sales reports with date range filtering and export (CSV; PDF/Excel optional).
    

## 4. System Diagrams (PlantUML)

### 4.1 Use Case Diagram

```
@startuml
left to right direction
skinparam packageStyle rectangle

actor "Customer" as cust
actor "Retail Salesperson" as sales
actor "Warehouse Manager" as whm
actor "Administrator" as admin
actor "System" as sys

rectangle "Al-Wakeel Al-Shamel OMS" {
  
  package "Auth Subsystem" {
    usecase "UC01: Register Account" as uc1
    usecase "UC02: Authenticate User" as uc2
  }

  package "Order Subsystem" {
    usecase "UC03: View Product List" as uc3
    usecase "UC04: Add to Cart" as uc4
    usecase "UC05: Select Payment Method" as uc5
    usecase "UC06: Manage Payments & Orders" as uc6
    usecase "UC07: Show Order History" as uc7
    usecase "UC11: Send Invoice" as uc11
    usecase "UC13: View Invoice" as uc13
    usecase "UC14: Reorder" as uc14
  }

  package "Inventory Subsystem" {
    usecase "UC08: Update Inventory" as uc8
    usecase "UC09: Check Inventory" as uc9
    usecase "UC12: Auto-Sync Inventory" as uc12
  }

  package "Reporting" {
    usecase "UC10: View Dashboard Analysis" as uc10
  }

  package "Admin Subsystem" {
    usecase "UC15: Admin Dashboard" as uc15
    usecase "UC16: Manage Products" as uc16
    usecase "UC17: Manage Customers" as uc17
    usecase "UC18: Admin Order Management" as uc18
    usecase "UC19: Sales Reports" as uc19
  }
}

cust --> uc1
cust --> uc2
cust --> uc3
cust --> uc4
cust --> uc5
cust --> uc7

sales --> uc1
sales --> uc2
sales --> uc6
sales --> uc10

whm --> uc1
whm --> uc2
whm --> uc3
whm --> uc8
whm --> uc9
whm --> uc10

admin --> uc2
admin --> uc15
admin --> uc16
admin --> uc17
admin --> uc18
admin --> uc19

sys --> uc11
sys --> uc12
uc5 ..> uc11 : triggers
uc5 ..> uc12 : triggers
uc7 ..> uc13 : includes
uc7 ..> uc14 : includes

@enduml
```

### 4.2 Entity Relationship Diagram (Database Schema)

```
@startuml
skinparam linetype ortho

entity "User" as user {
  * email : VARCHAR(255) [PK]
  --
  name : VARCHAR(255)
  phoneNumber : VARCHAR(20)
  password : VARCHAR(255)
  address : VARCHAR(255)
  role : VARCHAR(50)
}

entity "Product" as product {
  * productID : VARCHAR(50) [PK]
  --
  name : VARCHAR(255)
  category : VARCHAR(100)
  price : FLOAT
  stockLevel : INT
  description : TEXT
}

entity "Order" as order {
  * orderID : VARCHAR(50) [PK]
  --
  email : VARCHAR(255) [FK]
  orderDate : DATETIME
  totalPrice : FLOAT
  orderStatus : VARCHAR(50)
  paymentMethod : VARCHAR(50)
  creditStatus : VARCHAR(50)
}

entity "Order_Item" as order_item {
  * orderID : VARCHAR(50) [FK]
  * productID : VARCHAR(50) [FK]
  --
  quantity : INT
  subtotal : FLOAT
}

entity "Inventory" as inventory {
  * inventoryID : VARCHAR(50) [PK]
  --
  productID : VARCHAR(50) [FK]
  location : VARCHAR(100)
  quantityAvailable : INT
  quantityReserved : INT
  lastCheckupDate : DATETIME
}

entity "Invoice" as invoice {
  * invoiceID : BIGINT [PK]
  --
  orderID : VARCHAR(50) [FK]
  email : VARCHAR(255) [FK]
  subject : VARCHAR(255)
  body : MEDIUMTEXT
  createdAt : DATETIME
}

user ||--o{ order : "places"
order ||--|{ order_item : "contains"
product ||--o{ order_item : "included_in"
product ||--|| inventory : "tracks"
order ||--o{ invoice : "generates"
@enduml
```

## 5. Interface Specifications (Alt-Text Definitions)

$$UI Screen 1: Splash/Home Page$$

_Alt-text description:_ A clean, modern e-commerce landing page. At the top left is a circular teal-and-blue logo with the letters "AW" next to the text "Al-Wakeel Al-Shamel Order Management". Top right contains navigation links "Home" and "Products" alongside a solid blue "Login" button. Below the header is a hero section featuring a vibrant blue-to-green gradient background with large white text reading "Premium Phone Accessories: Chargers, Earphones, Power Banks & Phone Cases". Two call-to-action buttons sit below the text: a white "Browse Products" button and an outlined "Sign Up" button. Below the hero section is a white area titled "Why Shop With Us?" displaying four minimalist cards horizontally: "Wide Selection" (with a shopping bag icon), "Fast Delivery" (truck icon), "Quality Assured" (shield icon), and "24/7 Support" (headset icon). Further down is a "Popular Categories" section displaying four rectangular image tiles representing Chargers, Earphones, Power Banks, and Phone Cases, each with a dark gradient overlay and white text at the bottom left.

$$UI Screen 2: User Authentication (Login) Page$$

_Alt-text description:_ A minimalist login screen with a light grey background. The top header matches the home page with the AW logo, "Home", "Products" links, and a blue "Login" button. In the center of the page is a white, elevated rectangular card. At the top of the card is the circular AW logo, followed by the text "Welcome Back" and a smaller subtitle "Sign in to your account". Below this are two input fields with light grey borders: "Email Address" showing a mail icon and a placeholder "you@example.com", and "Password" showing a padlock icon and a dotted hidden password placeholder. Below the inputs is a large, full-width solid blue button reading "Sign In". Beneath the button is a small text link saying "Don't have an account? Sign Up". At the very bottom of the card is a muted grey link reading "Admin Login ->".