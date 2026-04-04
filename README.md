# 🌌 KANILA — Premium E-Commerce Experience

[![Project Status: Active](https://img.shields.io/badge/Project%20Status-Active-brightgreen.svg)](https://github.com/trinhanh2604bn/KANILA)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Backend: Node.js](https://img.shields.io/badge/Backend-Node.js%20v18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Frontend: Angular](https://img.shields.io/badge/Frontend-Angular%20v20-DD0031?logo=angular&logoColor=white)](https://angular.io/)
[![Database: MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)

**KANILA** is a state-of-the-art, full-stack e-commerce ecosystem designed for premium beauty and skincare retail. It features a personalized customer storefront, a sophisticated administrative dashboard, and a robust backend API tailored for high-performance commerce operations.

---

## 🏗️ Architecture Overview

The repository is organized into three primary modules:

- **`/backend`**: Express.js & MongoDB API service handling core business logic, authentication, and data persistence.
- **`/client`**: High-conversion Angular storefront for customers, featuring personalized skin profiling and premium discovery.
- **`/admin`**: Centralized operational dashboard for order management, inventory control, and real-time collaboration.

---

## ✨ Key Features

### 🛒 Customer Storefront (`/client`)
- **Personalized Skin Profiling**: Dynamic assessment tools to tailor product recommendations to individual user needs.
- **Advanced Product Catalog**: High-performance filtering by brand, category, and attributes with smooth transitions.
- **Voucher System**: Premium, ticket-style coupon aesthetics with real-time validation.
- **Seamless Checkout**: Streamlined multi-step workflow for payments and shipment tracking.

### 🛡️ Administration Suite (`/admin`)
- **Unified Operations**: Integrated management of Orders, Payments, and Shipments in a single view.
- **Real-time Collaboration**: Presence indicators, activity feeds, and contextual commenting for administrative teams.
- **Inventory & Catalog Management**: Rich tools for managing complex product variants and recursive category trees.

---

## 🚀 Technical Stack

### Backend
- **Node.js & Express**: Scalable API architecture.
- **Mongoose & MongoDB**: Flexible data modeling with automated schema migrations.
- **JWT & Bcrypt**: Secure token-based authentication and industry-standard password hashing.
- **Nodemailer**: Automated transactional email system.

### Frontend (Client & Admin)
- **Angular 20**: The latest reactive platform for high-performance web applications.
- **Bootstrap 5.3**: Responsive design with a customized premium aesthetic.
- **RxJS**: Sophisticated state management and event handling.
- **Swiper.js**: Interactive, mobile-optimized product galleries.

---

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18.x or higher)
- MongoDB (Local instance or Atlas connection string)
- Angular CLI (`npm install -g @angular/cli`)

### 1. Backend Setup
```bash
cd backend
npm install
# Configure your environment
cp .env.example .env
# Start the development server
npm run dev
```

### 2. Frontend Setup (Client)
```bash
cd client
npm install
ng serve
```
*Access the storefront at `http://localhost:4200`*

### 3. Admin Dashboard Setup
```bash
cd admin
npm install
ng serve
```
*Access the admin panel at `http://localhost:4201` (default)*

---

## 🧪 Database & Seeding Tools

The backend includes several scripts to quickly populate your development environment:

- **`npm run seed:admin`**: Initialize the default administrative account.
- **`npm run seed:data`**: Populate the database with sample products and orders.
- **`npm run seed:categories:makeup`**: Generate the complex recursive category tree for makeup.
- **`npm run seed:brands`**: Import brand metadata.
- **`npm run cleanup:customers`**: Data integrity tool for removing invalid customer records.

---

## 📝 License
This project is licensed under the **ISC License**.

---

<div align="center">
  <sub>Built with ❤️ for the KANILA Ecosystem</sub>
</div>
