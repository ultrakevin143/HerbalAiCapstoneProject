# Herbal AI capstone defense script

Use this script with `Herbal_AI_Capstone_Defense_v1.pptx`. The slide deck contains 15 slides and is designed for a controlled local presentation. Keep the live demonstration concise and use the prepared screenshots if an internet-dependent service is unavailable.

## Slide-by-slide speaking guide

### 1. Herbal AI

Introduce Herbal AI as a digital repository of Philippine herbal medicine with AI-assisted preparation guides. Introduce Kevin C. Mercado, Devon Descipulo, and Eumar Cabaluna.

### 2. The problem

Traditional knowledge is useful but fragmented. Users may encounter incomplete preparation instructions, missing warnings, or unreviewed community claims. Herbal AI responds with a searchable repository, administrator moderation, and grounded explanations.

### 3. Objectives and scope

Explain the four main functions: the verified herb library, Dr. AI, community contributions, and account/collaboration features. State the safety boundary clearly: the system does not diagnose, prescribe, or replace professional medical care.

### 4. System architecture

Describe the browser, API, data, and external-service layers. The frontend uses Next.js and React; the backend uses Express, TypeScript, Prisma, and Socket.io; PostgreSQL stores relational and vector data; Gemini and Cloudinary support AI and media functions. Secrets remain in ignored backend environment files.

### 5. Verified medicinal-plant library

Open `http://localhost:3000/library`, search for `Lagundi`, and open its details. Point out approved catalog entries, aliases, categories, preparation guidance, dosage, warnings, and verification state. The seed catalog contains the ten DOH-recognized medicinal plants documented by the project.

### 6. Dr. AI retrieval and explanation

Open `http://localhost:3000/chat` with the contributor demo account. Ask: `How do I prepare Lagundi for cough?` Explain the three stages shown in the deck:

1. Retrieve relevant approved herb or knowledge-base records.
2. Keep only relevant source facts, dosage, warnings, and system scope.
3. Rewrite the short source into a clearer answer with attribution and a medical disclaimer.

If no relevant approved source exists, Dr. AI must not invent herb instructions or dosage. A useful boundary test is: `What is Moonleaf used for?`

### 7. Contributor and administrator workflow

Show a clearly labelled test suggestion moving from submission to pending review. In the separate administrator session, approve or reject it. Explain that approved content can update the catalog and contributor notification, while rejected or pending content stays out of the verified public library. Use only temporary test data and clean it up after the demonstration.

### 8. Roles and collaboration

Distinguish guest, contributor, and administrator permissions. Briefly show community discussion, herb comments, notifications, and Messenger. Mention that two authenticated users exchanged real-time messages through Socket.io without reloading.

### 9. Security and trust controls

Summarize short access tokens, refresh-token rotation, logout revocation, server-side role checks, input validation, parameterized database operations, upload signature checks, backend-only secrets, grounded AI behavior, and single-use account-recovery links. Never display credentials, `.env` files, inbox content, tokens, or database connection strings.

### 10. Verification baseline

Report the current recorded baseline accurately:

- 175 of 175 backend tests passed across 31 files.
- 34 of 34 functional API checks passed.
- 26 of 26 emulated responsive accessibility-width checks passed.
- Frontend lint, TypeScript checks, and the 20-route production build passed.

Do not claim that automated or emulated checks replace participant UAT, physical-device acceptance, or adviser review.

### 11. Performance

The five fresh local homepage LCP measurements were 2,636 ms, 900 ms, 744 ms, 820 ms, and 868 ms. The local PR-001 target of 3,000 ms was met provisionally. The first post-login `/auth/me` request measured 37.5 ms end to end and 9.1 ms inside Express. PR-004 and PR-005 still require a staging environment close to the database.

### 12. Team contribution

State the documented allocation consistently: Kevin C. Mercado 50%, Devon Descipulo 25%, and Eumar Cabaluna 25%. Kevin served as project manager and backend developer and holds the highest contribution allocation.

### 13. Readiness and remaining gates

The internal evidence score is 88 out of 100. It means the project is ready for a controlled local capstone presentation, not that it has achieved final academic or production acceptance. The open gates are five real UAT participants, staging performance, production/TLS/recovery evidence, physical-device and full WCAG review, and adviser/panel signatures.

### 14. Demonstration flow recap

Keep the live sequence controlled:

1. Public catalog and Lagundi details.
2. Dr. AI grounded preparation answer.
3. Contributor suggestion and collaboration features.
4. Administrator moderation, management, and audit history.
5. Test evidence, performance limits, and remaining gates.

### 15. Questions

Invite questions. If asked whether the project is complete, answer: `Local functional verification is complete for the recorded scope. Participant UAT, staging performance, deployment and formal reviewer acceptance remain open.`

## Likely panel questions

| Question | Recommended answer |
|---|---|
| How do you reduce inaccurate medical advice? | Dr. AI retrieves approved repository facts, filters unrelated sources, retains warnings and scope, and includes a medical disclaimer. Community submissions require administrator review before publication. |
| Why use PostgreSQL with pgvector? | Relational herb records and semantic vectors remain in one database, reducing synchronization complexity and supporting consistent updates. |
| How is authorization enforced? | Protected operations use authenticated server-side role checks; hiding a frontend control is not treated as authorization. |
| Is the system production-ready? | No. It is ready for a controlled local presentation. Staging performance, production TLS/deployment, recovery evidence, real UAT, and formal acceptance remain pending. |
| Why is Kevin's contribution higher? | Kevin performed project management and major backend responsibilities, including planning, architecture, authentication, database work, integration, testing, and documentation. The controlled documents record 50%, 25%, and 25%. |

## Defense-day safety rules

- Use dedicated contributor and administrator demo accounts and never say passwords aloud.
- Keep screenshots ready for Google OAuth, email, Gemini, and other network-dependent behavior.
- Do not submit a live medical claim as verified evidence without administrator review.
- Delete only the temporary records created during rehearsal or presentation.
- State limitations directly; do not present the 88/100 internal score as an academic grade.
