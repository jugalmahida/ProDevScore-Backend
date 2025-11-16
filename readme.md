# ProDevScore Backend API ⚡

<div align="center">
  
  **AI-Powered Code Analysis Engine**
  
  RESTful API backend for analyzing GitHub repositories and generating developer performance scores.
  
  [![Node.js](https://img.shields.io/badge/Node.js-20+-green)](https://nodejs.org/)
  [![Express](https://img.shields.io/badge/Express-5.1-blue)](https://expressjs.com/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-8.0-green)](https://www.mongodb.com/)
  [![OpenAI](https://img.shields.io/badge/OpenAI-Agents-412991)](https://openai.com/)
  
  [Main Repository](https://github.com/jugalmahida/prodevscore-backend) • [Frontend](https://github.com/jugalmahida/prodevscore-frontend) • [Report Bug](https://github.com/jugalmahida/prodevscore-backend/issues)
  
</div>

## 🚀 Overview

The ProDevScore Backend is a high-performance Node.js API that powers the AI-driven code analysis and get contributor's score. It handles:

- 🤖 **AI Code Analysis** - Integration with OpenAI Agents SDK
- 📊 **GitHub Integration** - Fetches repository data, commits, and code changes
- 🔐 **Authentication & Authorization** - JWT-based secure access
- 💾 **Database Management** - MongoDB for persistent storage
- 📧 **Email Services** - Automated notifications via Resend
- 🔄 **Real-time Updates** - WebSocket support with Socket.io

---

## 🛠️ Tech Stack

| Category           | Technology          | Version       |
| ------------------ | ------------------- | ------------- |
| **Runtime**        | Node.js             | 20+           |
| **Framework**      | Express.js          | 5.1.0         |
| **Database**       | MongoDB (Mongoose)  | 8.18.1        |
| **AI SDK**         | OpenAI Agents SDK   | 0.3.0         |
| **Authentication** | JWT + Bcrypt        | 9.0.2 / 6.0.0 |
| **Validation**     | Zod                 | 3.25.76       |
| **HTTP Client**    | Axios               | 1.12.1        |
| **Email**          | Resend              | 6.1.0         |
| **Real-time**      | Socket.io           | 4.8.1         |
| **Middleware**     | CORS, Cookie Parser | Latest        |

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── agent/              # AI agent configurations
│   │   ├── openai-agent.js
│   │   └── gemini-agent.js
│   ├── config/             # Configuration files
│   │   ├── database.js
│   │   ├── openai.js
│   │   └── constants.js
│   ├── controllers/        # Route controllers
│   │   ├── auth.controller.js
│   │   ├── github.controller.js
│   │   ├── analysis.controller.js
│   │   └── user.controller.js
│   ├── middleware/         # Custom middleware
│   │   ├── auth.middleware.js
│   │   ├── error.middleware.js
│   │   ├── validation.middleware.js
│   │   └── rateLimit.middleware.js
│   ├── models/             # Mongoose schemas
│   │   ├── User.model.js
│   │   ├── Repository.model.js
│   │   ├── Analysis.model.js
│   │   └── Contributor.model.js
│   ├── routes/             # API routes
│   │   ├── auth.routes.js
│   │   ├── github.routes.js
│   │   ├── analysis.routes.js
│   │   └── user.routes.js
│   ├── utils/              # Helper functions
│   │   ├── github.utils.js
│   │   ├── ai-analyzer.utils.js
│   │   ├── email.utils.js
│   │   └── validation.utils.js
│   └── index.js            # Application entry point
├── .env                    # Environment variables
├── .gitignore
├── package.json
└── package-lock.json
```

## 🔒 Authentication Flow

ProDevScore uses **JWT (JSON Web Tokens)** with HTTP-only cookies:

1. User registers/logs in → Server generates JWT (Access & Refresh Token)
2. JWT stored in HTTP-only cookie (secure, not accessible via JS)
3. Middleware validates JWT on protected routes
4. Refresh Token expires after 3 days

---

## 📊 Database Schema

## 🛡️ Security Features

- ✅ **Password Hashing** - Bcrypt with salt rounds
- ✅ **JWT Authentication** - Secure token-based auth
- ✅ **HTTP-only Cookies** - XSS protection
- ✅ **CORS Configuration** - Restrict origins
- ✅ **Rate Limiting** - Prevent API abuse
- ✅ **Input Validation** - Zod schema validation
- ✅ **MongoDB Injection Protection** - Mongoose sanitization

---

## 📧 Contact

**Jugal Mahida** - [@jugalmahida](https://twitter.com/jugalmahida07)

Backend Maintainer: [github.com/jugalmahida](https://github.com/jugalmahida)

Project Link: [https://github.com/jugalmahida/prodevscore-backend](https://github.com/jugalmahida/prodevscore-backend)

---

## ⭐ Give a Star!

If you find **ProDevScore Backend** helpful, please give it a star! Your support helps the project grow.

⭐ **[Star this repository](https://github.com/jugalmahida/prodevscore-backend)**

---
