# Trading-Platform
A full-stack trading platform designed using java ,springboot,spring security to simulate stock/crypto trading with real-time data, portfolio management, and analytical tools. This project demonstrates modern software development practices, including clean architecture, responsive UI design, and integration with APIs for live market updates.
## 🚀 Features  
- 📊 **Real-Time Market Data** – Fetch and display live stock/crypto prices  
- 💼 **Portfolio Management** – Track holdings, profit/loss, and transaction history  
- 🛒 **Buy & Sell Orders** – Place simulated trades instantly  
- 📈 **Charts & Analytics** – Interactive charts with technical indicators  
- 🔐 **User Authentication** – JWT-based login and session handling  
- 📱 **Responsive UI** – Frontend built with ReactJS for smooth UX  

## 💡 Run locally (frontend + backend)

1. Backend (Spring Boot)

	- From project root run:

```bash
./mvnw spring-boot:run
```

	- Backend defaults to port `8090` (see `src/main/resources/application.properties`).

2. Frontend (Vite / React)

	- Change directory to frontend:

```bash
cd trading-frontend/trading-frontend
```

	- Copy `.env.example` to `.env.local` and edit if needed (the file is ignored by git):

```bash
cp .env.example .env.local
# edit .env.local if your backend runs on a different port
```

	- Start dev server:

```bash
npm install
npm run dev
```

The frontend reads the API base URL from `VITE_API_BASE` (defaults to `http://localhost:8090`). The backend already allows CORS from `http://localhost:5173`.

If you prefer not to set env variables, the frontend will default to `http://localhost:8090`.
