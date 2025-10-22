
- Handles secure transactions, smart contracts, and decentralized identity
- Ensures transparency and trust between buyers and sellers

### 🔹 Database
- Uses **MongoDB**
- Stores user profiles, product listings, transaction logs, and reviews

## 🗂 Folder Structure Overview

Lovitti-Agro-Mart/
├── frontend/               # React.js frontend application
│   ├── public/             # Static assets
│   └── src/                # React components, pages, and styles
│       ├── components/     # Reusable UI components
│       ├── pages/          # Route-based pages
│       └── assets/         # Images, icons, etc.

├── backend/                # Node.js + Express backend
│   ├── controllers/        # Business logic for API endpoints
│   ├── models/             # Mongoose schemas for MongoDB
│   ├── routes/             # Express route handlers
│   ├── middleware/         # Auth and validation middleware
│   └── server.js           # Entry point for backend server

├── contracts/              # Solidity smart contracts
│   ├── LovittiToken.sol    # Custom token contract
│   └── Marketplace.sol     # Core marketplace logic

├── config/                 # Environment and deployment configs
│   └── .env                # Environment variables

├── scripts/                # Deployment and utility scripts
│   └── deploy.js           # Hardhat deployment script

├── README.md               # Project documentation
├── package.json            # Project metadata and dependencies
└── LICENSE                 # MIT License

## 🔐 How HARAR & HBAR Work Together in a Transaction
Imagine a buyer named Amina wants to purchase tomatoes from a farmer named Kofi. Here’s how Lovitti Agro Mart uses HARAR and HBAR to make that transaction seamless and trustworthy:


🅷 History of Product (HARAR)
- Amina views the entire lifecycle of the tomatoes: harvest date, handling process, and previous transactions.
- This history is stored immutably on the Hedera Hashgraph using HBAR to anchor the data.

🅰 Availability of Product (HARAR)
- Real-time inventory shows how many crates are available.
- Updates are written to the blockchain using HBAR microtransactions, ensuring accuracy and transparency.

🆁 Reviews and Ratings (HARAR)
- Amina checks feedback from other buyers.
- Each review is timestamped and stored on-chain, secured by HBAR to prevent tampering.

🅰 Authentication of Product (HARAR)
- Kofi’s tomatoes carry a digital certificate verified by Lovitti’s smart contract.
- The certificate is validated using HBAR-powered smart contract calls, confirming origin and legitimacy.

🆁 Real-Time Updates (HARAR)
- Amina receives live updates: payment confirmation, dispatch time, and delivery tracking.
- Each update is logged on the Hedera network using HBAR, creating a transparent audit trail.

💸 Role of HBAR in Lovitti Agro Mart

- Transaction Fees: Every blockchain interaction—whether storing data or executing smart contracts—is paid for using HBAR.
- Smart Contract Execution: HARAR logic is embedded in smart contracts that run on Hedera, powered by HBAR.
- Security & Speed: HBAR ensures fast, low-cost, and secure transactions—ideal for agricultural micro-payments.

🌍 Why This Matters

By combining HARAR’s transparency with HBAR’s blockchain power, Lovitti Agro Mart creates a marketplace where:
- Farmers are trusted
- Buyers are informed
- Every transaction is secure, traceable, and fair

# Install dependencies
npm install

# Start the development server
npm run dev

## 📍 Target Users
- Smallholder farmers across Africa
- Restaurants, retailers, and households
- NGOs and cooperatives

## 🎯 Goals
- Empower farmers with digital tools
- Reduce food waste and fraud
- Promote fair trade and transparency

## 🚀 Roadmap
- Add multilingual support for rural communities
- Integrate weather and crop advisory services
- Launch mobile app version
- Partner with local cooperatives and NGOs

## 📽️ Demo Video
Take a closer look at how Lovtiti Agro Mart is changing the game for African farmers. This short video captures the heart of our mission — connecting hardworking farmers directly to buyers, cutting out middlemen, and using blockchain to bring fairness and transparency to the agricultural market.

👉 Watch the Demo

Every frame reflects our commitment to empowering communities, reducing waste, and building a future where farmers thrive.

Watch the Lovtiti Agro Mart introduction on YouTube:  
👉 [Lovtiti Agro Mart– Empowering African Farmers with Blockchain 🌍🌾](https://youtube.com/shorts/x08zn9PGgPI?si=aoeDDMDtZrZEfhji )
