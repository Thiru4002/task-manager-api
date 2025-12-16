# 🧩 TASK-MANAGER API

A structured REST API built with **Node.js, Express, and MongoDB** that models **real-world project collaboration**.
This project focuses on **projects, team membership, and task assignment**, designed as a **learning-oriented backend** and suitable for **portfolio and interview demonstration**.

---

## 📘 API Documentation (Swagger UI)

👉 `/api-docs`
(Available after running the project locally or via deployed URL)

---

## 🚀 Core Concept

The **Task Manager API** is built around how teams work in real applications:

* Users create **projects**
* Other users can **discover projects** and request to join
* Project owners **approve or reject** join requests
* Approved members receive **tasks assigned by the project owner**

This system reflects **real-world workflows** used in corporate project management tools.

---

## 👥 User & Project Flow

1. User registers and logs in
2. Any user can create a project (becomes the **project owner**)
3. Users can view/search available projects
4. Users send a **join request** to a project
5. Project owner (or admin):

   * approves → user becomes a project member
   * rejects → request is closed
6. Project owner assigns **tasks to project members**
7. Members can view and manage their assigned tasks

---

## 🔁 Join Request Lifecycle (Key Feature)

* Only **one pending request** per user per project
* Users **cannot re-request while pending**
* After **approval or rejection**, users **can request again**
* Only **project owner or admin** can take action

This logic is implemented using:

* request status lifecycle (`pending`, `approved`, `rejected`)
* role-based authorization
* controller-level validation

---

## 🚀 Features

### 📌 Authentication & Authorization

* User registration & login
* Secure password hashing using **bcrypt**
* JWT-based authentication
* Protected routes using middleware
* Role-based access control (admin / user)


### 📁 Project Management

* Create & manage projects
* View and search projects (home page listing)
* Project ownership logic
* Project membership handling
* Image handling using Cloudinary


### 👥 Project Membership

* Send join requests
* Approve / reject join requests
* Membership validation
* Request lifecycle handling

### ✅ Task Management

* Assign tasks to project members
* View tasks by assigned user
* Ownership-based task control

### 🔐 Security & Middleware

* Authentication middleware
* Authorization checks
* Global error handling
* Request validation
* Clean separation of concerns

---

## 🛠 Tech Stack

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT & bcrypt
* Swagger (OpenAPI)

---

## 📁 Project Structure

```
task-manager-api/
│
├── src/
│ ├── config/
│ ├── controllers/
│ ├── middlewares/
│ ├── models/
│ ├── routes/
│ ├── docs/          # Swagger files
│ ├── app.js
│ └── server.js
│
├── package.json
├── .gitignore
└── README.md
```

---

## 🎯 Purpose of This Project

This project was built as part of my **backend development learning journey**.

It demonstrates practical understanding of:

* REST API architecture
* JWT authentication & authorization
* Project-user relationships
* Role-based access control
* Request lifecycle management
* MongoDB schema design & indexing
* Middleware usage
* Swagger API documentation
* Debugging real backend issues

This is **not tutorial code** — it reflects iterative learning and real-world problem solving.

---

## 🚀 Run Locally

```bash
npm install
npm run dev
```

### Environment Variables (`.env`)

```env
PORT=5000
MONGO_URI=your_mongodb_connection
JWT_SECRET=your_jwt_secret
CLOUDINARY_URL=your_cloudinary_url
```

---

## 📧 Contact

If you have suggestions or feedback, feel free to reach out via GitHub.
