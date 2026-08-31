# Herbal AI - Capstone Defense Demonstration Script

An organized, step-by-step presentation script designed for demonstrating the Herbal AI system to the academic examination panel.

---

## 1. System Overview & Architecture (1 - 2 Minutes)

* **Objective**: Introduce the problem statement, traditional botanical knowledge preservation, and the technical architecture.
* **Key Talking Points**:
  * Traditional Philippine botanical medicine is rich, but fragmented and susceptible to misinformation.
  * Herbal AI provides a centralized, Department of Health (DOH)-aligned botanical repository integrated with Retrieval-Augmented Generation (RAG) AI assistant ("Dr. AI").
  * **Technology Stack**:
    * **Frontend**: Next.js 16 (React 19), Vanilla CSS, Lucide Icons, Socket.io Client.
    * **Backend**: Express 5, TypeScript, Node.js 22, Socket.io, Prisma ORM.
    * **Database**: PostgreSQL 16 with `pgvector` extension for 768-dimension semantic vector embeddings.
    * **AI Engine**: Google Gemini API (`text-embedding-004` / `gemini-embedding-2` for vector search, `gemini-2.5-flash` for conversational synthesis).

---

## 2. Demonstration Flow: Step-by-Step

### Scene 1: DOH-Validated Herbal Library & Botanical Search
1. **Navigate to**: `http://localhost:3000/library`
2. **Demonstrate**:
   * **10 DOH Plants**: Show the 10 scientifically approved medicinal plants (*Lagundi, Sambong, Ampalaya, Bawang, Bayabas, Yerba Buena, Tsaang Gubat, Akapulko, Niyog-niyogan, Ulasimang Bato*).
   * **DOH Validation Filter**: Click the **DOH Validated** toggle button to filter the catalog instantly.
   * **Search Functionality**: Type "cough" or "Lagundi" into the search bar $\rightarrow$ observe instant filtering matching Cebuano names, local names, and medicinal uses.
   * **Detail Modal**: Click on *Lagundi* $\rightarrow$ show the official DOH endorsement banner, preparation methods, dosages, precautions, and community comments.

---

### Scene 2: Dr. AI - RAG Botanical Assistant
1. **Navigate to**: `http://localhost:3000/chat` (Log in as contributor user or guest account).
2. **Sample Questions to Ask**:
   * **Query 1 (Botanical match)**: *"What Philippine herb can I use for cough and asthma, and how do I prepare it?"*
     * **Expected Result**: Dr. AI retrieves *Lagundi* from the pgvector database, cites the preparation steps, dosage, and displays the mandatory medical disclaimer.
   * **Query 2 (Cebuano alias match)**: *"Unsay tambal sa sakit sa tiyan?"* or *"What is Alibhon used for?"*
     * **Expected Result**: Dr. AI identifies *Sambong (Alibhon)* and explains its diuretic and anti-urolithiasis properties.
   * **Query 3 (Safety boundary & medical disclaimer)**: *"Can I replace my prescription insulin with Ampalaya leaves?"*
     * **Expected Result**: Dr. AI explains the supplemental benefits of Ampalaya while explicitly warning the user to consult their physician before modifying prescribed medications.

---

### Scene 3: Community Crowdsourcing & Suggestion Workflow
1. **Navigate to**: `http://localhost:3000/suggest`
2. **Demonstrate**:
   * Fill in a new herb proposal (e.g., Local Name: *Tawa-tawa*, Scientific Name: *Euphorbia hirta*, Category: *Traditional / Dengue support*).
   * Submit the suggestion $\rightarrow$ system confirms submission and places it in `Pending` review status.

---

### Scene 4: Administrative Moderation & Real-Time Notification Loop
1. **Switch Browser / Window**: Log in with administrator account (`admin@herbalai.ph`).
2. **Navigate to**: `http://localhost:3000/admin`
3. **Demonstrate**:
   * **Pending Suggestions Tab**: Review the newly submitted *Tawa-tawa* herb suggestion.
   * **Approve Action**: Click **Approve** $\rightarrow$ the system should generate embeddings, publish the herb, write an audit entry, and notify the contributor. Demonstrate this only after end-to-end evidence has been recorded.
4. **Switch Back to Contributor Window**:
   * After verification, observe the **Notification Bell** incrementing the unread badge counter without page refresh.
   * Click the notification dropdown $\rightarrow$ click the notification $\rightarrow$ navigates directly to the new herb in the public library.

---

### Scene 5: Administrative Security & Audit Logging
1. **In `/admin` Console**:
   * Click on the **Audit Logs** tab.
   * Highlight the chronological log entries:
     * `APPROVE_SUGGESTION` (with target herb details and timestamp).
     * `UPDATE_HERB` / `DELETE_HERB` / `BAN_USER`.
   * Demonstrate the search filter by typing `APPROVE` or the target plant name.

---

### Scene 6: Community Forums & Real-Time Messaging
1. **Navigate to**: `http://localhost:3000/community` $\rightarrow$ Show discussion threads, nested comment tree, and pagination.
2. **Navigate to**: `http://localhost:3000/messenger` $\rightarrow$ Show real-time direct messaging between users with online status and image attachments.

---

### Scene 7: Code Quality, Verification Matrix & Docker Deployment
1. **Automated Testing Suite**:
   * Open terminal in `herbalaibackend`:
     ```bash
     npm test
     ```
   * Show the panel all **28 / 28 automated tests passing** across 5 Vitest test files.
2. **Docker Orchestration**:
   * Point out [docker-compose.yml](file:///c:/Users/Hp/Desktop/CAPSTONE%20PROJECT/docker-compose.yml) demonstrating full containerization of PostgreSQL (`pgvector`), backend API, and frontend web client for one-command deployment (`docker compose up --build`).

---

## 3. Anticipated Panel Questions & Answers

| Question | Recommended Answer |
| :--- | :--- |
| **How do you ensure medical safety and avoid inaccurate advice?** | We implement a multi-layered safety strategy: (1) System prompt boundary instructions enforcing standard medical disclaimers, (2) Vector similarity search (RAG) grounding AI responses in verified botanical data, and (3) Mandatory administrator review before any user-submitted herb is published. |
| **Why did you use pgvector over a standalone vector database like Pinecone?** | pgvector allows relational plant data and high-dimensional semantic embeddings to reside in the exact same PostgreSQL database. This eliminates dual-write consistency issues, reduces infrastructure costs, and supports atomic transactions. |
| **How does real-time communication scale?** | We use Socket.io with JWT authentication during the handshake phase, server-side room mapping per user ID, and optimized PostgreSQL `DISTINCT ON` queries to fetch conversation summaries in $O(1)$ database execution time without accumulating message arrays in Node.js RAM. |
