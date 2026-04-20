# 🚀 PlanSync — Collaborative Trip Planning Platform

## 🌍 Overview

**PlanSync** is a modern, collaborative web application designed to simplify group trip planning. It enables users to **co-create itineraries, manage budgets, and collaborate in real-time** using a structured role-based system.

Unlike traditional planning tools, PlanSync focuses on **decision clarity, accountability, and transparency** within group environments.

---

## 🎯 Problem Statement

Planning trips in groups often leads to:

* Confusion in decision-making
* Lack of clarity in itinerary
* Unequal financial contributions
* Poor coordination among members

PlanSync solves this by providing:

✅ Structured collaboration
✅ Role-based permissions
✅ Transparent budgeting
✅ Finalized itinerary system

---

## 💡 Key Features

### 👥 1. Role-Based Collaboration System

Three hierarchical roles:

| Role           | Permissions                                    |
| -------------- | ---------------------------------------------- |
| **Owner** | Full control, finalize itinerary, manage roles |
| **Editor**      | Edit itinerary, manage activities              |
| **Viewer**     | Suggest ideas, participate in discussions      |

* Dynamic role updates
* Controlled access system
* Prevents conflicts in decision-making

---

### 🗺️ 2. Itinerary Management System

* Day-wise itinerary creation
* Collaborative editing
* Finalization feature (lock mechanism)
* Clear visual structure

👉 Ensures one **final agreed plan** for all members

---

### 💬 3. Discussion Panel

* Real-time idea sharing
* Message-based collaboration
* Keeps planning organized and contextual

---

### 💰 4. Smart Budget Planner

* Predefined expense categories:

  * Travel
  * Stay
  * Food
  * Sightseeing
  * Miscellaneous

* Automatic calculations:

  * Total trip cost
  * Per-person contribution

👉 Promotes **financial transparency**

---

### 🎨 5. Premium UI/UX (Glassmorphism + Dark Mode)

* Modern glassmorphism design
* Fully responsive layout
* Dark/Light theme toggle
* Smooth transitions & animations

---

### ⚙️ 6. Advanced React Architecture

* Custom Hooks:

  * `usePlan`
  * `useRole`
  * `useBudget`
  * `useFirestoreSync`
  * `useToggle`
  * `useDebounce`

* Context API for global state

* Optimized rendering using `useMemo`

👉 Clean, scalable, production-ready structure

---

## 🛠️ Tech Stack

### Frontend:

* React (Vite)
* Tailwind CSS

### Backend (BaaS):

* Firebase Authentication
* Firestore Database

### State Management:

* React Context API
* Custom Hooks

---

## 🏗️ Project Structure

```
src/
│
├── components/
├── pages/
├── hooks/
├── context/
├── services/
└── utils/
```

---

## 🔐 Authentication

* Email/Password login
* Google Sign-In
* Protected routes

---

## 🔄 CRUD Operations

* Create, update, delete plans
* Manage members
* Edit itinerary
* Manage budget

---

## 📊 Real-World Impact

PlanSync is designed for:

* Student trips
* Friend groups
* Travel planning communities

It ensures:

✔ Clear ownership
✔ Structured planning
✔ Financial clarity
✔ Reduced conflicts

---

## 🧠 Design Philosophy

> “Think like a user, not just a developer.”

* Simplicity over clutter
* Logic over decoration
* Collaboration over isolation

---

## 🎥 Demo

*(Add your demo video link here)*

---

## 🌐 Live Deployment

*(https://plan-sync-by-manas.netlify.app/)*

---

## ⚙️ Setup Instructions

```bash
# Clone the repo
git clone https://github.com/your-username/plansync.git

# Install dependencies
npm install

# Run the app
npm run dev
```

---

## 📌 Future Improvements

* Payment integration
* Notifications system
* Export itinerary as PDF
* AI-assisted suggestions (backend-supported)

---

## 🎤 Key Learnings

* Building scalable React architecture
* Role-based access control
* Real-time data handling
* UI/UX design thinking
* Handling real-world constraints

---

## 🧑‍💻 Author

**Manas**

---

## ⭐ Final Note

> “This project is not just an assignment — it represents a real-world solution designed with scalability, usability, and collaboration in mind.”

---

## 🙌 Acknowledgements

* Firebase
* React Community
* Tailwind CSS

---
