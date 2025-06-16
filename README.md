[![Netlify Status](https://api.netlify.com/api/v1/badges/f6fb6908-f42b-4f57-ae8f-e714e88ad3bb/deploy-status)](https://app.netlify.com/projects/tubular-begonia-7b166d/deploys)
# 🔥 DIB.money

💸 Did I Burn Money? - An AI-powered web application that brutally evaluates your purchase decisions and assigns a **"stupidity score"** from 0-100.

---

## 🤔 What it Does

DIB.money helps you determine if your recent purchase was a smart move or a financial blunder. Simply enter what you bought, answer AI-generated questions about your purchase, and receive an **honest assessment** with a numerical stupidity score from **"The Idiot Auditor"**.

---

## 🏗️ Architecture

* **🎨 Frontend:** Static HTML/CSS/JavaScript site
* **⚡ Backend:** Serverless Netlify Functions
* **🤖 AI:** Google Generative AI for question generation and assessment
* **🗄️ Database:** Neon PostgreSQL for storing assessment history

---

## 🚀 How it Works

1.  **📝 Product Input:** User enters the product they purchased
2.  **❓ Question Generation:** AI generates 5 probing questions about the purchase
3.  **🔍 Assessment:** User answers questions, AI analyzes responses and calculates stupidity score
4.  **📊 Results:** Display score (0-100) with witty assessment text

---

## 🛠️ API Endpoints

* `POST /generate-questions` - 🎯 Generate assessment questions for a product
* `POST /assess-idiocy` - 🧠 Process answers and calculate stupidity score
* `GET /get-history` - 📚 Retrieve recent assessment history

---

## 🔧 Environment Variables
```sh
AI_API_KEY=your_google_ai_api_key
AI_MODEL=your_ai_model_name
```
---

## 💻 Tech Stack

* **🎨 Frontend:** Vanilla JavaScript, CSS, HTML
* **⚡ Backend:** Netlify Functions (Node.js)
* **🤖 AI:** Google Generative AI (`@google/generative-ai`)
* **🗄️ Database:** Neon PostgreSQL (`@netlify/neon`)
* **🔨 Build:** esbuild, drizzle-kit for database management

---

## ✨ Features

* 🎯 AI-powered question generation tailored to specific products
* 😈 Witty, honest assessments with numerical scoring
* 📈 Purchase history tracking
* 📱 Responsive design with dark theme
* ☕ Ko-fi integration for supporting AI costs

---

## 📝 Notes

The application uses a serverless architecture deployed on Netlify, with all backend logic handled through three main functions. The AI generates contextual questions and provides assessments in a cynical, humorous tone as **"The Idiot Auditor"**. All user inputs are validated with character limits (60 characters max) to prevent abuse.

