# 🚀 Raghav's Portfolio Backend API

High-performance, modern, and production-ready Node.js & Express REST API service for Raghav Singh's Portfolio.

Built with **ES Modules**, **MongoDB / Mongoose**, **Nodemailer**, and **Google Gemini AI**.

---

---

## ⚡ Quick Start

### 1. Start Development Server (with auto-reload)

```bash
npm run dev
```

### 2. Start Production Server

```bash
npm start
```

Default local URL: `http://localhost:5000`

---

## ⚙️ Environment Configuration (`.env`)

| Variable         | Description                                      | Default                                       |
| :--------------- | :----------------------------------------------- | :-------------------------------------------- |
| `PORT`           | Port number for Express server                   | `5000`                                        |
| `NODE_ENV`       | Environment (`development` or `production`)      | `development`                                 |
| `CLIENT_URL`     | Allowed frontend origins (comma-separated)       | `http://localhost:3000,http://localhost:5173` |
| `MONGODB_URI`    | MongoDB Connection String (Atlas URI or Local)   | `mongodb://127.0.0.1:27017/portfolio_db`      |
| `EMAIL_USER`     | Gmail address for sending emails                 | `your-email@gmail.com`                        |
| `EMAIL_PASS`     | Gmail 16-character App Password                  | `xxxx xxxx xxxx xxxx`                         |
| `EMAIL_RECEIVER` | Email address where you receive contact messages | `your-personal-email@gmail.com`               |
| `GEMINI_API_KEY` | Google Gemini API Key for AI chatbot             | Get free key at Google AI Studio              |

> [!NOTE]
> Even if MongoDB or Email credentials are not yet configured, the server **will not crash**. It runs with graceful in-memory fallbacks and logs messages clearly in the console during development.

---

## 📡 API Endpoints Reference

### 1. Health & Diagnostics

- **`GET /health`** or **`GET /api/v1/health`**
  - Returns uptime, database status, memory usage, and server state.

### 2. Contact Inquiries

- **`POST /api/v1/contact`** (Rate limited: 5 requests / 15 mins)
  - Submits an inquiry, saves to MongoDB, sends email notification to you, and sends auto-reply to the visitor.
  - **Payload:**
    ```json
    {
      "name": "Jane Doe",
      "email": "jane@example.com",
      "subject": "Freelance Opportunity",
      "message": "Hi Raghav, I love your work! Let's talk."
    }
    ```
- **`GET /api/v1/contact?page=1&limit=10&status=unread`**
  - Lists received contact messages with pagination.
- **`GET /api/v1/contact/:id`**
  - Fetches message details and marks status as `read`.
- **`DELETE /api/v1/contact/:id`**
  - Deletes a contact message.

### 3. AI Chatbot Assistant (For `AIChatWidget`)

- **`POST /api/v1/chat/message`** (Rate limited: 30 requests / 10 mins)
  - Generates intelligent answers about Raghav's skills, projects, and contact details.
  - **Payload:**
    ```json
    {
      "message": "What is Raghav's primary tech stack?"
    }
    ```
  - **Response:**
    ```json
    {
      "success": true,
      "message": "AI response generated",
      "data": {
        "reply": "Raghav specializes in Full-Stack Engineering with Next.js, React, Node.js, Express, MongoDB, TypeScript, and 3D web experiences using Three.js & Tailwind CSS!",
        "source": "gemini"
      }
    }
    ```

### 4. Projects (Optional dynamic CMS)

- **`GET /api/v1/projects`**
  - Retrieves featured portfolio projects.
- **`GET /api/v1/projects/:slug`**
  - Retrieves a single project by its slug.

---

## 🔗 Connecting with Next.js Frontend

In your frontend project (`portfolio`), you can call these endpoints:

```typescript
// Example: Sending a message from Contact.tsx
const response = await fetch("http://localhost:5000/api/v1/contact", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name, email, subject, message }),
});
const result = await response.json();

// Example: Sending question from AIChatWidget.tsx
const chatRes = await fetch("http://localhost:5000/api/v1/chat/message", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ message: userQuestion }),
});
const chatData = await chatRes.json();
console.log(chatData.data.reply);
```
