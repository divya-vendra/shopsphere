# ShopSphere

A production-ready, full-stack e-commerce platform built as a portfolio project. Covers the complete purchase lifecycle: product browsing, cart management, Stripe-powered checkout, order tracking, image uploads via Cloudinary, and a full admin dashboard.

---

## Table of Contents

1. [Tech Stack](#1-tech-stack)
2. [System Architecture](#2-system-architecture)
3. [Project Structure](#3-project-structure)
4. [Database Design](#4-database-design)
5. [API Reference](#5-api-reference)
6. [Authentication Flow](#6-authentication-flow)
7. [Stripe Payment Flow](#7-stripe-payment-flow)
8. [Frontend Architecture](#8-frontend-architecture)
9. [Redux State Management](#9-redux-state-management)
10. [Security](#10-security)
11. [Performance](#11-performance)
12. [Running Locally](#12-running-locally)
13. [Scripts](#13-scripts)
14. [Deployment](#14-deployment)
15. [Environment Variables](#15-environment-variables)

---

## 1. Tech Stack

### Backend
| Technology | Role |
|---|---|
| Node.js 20 + Express 4 | HTTP server and REST API |
| MongoDB 7 + Mongoose 8 | Database and ODM |
| JSON Web Tokens (JWT) | Stateless authentication |
| Stripe SDK v17 | Payment processing |
| Cloudinary SDK v2 + Multer | Image uploads and CDN |
| Nodemailer | Transactional email |
| Zod | Request schema validation |
| Helmet, CORS, HPP, express-mongo-sanitize, xss-clean | Security middleware |
| express-rate-limit | Rate limiting |
| compression | Gzip response compression |
| bcryptjs | Password hashing |

### Frontend
| Technology | Role |
|---|---|
| React 18 + Vite | UI framework and build tool |
| Redux Toolkit | Global state management |
| React Router v6 | Client-side routing |
| Axios | HTTP client with interceptors |
| Tailwind CSS | Utility-first styling |
| react-hook-form | Form state and validation |
| react-hot-toast | Toast notifications |
| Recharts | Admin analytics charts |
| @heroicons/react | Icon library |

### Infrastructure
| Service | Role |
|---|---|
| MongoDB Atlas | Managed database (production) |
| Render | Backend hosting |
| Vercel | Frontend hosting + CDN |
| Cloudinary | Image storage and CDN |
| Stripe | Payment gateway |
| GitHub Actions | CI/CD pipelines |
| Docker + Docker Compose | Local development environment |

---

## 2. System Architecture

```
                    ┌─────────────────────────────────┐
                    │          End Users               │
                    └───────────────┬─────────────────┘
                                    │ HTTPS
                    ┌───────────────▼─────────────────┐
                    │         Vercel CDN               │
                    │   React/Vite SPA (static files)  │
                    └───────────────┬─────────────────┘
                                    │ HTTPS /api/v1/*
                    ┌───────────────▼─────────────────┐
                    │       Render (Node.js)           │
                    │     Express REST API             │
                    │  ┌──────────────────────────┐   │
                    │  │ Auth / Products / Orders  │   │
                    │  │ Cart / Reviews / Wishlist │   │
                    │  └──────────┬───────────────┘   │
                    └─────────────┼───────────────────┘
                                  │
              ┌───────────────────┼──────────────────────┐
              │                   │                      │
┌─────────────▼──────┐  ┌─────────▼──────┐  ┌──────────▼──────┐
│   MongoDB Atlas     │  │    Stripe      │  │   Cloudinary    │
│  (Primary DB)       │  │  (Payments +   │  │  (Image CDN +   │
│                     │  │   Webhooks)    │  │   Storage)      │
└────────────────────┘  └────────────────┘  └─────────────────┘
```

### Request lifecycle

```
Browser → Vercel CDN
       → React SPA (client-side routing)
       → Axios (attaches Bearer token, handles 401 → silent refresh)
       → Express API
           → helmet / compression / cors / rate-limit
           → express.raw (webhook route only) | express.json (all others)
           → mongoSanitize / xss-clean / hpp
           → Router → validate middleware (Zod) → auth middleware
           → Controller → Mongoose → MongoDB Atlas
           → Response (JSON)
```

---

## 3. Project Structure

```
shopsphere/
├── .github/
│   └── workflows/
│       ├── backend.yml          # Backend CI/CD (lint → test → Render deploy)
│       └── frontend.yml         # Frontend CI/CD (lint → build → Vercel deploy)
│
├── backend/
│   ├── Dockerfile               # Multi-stage Alpine build, non-root user
│   ├── .dockerignore
│   ├── .env.example             # All env var keys documented
│   ├── render.yaml              # Render deployment config
│   ├── STRIPE_SETUP.md          # Stripe CLI and webhook guide
│   ├── package.json
│   └── src/
│       ├── app.js               # Express app (middleware stack)
│       ├── server.js            # HTTP server, graceful shutdown
│       ├── config/
│       │   ├── db.js            # Mongoose connection
│       │   ├── stripe.js        # Stripe singleton
│       │   └── cloudinary.js    # Cloudinary + Multer storage config
│       ├── models/
│       │   ├── User.model.js
│       │   ├── Product.model.js
│       │   ├── Cart.model.js
│       │   ├── Order.model.js
│       │   ├── Review.model.js
│       │   ├── Wishlist.model.js
│       │   └── WebhookEvent.model.js
│       ├── controllers/
│       │   ├── auth.controller.js
│       │   ├── user.controller.js
│       │   ├── product.controller.js
│       │   ├── cart.controller.js
│       │   ├── order.controller.js
│       │   ├── payment.controller.js
│       │   ├── review.controller.js
│       │   ├── wishlist.controller.js
│       │   └── admin.controller.js
│       ├── middleware/
│       │   ├── auth.middleware.js
│       │   ├── validate.middleware.js
│       │   ├── upload.middleware.js
│       │   ├── cache.middleware.js
│       │   └── error.middleware.js
│       ├── routes/
│       │   ├── auth.routes.js
│       │   ├── user.routes.js
│       │   ├── product.routes.js
│       │   ├── cart.routes.js
│       │   ├── order.routes.js
│       │   ├── payment.routes.js
│       │   ├── review.routes.js
│       │   ├── wishlist.routes.js
│       │   └── admin.routes.js
│       ├── validators/
│       │   ├── auth.validator.js
│       │   ├── product.validator.js
│       │   └── order.validator.js
│       ├── utils/
│       │   ├── AppError.js       # Custom operational error class
│       │   ├── asyncHandler.js   # Promise wrapper for async controllers
│       │   ├── apiFeatures.js    # Chainable filter/sort/paginate/search
│       │   ├── generateTokens.js # JWT access + refresh token helpers
│       │   ├── email.js          # Nodemailer email templates
│       │   ├── cache.js          # In-process TTL cache
│       │   └── stripeService.js  # Stripe API abstractions
│       └── scripts/
│           ├── seed.js           # Import/destroy demo data
│           └── verifyIndexes.js  # CI index existence check
│
├── frontend/
│   ├── index.html
│   ├── vite.config.js           # Dev proxy, manual chunk splitting
│   ├── tailwind.config.js       # Custom design tokens
│   ├── vercel.json              # SPA rewrites, security headers, asset caching
│   ├── package.json
│   └── src/
│       ├── main.jsx             # Redux Provider + BrowserRouter + Toaster
│       ├── App.jsx              # Session rehydration on mount
│       ├── index.css            # Tailwind + custom component classes
│       ├── api/
│       │   ├── axios.js         # Axios instance, interceptors, token refresh queue
│       │   ├── authApi.js
│       │   ├── productApi.js
│       │   ├── cartApi.js
│       │   ├── orderApi.js
│       │   ├── paymentApi.js
│       │   ├── reviewApi.js
│       │   ├── wishlistApi.js
│       │   └── adminApi.js
│       ├── app/
│       │   └── store.js
│       ├── features/
│       │   ├── auth/authSlice.js
│       │   ├── products/productSlice.js
│       │   ├── cart/cartSlice.js
│       │   ├── orders/orderSlice.js
│       │   └── wishlist/wishlistSlice.js
│       ├── hooks/
│       │   ├── useAuth.js
│       │   ├── useCart.js
│       │   └── useDebounce.js
│       ├── components/
│       │   ├── ui/              # Button, Input, Spinner, Badge, Modal, Pagination, LazyImage
│       │   ├── layout/          # Navbar, Footer
│       │   ├── products/        # ProductCard, ProductGrid, ProductFilters, StarRating
│       │   ├── cart/            # CartItem, CartSummary
│       │   └── admin/           # StatsCard, SalesChart
│       ├── pages/
│       │   ├── HomePage.jsx
│       │   ├── ProductDetailPage.jsx
│       │   ├── CartPage.jsx
│       │   ├── CheckoutPage.jsx
│       │   ├── OrderSuccessPage.jsx
│       │   ├── OrderHistoryPage.jsx
│       │   ├── OrderDetailPage.jsx
│       │   ├── LoginPage.jsx
│       │   ├── RegisterPage.jsx
│       │   ├── ProfilePage.jsx
│       │   ├── WishlistPage.jsx
│       │   ├── NotFoundPage.jsx
│       │   └── admin/
│       │       ├── AdminDashboard.jsx
│       │       ├── AdminProducts.jsx
│       │       ├── AdminOrders.jsx
│       │       └── AdminUsers.jsx
│       ├── routes/
│       │   ├── AppRouter.jsx
│       │   ├── ProtectedRoute.jsx
│       │   └── AdminRoute.jsx
│       └── utils/
│           ├── formatCurrency.js
│           ├── formatDate.js
│           └── constants.js
│
├── docker-compose.yml           # Full local dev stack
└── DEPLOYMENT.md                # Step-by-step production deployment guide
```

---

## 4. Database Design

### User

```
User {
  name:                 String   required
  email:                String   required, unique, lowercase
  password:             String   required, min 8 chars, select: false
  role:                 String   enum: ['customer', 'admin'], default: 'customer'
  avatar:               { url, publicId }
  refreshTokenHash:     String   SHA-256 hash of current refresh token
  passwordChangedAt:    Date
  passwordResetToken:   String   hashed reset token
  passwordResetExpires: Date
  isActive:             Boolean  default: true (soft delete)
  timestamps:           true
}
```

**Hooks:** `pre('save')` — bcrypt hash password if modified. Pre-find middleware filters `isActive: true` for all queries.

**Instance methods:** `comparePassword(candidate)`, `changedPasswordAfter(jwtTimestamp)`, `createPasswordResetToken()`

**Indexes:** `email` (unique)

---

### Product

```
Product {
  name:           String   required
  slug:           String   unique (auto-generated from name)
  description:    String   required
  price:          Number   required, min 0
  comparePrice:   Number   optional (original price for discount display)
  brand:          String   required
  category:       String   required, enum
  images:         [{ url, publicId }]
  stock:          Number   default 0, min 0
  ratings:        Number   default 0 (denormalized from reviews)
  numReviews:     Number   default 0 (denormalized from reviews)
  featured:       Boolean  default false
  isActive:       Boolean  default true (soft delete)
  timestamps:     true
}
```

**Virtuals:** `inStock` (stock > 0), `discountPercent`

**Hooks:** `pre('save')` — auto-generate slug. Pre-find middleware filters `isActive: true` unless `adminQuery` option is set.

**Indexes:**
- `slug` (unique)
- Text index on `name` (weight 10), `brand` (weight 5), `description` (weight 1) — powers `$text` search
- `{ category: 1, price: 1 }` — compound index for filtered browsing
- `{ featured: 1 }` — homepage featured query
- `{ ratings: -1 }` — sort by rating

---

### Cart

```
Cart {
  user:       ObjectId → User   required, unique (one cart per user)
  items: [{
    product:  ObjectId → Product
    quantity: Number   min 1
    price:    Number   snapshot at add-to-cart time
    name:     String   snapshot
    image:    String   snapshot
  }]
  timestamps: true
}
```

**Virtuals:** `totalPrice`, `itemCount`

**Why price snapshots?** Price is captured at the time the item is added. If the product price changes later, the cart reflects what the user saw when they added it. The order creation step re-validates against the current DB price to prevent manipulation.

---

### Order

```
Order {
  user:            ObjectId → User
  items: [{
    product:       ObjectId → Product
    name:          String   ← copied at order time (immutable snapshot)
    image:         String   ← copied at order time
    price:         Number   ← server-validated price, not client price
    quantity:      Number
  }]
  shippingAddress: { street, city, state, zipCode, country }
  paymentMethod:   String   default: 'stripe'
  stripeSessionId: String
  itemsPrice:      Number
  shippingPrice:   Number
  taxPrice:        Number
  totalPrice:      Number
  status:          String   enum: ['pending','paid','processing','shipped','delivered','cancelled','refunded']
  paidAt:          Date
  deliveredAt:     Date
  timestamps:      true
}
```

**Why embedded snapshots?** Product names, prices and images are copied into the order at purchase time. If a product is later updated or deleted, historical orders remain accurate.

**Status transitions (enforced server-side):**
```
pending → paid → processing → shipped → delivered
                                              ↓
                                          refunded
       → cancelled (only from pending/paid)
```

**Indexes:** `{ user: 1, createdAt: -1 }`, `{ stripeSessionId: 1 }` (for fast webhook lookup)

---

### Review

```
Review {
  user:      ObjectId → User    required
  product:   ObjectId → Product required
  rating:    Number   1–5, required
  comment:   String   required
  timestamps: true
}
```

**Compound unique index:** `{ user: 1, product: 1 }` — one review per user per product.

**Hooks:** `post('save')` and `post('findOneAnd')` call the static method `recalcProductRatings()` which runs a MongoDB aggregation to recompute `ratings` and `numReviews` on the parent Product.

---

### Wishlist

```
Wishlist {
  user:     ObjectId → User     required, unique
  products: [ObjectId → Product]
  timestamps: true
}
```

Uses `$addToSet` to add and `$pull` to remove, preventing duplicates atomically.

---

### WebhookEvent (idempotency log)

```
WebhookEvent {
  stripeEventId: String   unique
  type:          String
  processedAt:   Date     default: now, TTL index expires after 30 days
}
```

**Purpose:** Stripe can deliver the same webhook event multiple times. Before processing any event, the handler attempts `WebhookEvent.create({ stripeEventId })`. If MongoDB throws a duplicate key error (11000), the event has already been processed and is silently skipped. This makes the webhook handler idempotent without any additional locking.

---

## 5. API Reference

Base URL: `/api/v1`

All protected routes require: `Authorization: Bearer <access_token>`

### Auth — `/api/v1/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | — | Create account, send welcome email |
| POST | `/login` | — | Login, issue access + refresh tokens |
| POST | `/logout` | — | Clear refresh token cookie |
| POST | `/refresh-token` | cookie | Rotate refresh token, issue new access token |
| POST | `/forgot-password` | — | Send password reset email |
| PATCH | `/reset-password/:token` | — | Reset password with token |

### Users — `/api/v1/users`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/me` | customer | Get own profile |
| PATCH | `/me` | customer | Update name/email/avatar |
| DELETE | `/me` | customer | Soft-delete own account |
| GET | `/` | admin | List all users (paginated) |
| GET | `/:id` | admin | Get user by ID |
| PATCH | `/:id` | admin | Update user (incl. role) |
| DELETE | `/:id` | admin | Soft-delete user |

### Products — `/api/v1/products`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | — | List products with filtering, sorting, search, pagination |
| GET | `/featured` | — | Featured products (homepage) |
| GET | `/:slug` | — | Single product by slug |
| POST | `/` | admin | Create product (with image upload) |
| PATCH | `/:id` | admin | Update product |
| DELETE | `/:id` | admin | Soft-delete product |
| DELETE | `/:id/images/:publicId` | admin | Remove a single product image from Cloudinary |

**Query parameters for GET /products:**

| Param | Example | Description |
|---|---|---|
| `search` | `?search=laptop` | Full-text search (MongoDB `$text`) |
| `category` | `?category=electronics` | Filter by category |
| `brand` | `?brand=apple` | Filter by brand |
| `price[gte]` | `?price[gte]=100` | Minimum price |
| `price[lte]` | `?price[lte]=500` | Maximum price |
| `sort` | `?sort=-ratings,price` | Sort fields (prefix `-` for desc) |
| `page` | `?page=2` | Page number (default 1) |
| `limit` | `?limit=12` | Items per page (default 12) |
| `fields` | `?fields=name,price,slug` | Projection — only return listed fields |

### Cart — `/api/v1/cart`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | customer | Get own cart |
| POST | `/` | customer | Add item (validates stock, snapshots price) |
| PATCH | `/:itemId` | customer | Update item quantity |
| DELETE | `/:itemId` | customer | Remove item |
| DELETE | `/` | customer | Clear entire cart |

### Orders — `/api/v1/orders`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | customer | Create order (server-side price validation) |
| GET | `/my` | customer | Own order history (paginated) |
| GET | `/my/:id` | customer | Own order detail |
| GET | `/` | admin | All orders (paginated, filterable) |
| PATCH | `/:id/status` | admin | Update order status |

### Payments — `/api/v1/payments`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/create-checkout-session` | customer | Create Stripe Checkout Session |
| POST | `/webhook` | — (Stripe signature) | Stripe event handler |
| GET | `/session-status` | customer | Check payment status by session ID |
| POST | `/refund` | admin | Issue Stripe refund |

### Reviews — `/api/v1/reviews`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | customer | Create review (verified purchase required) |
| GET | `/?product=<id>` | — | Get reviews for a product |
| DELETE | `/:id` | customer/admin | Delete review (own or admin) |

### Wishlist — `/api/v1/wishlist`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | customer | Get wishlist |
| POST | `/` | customer | Add product (`$addToSet`) |
| DELETE | `/:productId` | customer | Remove product (`$pull`) |

### Admin — `/api/v1/admin`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/analytics` | admin | Dashboard metrics (9 parallel aggregations) |
| GET | `/low-stock` | admin | Products with stock < 10 |
| GET | `/cache/stats` | admin | In-process cache statistics |
| DELETE | `/cache` | admin | Flush entire cache |

**Analytics response includes:**
- Total revenue, orders, users, products
- Revenue over last 12 months (chart data)
- Orders by status breakdown
- Top 5 products by revenue
- Recent 5 orders

---

## 6. Authentication Flow

### Token design

| Token | Lifetime | Storage | Purpose |
|---|---|---|---|
| Access token (JWT) | 15 minutes | Redux state (memory only) | Authenticate API requests |
| Refresh token (JWT) | 7 days | `httpOnly; Secure; SameSite=Strict` cookie | Obtain new access tokens |

Access tokens are **never stored in localStorage** — they live only in Redux memory and are lost on page refresh, at which point the silent refresh mechanism obtains a new one.

### Login flow

```
1. POST /auth/login  { email, password }
2. Server:
   a. Find user by email
   b. Compare password with bcrypt
   c. Sign access token (JWT, 15m)
   d. Sign refresh token (JWT, 7d)
   e. SHA-256 hash the refresh token → store in user.refreshTokenHash
   f. Set refresh token in httpOnly cookie
   g. Return access token in response body
3. Client:
   a. Store access token in Redux state (authSlice)
   b. Persist { token, user } to localStorage for session rehydration
   c. All subsequent requests: Authorization: Bearer <access_token>
```

### Silent refresh flow

```
1. Any API request returns 401 (access token expired)
2. Axios response interceptor catches the 401
3. If a refresh is already in flight:
   → Queue the failed request (resolve/reject callbacks)
4. If no refresh in flight:
   → POST /auth/refresh-token (sends cookie automatically)
   → Server validates refresh token:
       a. Verify JWT signature
       b. Find user by ID from token payload
       c. Hash incoming token → compare with user.refreshTokenHash
       d. MISMATCH → token reuse detected → clear all sessions (set hash to null)
       e. MATCH → issue new access token + new refresh token (rotation)
   → Store new access token in Redux
   → Retry all queued requests with new token
```

### Password reset flow

```
1. POST /auth/forgot-password { email }
   → Server generates a random 32-byte token
   → Stores SHA-256 hash + expiry (10min) on user document
   → Sends plain token in email link
   → Returns generic success message regardless of whether email exists (anti-enumeration)

2. PATCH /auth/reset-password/:token { password, confirmPassword }
   → Server hashes the incoming token
   → Finds user where passwordResetToken matches AND passwordResetExpires > now
   → Updates password (triggers bcrypt pre-save hook)
   → Clears reset token fields
   → Invalidates all refresh tokens (sets refreshTokenHash to null)
```

---

## 7. Stripe Payment Flow

ShopSphere uses **Stripe Checkout** (hosted page redirect), not embedded Elements.

### Checkout sequence

```
Customer clicks "Proceed to Pay"
    ↓
POST /api/v1/payments/create-checkout-session
    ↓
Server:
  1. Load order from DB, verify it belongs to requesting user
  2. Check if order already has an open Stripe session → reuse it
  3. Otherwise: call stripe.checkout.sessions.create({
       line_items: order.items.map(...),   ← prices from DB, not client
       mode: 'payment',
       success_url, cancel_url,
       metadata: { orderId }
     })
  4. Save stripeSessionId on order document
  5. Return { url } to frontend
    ↓
Frontend redirects browser to Stripe-hosted checkout page
    ↓
Customer completes payment on Stripe's page
    ↓
Stripe redirects to /order-success?session_id=...
    ↓
Frontend calls GET /payments/session-status?sessionId=...
    ↓
SIMULTANEOUSLY: Stripe sends webhook to /api/v1/payments/webhook
```

### Webhook handler (4 event types)

```
POST /api/v1/payments/webhook
  ↓
1. Verify Stripe signature (stripe.webhooks.constructEvent)
2. Check WebhookEvent collection for duplicate stripeEventId
   → If found: return 200 immediately (idempotent)
   → If not: insert record (unique index prevents races)
3. Switch on event type:

   checkout.session.completed
     → Find order by stripeSessionId
     → Set status: 'paid', paidAt: now
     → Decrement stock for each item
     → Send order confirmation email to customer
     → Clear user's cart

   checkout.session.expired
     → Find order by stripeSessionId
     → Set status: 'cancelled'

   payment_intent.payment_failed
     → Log failure (order remains 'pending', customer can retry)

   charge.refunded
     → Find order by stripeSessionId
     → Set status: 'refunded'
```

### Server-side price validation

The order creation endpoint (`POST /api/v1/orders`) re-fetches all product prices from MongoDB before calculating totals. The client-submitted prices are **completely ignored**. This prevents a user from manipulating the request body to pay less than the actual price.

---

## 8. Frontend Architecture

### Routing

```
/ (public)
├── /                     HomePage
├── /products/:slug       ProductDetailPage
├── /cart                 CartPage
├── /login                LoginPage
└── /register             RegisterPage

(Protected — redirects to /login if not authenticated)
├── /checkout             CheckoutPage
├── /order-success        OrderSuccessPage
├── /orders               OrderHistoryPage
├── /orders/:id           OrderDetailPage
├── /profile              ProfilePage
└── /wishlist             WishlistPage

(Admin — redirects to / if not admin role)
├── /admin                AdminDashboard
├── /admin/products       AdminProducts
├── /admin/orders         AdminOrders
└── /admin/users          AdminUsers

* → NotFoundPage
```

All pages are **code-split** with `React.lazy` + `Suspense`. Each page is its own JS chunk, downloaded only when the user navigates to that route.

### Axios interceptors (`api/axios.js`)

**Request interceptor:** Reads the access token from Redux store and attaches it as `Authorization: Bearer <token>` to every outgoing request.

**Response interceptor:** Catches 401 responses. If a token refresh is already in flight, the failed request is pushed to a queue (`failedQueue`) with its resolve/reject callbacks. When the refresh completes, all queued requests are retried. If no refresh is in flight, it initiates one via `POST /auth/refresh-token`. This pattern ensures that when multiple API calls fire simultaneously and all get 401s, only one token refresh request is made.

### Session rehydration

On app mount, `App.jsx` dispatches `loadUser()` which reads `{ token, user }` from `localStorage` and hydrates the Redux auth state. This restores the user's session after a page refresh without requiring re-login (as long as the refresh token cookie is still valid).

### Component highlights

**`ProductCard`** — wrapped in `React.memo`. Only re-renders when the `product` prop changes or the user's wishlist membership for that product changes. Without memo, every Redux state update (e.g. cart badge increment) would re-render all 12 cards simultaneously.

**`LazyImage`** — uses `IntersectionObserver` to detect when an image placeholder enters the viewport (200px margin). Only then is the `<img>` tag rendered. Shows a blur-up fade-in transition. Provides more control than native `loading="lazy"` which uses a fixed browser-defined threshold.

**`ProductFilters`** — all filter state is synced to URL search params (`URLSearchParams`). Filters persist on page refresh and are shareable as links.

**`Modal`** — traps focus, closes on `Escape` key and backdrop click, uses `ReactDOM.createPortal` to render outside the component tree.

**`Pagination`** — ellipsis logic: always shows first, last, current, and two pages around current. Renders `...` for gaps.

**`StarRating`** — supports both display mode (read-only) and interactive mode (for submitting reviews).

---

## 9. Redux State Management

### Store slices

```
store
├── auth
│   ├── user          { _id, name, email, role, avatar }
│   ├── token         string (access token, memory only)
│   ├── isAuthenticated boolean
│   ├── loading       boolean
│   └── error         string | null
│
├── products
│   ├── items         Product[]
│   ├── featured      Product[]
│   ├── current       Product | null  (product detail page)
│   ├── pagination    { page, pages, total }
│   ├── loading       boolean
│   └── error         string | null
│
├── cart
│   ├── items         CartItem[]
│   ├── totalPrice    number
│   ├── itemCount     number
│   ├── loading       boolean
│   └── error         string | null
│
├── orders
│   ├── list          Order[]        (order history)
│   ├── current       Order | null   (order detail)
│   ├── pagination    { page, pages, total }
│   ├── checkoutUrl   string | null  (Stripe redirect URL)
│   ├── loading       boolean
│   └── error         string | null
│
└── wishlist
    ├── items         Product[]
    ├── loading       boolean
    └── error         string | null
```

### Thunks (async actions)

Each slice uses `createAsyncThunk` with `builder.addCase` for `pending / fulfilled / rejected` transitions. The pattern is consistent across all slices:

```js
// pending  → loading: true, error: null
// fulfilled → update state with payload
// rejected  → loading: false, error: action.payload (message string)
```

**Optimistic update example (wishlist toggle):**
```
1. dispatch(toggleWishlist(productId))
2. Immediately update local state (add or remove from items array)
3. Make API call in background
4. If API fails → revert state and show error toast
```

---

## 10. Security

### Backend security layers

| Layer | Implementation |
|---|---|
| HTTPS | Enforced by Render (TLS termination) and Vercel |
| Helmet | Sets 11 security HTTP headers (CSP, HSTS, X-Frame-Options, etc.) |
| CORS | Explicit origin whitelist via `CLIENT_URL` env var. Credentials allowed. |
| Rate limiting | Auth routes: 20 req/15min. All routes: 200 req/15min. |
| MongoDB injection | `express-mongo-sanitize` strips `$` and `.` from request bodies |
| XSS | `xss-clean` sanitizes HTML from request bodies and query strings |
| HTTP Parameter Pollution | `hpp` removes duplicate query string parameters |
| Input validation | Zod schemas on all mutation endpoints — returns structured field errors |
| Password hashing | bcrypt with salt rounds = 12 |
| JWT secrets | Separate secrets for access and refresh tokens, minimum 64 chars recommended |
| Refresh token storage | Only SHA-256 hash stored in DB — plain token only in httpOnly cookie |
| Token reuse detection | Hash mismatch on refresh → clear all user sessions immediately |
| Admin access | `restrictTo('admin')` middleware on all admin routes |
| Soft deletes | Users and Products set `isActive: false` — never hard-deleted |
| Webhook verification | `stripe.webhooks.constructEvent` verifies Stripe signature on every webhook |
| Webhook idempotency | `WebhookEvent` unique index prevents duplicate processing |
| Server-side price validation | Order creation re-fetches prices from DB — client prices ignored |
| Image upload limits | Multer: 5 MB max, `image/*` MIME type only |

### Frontend security

- Access token stored in **Redux memory only** (lost on refresh, not in localStorage)
- Refresh token in **httpOnly cookie** — inaccessible to JavaScript
- No sensitive data logged to the console in production
- `VITE_` prefix only on the API URL — no secrets ever in frontend env vars

---

## 11. Performance

### Backend

**Gzip compression** — `compression` middleware compresses all responses. Typically reduces JSON payload size by 60-80%.

**In-process TTL cache** (`utils/cache.js`) — a `Map`-based cache with per-entry TTL. Products list and featured products are cached for 5 minutes. Cache is busted by prefix (`/api/v1/products`) whenever a product is created, updated, or deleted. Admin endpoints for cache stats and flush are provided.

**`.lean()` on read queries** — Mongoose returns plain JavaScript objects instead of full Mongoose Document instances. Skips hydration, virtuals, and change tracking. ~40% faster for read-only endpoints like `getAllProducts`.

**Selective field projection** — `APIFeatures.limitFields()` supports `?fields=name,price,slug` to return only needed fields.

**Database indexes** — All frequently-queried fields are indexed. Text index on products enables fast full-text search. Compound indexes cover common filter + sort combinations.

**Mongoose query middleware with `adminQuery` option** — Admin queries bypass the `isActive: true` filter without a separate query path, keeping controller code clean.

### Frontend

**Code splitting** — Every page is a separate JS chunk via `React.lazy`. Users only download code for pages they visit.

**Manual chunk grouping** (Vite) — vendor libraries are split into logical groups:
- `react-core` — react, react-dom, react-router-dom
- `redux` — @reduxjs/toolkit, react-redux
- `charts` — recharts (only downloaded by admin users)
- `ui-utils` — axios, react-hook-form, react-hot-toast

**`React.memo`** — `ProductCard` only re-renders when its `product` prop or wishlist membership changes. Prevents all 12+ cards from re-rendering on unrelated state updates.

**`useCallback`** on event handlers inside memoized components — stable function references prevent child button re-renders.

**`useDebounce`** (400ms) — Search input changes are debounced before updating URL params and triggering API calls.

**`LazyImage`** — Images load only when they are 200px from entering the viewport, via `IntersectionObserver`. Prevents loading offscreen images on initial page load.

**Asset caching** — `vercel.json` sets `Cache-Control: public, max-age=31536000, immutable` on `/assets/*` (Vite hashed filenames). Browsers cache JS/CSS bundles for 1 year.

---

## 12. Running Locally

### Option A — Docker (recommended, zero dependencies)

Requires only [Docker Desktop](https://www.docker.com/products/docker-desktop/).

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/shopsphere.git
cd shopsphere

# 2. Create backend .env
cp backend/.env.example backend/.env
# Edit backend/.env:
#   MONGODB_URI = mongodb://mongo:27017/shopsphere  ← use container hostname
#   Fill in STRIPE_SECRET_KEY, CLOUDINARY_* values

# 3. Start everything
docker compose up --build

# 4. Load demo data (in a second terminal)
docker compose exec api npm run seed
```

| Service | URL |
|---|---|
| React app | http://localhost:5173 |
| API | http://localhost:5000/api/v1 |
| MongoDB UI | http://localhost:8081 |

```bash
# Stop and keep data
docker compose down

# Stop and wipe database
docker compose down -v

# Rebuild after package.json changes
docker compose up --build
```

### Option B — Manual (no Docker)

Requires Node.js 20+, MongoDB 7 running locally.

```bash
# Terminal 1 — Backend
cd backend
cp .env.example .env
# Edit .env: MONGODB_URI=mongodb://localhost:27017/shopsphere
npm install
npm run dev

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev
```

### Stripe webhooks (both options)

Install the [Stripe CLI](https://stripe.com/docs/stripe-cli), then in a separate terminal:

```bash
stripe login
stripe listen --forward-to http://localhost:5000/api/v1/payments/webhook
# Copy the whsec_... secret printed by the CLI into backend/.env as STRIPE_WEBHOOK_SECRET
# Then restart the API
```

---

## 13. Scripts

All scripts run from the `backend/` directory.

```bash
npm start              # Production — node src/server.js
npm run dev            # Development — nodemon with auto-restart
npm run lint           # ESLint on src/
npm run seed           # Import 3 users + 8 demo products
npm run seed:destroy   # Remove all seeded data
npm run verify:indexes # Check all indexes exist (used in CI)
```

### Seed data

`npm run seed` creates:

| Role | Email | Password |
|---|---|---|
| admin | admin@shopsphere.com | Password123! |
| customer | john@example.com | Password123! |
| customer | jane@example.com | Password123! |

8 demo products across Electronics, Clothing, and Home categories with Unsplash images.

---

## 14. Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the complete step-by-step guide.

### Quick overview

| Step | Action |
|---|---|
| 1 | Create MongoDB Atlas cluster → get connection string |
| 2 | Create Cloudinary account → get cloud name + API keys |
| 3 | Get Stripe test keys → create webhook endpoint |
| 4 | Deploy backend to Render → set all environment variables |
| 5 | Deploy frontend to Vercel → set `VITE_API_URL` |
| 6 | Configure GitHub Actions secrets for CI/CD |

### CI/CD pipelines

**Backend** (`.github/workflows/backend.yml`):
- Triggers on push/PR to `main` or `develop` when `backend/**` files change
- Jobs: `lint` → `test` (with MongoDB service container) → `deploy` (Render, main only)

**Frontend** (`.github/workflows/frontend.yml`):
- Triggers on push/PR to `main` or `develop` when `frontend/**` files change
- Jobs: `lint` → `build` (bundle size check) → `preview` (Vercel preview on PRs) → `deploy` (Vercel production, main only)

---

## 15. Environment Variables

### Backend (`backend/.env`)

```env
# Server
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/shopsphere

# JWT — use two different 64-char random strings
JWT_ACCESS_SECRET=
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=
JWT_REFRESH_EXPIRES_IN=7d

# Frontend URL (for CORS)
CLIENT_URL=http://localhost:5173

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Email (Mailtrap recommended for dev: mailtrap.io)
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=ShopSphere <noreply@shopsphere.com>
```

Generate JWT secrets:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5000/api/v1
```

> Only `VITE_*` prefixed variables are exposed to the browser bundle. Never put secrets here.

---

## Phase Completion Summary

| Phase | Description | Status |
|---|---|---|
| 1 | System architecture, DB schema design, API design, folder structure | Complete |
| 2 | Full Express REST API — models, auth, CRUD, validation, error handling | Complete |
| 3 | Full React frontend — pages, Redux slices, routing, components | Complete |
| 4 | Stripe deep integration — idempotent webhooks, refunds, session reuse | Complete |
| 5 | Performance — compression, TTL cache, lean queries, code splitting, LazyImage | Complete |
| 6 | Deployment — Dockerfile, Docker Compose, Render, Vercel, GitHub Actions CI/CD | Complete |
