# Architecture Diagrams

## 1. Active Mode Flow Architecture

```mermaid
flowchart TD
    subgraph Login["Login Flow"]
        A[User Login] --> B{User Role?}
        B -->|EXPEDITEUR| C[Set activeMode=EXPEDITEUR]
        B -->|VOYAGEUR| D[Set activeMode=VOYAGEUR]
        B -->|LES_DEUX| E[Show Mode Selection Modal]
        E --> F[User Selects Mode]
        F --> G[Store activeMode in JWT]
    end

    subgraph Session["Session Management"]
        G --> H[Create ActiveModeSession]
        H --> I[Set Cookie: cv_active_mode]
        C --> I
        D --> I
    end

    subgraph API["API Request Flow"]
        J[Incoming Request] --> K[NextAuth JWT Validation]
        K --> L{Valid Session?}
        L -->|No| M[401 Unauthorized]
        L -->|Yes| N{LES_DEUX?}
        N -->|Yes| O{Has activeMode?}
        N -->|No| P[Use Fixed Role]
        O -->|No| Q[403 Active Mode Required]
        O -->|Yes| R[Get Effective Mode]
        P --> S[RoleGuard Middleware]
        R --> S
        S --> T{Has Permission?}
        T -->|No| U[403 Permission Denied]
        T -->|Yes| V[Audit Log: GRANTED]
        V --> W[Execute Handler]
    end

    subgraph UI["Frontend UI Flow"]
        X[Page Load] --> Y[useSession Hook]
        Y --> Z{Session Valid?}
        Z -->|No| AA[Show Login]
        Z -->|Yes| AB{LES_DEUX?}
        AB -->|Yes| AC{Has activeMode?}
        AB -->|No| AD[Render Based on Role]
        AC -->|No| AE[Redirect to Mode Selection]
        AC -->|Yes| AF[RoleGuard Component]
        AF --> AG{Check Permission}
        AG -->|Denied| AH[Hide Element]
        AG -->|Granted| AI[Show Element]
    end

    I -.-> J
    AD -.-> AF
```

## 2. Permission Check Sequence

```mermaid
sequenceDiagram
    participant Client
    participant API as API Route
    participant Guard as RoleGuard
    participant Auth as NextAuth
    participant DB as Database
    participant Audit as Audit Log

    Client->>API: POST /api/colis
    API->>Guard: requirePermission(CREATE_COLIS)
    Guard->>Auth: getServerSession()
    Auth-->>Guard: session | null

    alt No Session
        Guard->>Audit: Log: AUTH_REQUIRED
        Guard-->>API: 401 Unauthorized
        API-->>Client: {error: "Unauthorized"}
    else Has Session
        Guard->>Guard: getEffectiveMode(user)

        alt LES_DEUX without activeMode
            Guard->>Audit: Log: ACTIVE_MODE_REQUIRED
            Guard-->>API: 403 Active Mode Required
            API-->>Client: {error: "Select active mode"}
        else Has Effective Mode
            Guard->>Guard: hasPermission(mode, permission)

            alt No Permission
                Guard->>Audit: Log: PERMISSION_DENIED
                Guard-->>API: 403 Forbidden
                API-->>Client: {error: "Insufficient permissions"}
            else Has Permission
                Guard->>Audit: Log: PERMISSION_GRANTED
                Guard->>DB: Verify ownership (if required)
                DB-->>Guard: ownership status

                alt Not Owner
                    Guard->>Audit: Log: OWNERSHIP_DENIED
                    Guard-->>API: 403 Forbidden
                else Is Owner
                    Guard-->>API: Continue to handler
                    API->>DB: Create colis
                    DB-->>API: Created colis
                    API-->>Client: {success: true, data: colis}
                end
            end
        end
    end
```

## 3. Matching Algorithm Flow

```mermaid
flowchart TD
    subgraph Input["Input Validation"]
        A[calculateMatch] --> B[Validate Inputs]
        B --> C{Valid?}
        C -->|No| D[Throw ValidationError]
        C -->|Yes| E[Extract colis & trajet]
    end

    subgraph Primary["Primary Criteria (70 pts)"]
        E --> F[Calculate Departure Score]
        F --> G[Calculate Arrival Score]
        G --> H[Calculate Date Score]
        H --> I[Sum: primaryTotal]
    end

    subgraph Secondary["Secondary Criteria (30 pts)"]
        I --> J[Calculate Weight Score]
        J --> K[Calculate Flexibility Score]
        K --> L[Calculate Urgency Score]
        L --> M[Sum: secondaryTotal]
    end

    subgraph Guarantee["Guarantee Check"]
        M --> N[rawScore = primary + secondary]
        N --> O{All Primary Exact?}
        O -->|Yes| P[guaranteedScore = max(rawScore, 70)]
        O -->|No| Q[guaranteedScore = rawScore]
    end

    subgraph Output["Result Construction"]
        P --> R[Build Breakdown Object]
        Q --> R
        R --> S[Classify Match]
        S --> T[Return MatchResult]
    end

    D --> U[Error Boundary]
```

## 4. System Architecture Overview

```mermaid
flowchart TB
    subgraph Frontend["Frontend Layer"]
        UI[React Components]
        RG[RoleGuard.tsx]
        Hooks[usePermission Hook]
        MS[ModeSelector.tsx]
    end

    subgraph API_Layer["API Layer"]
        Routes[Next.js API Routes]
        GM[Guard Middleware]
        Handlers[Route Handlers]
    end

    subgraph Auth_Layer["Auth Layer"]
        NA[NextAuth.js]
        JWT[JWT Token]
        Session[Session Store]
    end

    subgraph Business_Layer["Business Layer"]
        Match[Matching Engine]
        Score[Scoring Functions]
        City[City Normalization]
    end

    subgraph Data_Layer["Data Layer"]
        Prisma[Prisma ORM]
        MySQL[(MySQL Database)]
        Cache[(Redis Cache)]
    end

    subgraph Security["Security & Audit"]
        Audit[Audit Logger]
        RBAC[RBAC Matrix]
        Validation[Input Validation]
    end

    UI -->|uses| RG
    UI -->|uses| Hooks
    UI -->|renders| MS

    RG -->|checks| NA
    Hooks -->|checks| NA
    MS -->|sets mode| Routes

    Routes -->|protected by| GM
    GM -->|validates| NA
    GM -->|checks| RBAC
    GM -->|logs to| Audit

    NA -->|stores| JWT
    NA -->|stores| Session

    Handlers -->|calls| Match
    Handlers -->|uses| Validation

    Match -->|uses| Score
    Match -->|uses| City

    Score -->|queries| Prisma
    City -->|queries| Cache

    Prisma -->|connects| MySQL
    Cache -->|caches| MySQL
```

## 5. Database Schema Changes

```mermaid
erDiagram
    USER {
        string id PK
        string email UK
        string password
        string name
        string phone
        string photo
        enum role "EXPEDITEUR|VOYAGEUR|LES_DEUX"
        datetime createdAt
        datetime updatedAt
    }

    ACTIVE_MODE_SESSION {
        string id PK
        string userId FK
        string activeMode "EXPEDITEUR|VOYAGEUR"
        datetime createdAt
        datetime expiresAt
    }

    TRAJET {
        string id PK
        string villeDepart
        string villeArrivee
        datetime dateVoyage
        float kilosDisponibles
        float prixParKilo
        string description
        string userId FK
        datetime createdAt
        datetime updatedAt
    }

    COLIS {
        string id PK
        string villeEnvoi
        string villeReception
        float poids
        string description
        datetime dateEnvoi
        int flexibilite "0-3"
        int urgence "0-3"
        string userId FK
        datetime createdAt
        datetime updatedAt
    }

    CONVERSATION {
        string id PK
        string colisId FK
        string trajetId FK
        datetime createdAt
        datetime updatedAt
    }

    MESSAGE {
        string id PK
        string content
        string conversationId FK
        string senderId FK
        string receiverId FK
        datetime createdAt
    }

    USER ||--o{ TRAJET : creates
    USER ||--o{ COLIS : creates
    USER ||--o{ ACTIVE_MODE_SESSION : has
    USER ||--o{ MESSAGE : sends
    USER ||--o{ MESSAGE : receives
    TRAJET ||--o{ CONVERSATION : has
    COLIS ||--o{ CONVERSATION : has
    CONVERSATION ||--o{ MESSAGE : contains
```

## 6. Mode Switching Flow

```mermaid
stateDiagram-v2
    [*] --> Unauthenticated

    Unauthenticated --> Authenticating : Login
    Authenticating --> EXPEDITEUR_Mode : Role=EXPEDITEUR
    Authenticating --> VOYAGEUR_Mode : Role=VOYAGEUR
    Authenticating --> ModeSelection : Role=LES_DEUX

    ModeSelection --> EXPEDITEUR_Mode : Select EXPEDITEUR
    ModeSelection --> VOYAGEUR_Mode : Select VOYAGEUR

    EXPEDITEUR_Mode --> CanCreateColis : Permission Check
    VOYAGEUR_Mode --> CanCreateTrajet : Permission Check

    CanCreateColis --> CreatingColis : Submit Form
    CanCreateTrajet --> CreatingTrajet : Submit Form

    CreatingColis --> EXPEDITEUR_Mode : Success
    CreatingTrajet --> VOYAGEUR_Mode : Success

    EXPEDITEUR_Mode --> ModeSwitching : LES_DEUX User
    VOYAGEUR_Mode --> ModeSwitching : LES_DEUX User

    ModeSwitching --> EXPEDITEUR_Mode : Switch to EXPEDITEUR
    ModeSwitching --> VOYAGEUR_Mode : Switch to VOYAGEUR

    EXPEDITEUR_Mode --> Authenticated : Logout
    VOYAGEUR_Mode --> Authenticated : Logout
    Authenticated --> Unauthenticated : Session Expired
```

## 7. Matching Score Calculation

```mermaid
flowchart LR
    subgraph Primary["Primary Criteria (70%)"]
        direction TB
        D[Departure<br/>25 pts]
        A[Arrival<br/>25 pts]
        DT[Date<br/>20 pts]
    end

    subgraph Secondary["Secondary Criteria (30%)"]
        direction TB
        W[Weight<br/>15 pts]
        F[Flexibility<br/>10 pts]
        U[Urgency<br/>5 pts]
    end

    subgraph Formula["Scoring Formula"]
        SUM[SUM = D + A + DT + W + F + U]
        GUAR{Exact Primary<br/>Match?}
        FINAL[Final Score = max(SUM, 70)]
        RAW[Final Score = SUM]
    end

    D --> SUM
    A --> SUM
    DT --> SUM
    W --> SUM
    F --> SUM
    U --> SUM

    SUM --> GUAR
    GUAR -->|Yes| FINAL
    GUAR -->|No| RAW
```

## 8. Security Layer Architecture

```mermaid
flowchart TB
    subgraph Request["Incoming Request"]
        R[HTTP Request]
        H[Headers]
        C[Cookie: cv_active_mode]
        B[Body]
    end

    subgraph Validation["Validation Layers"]
        V1[Layer 1: HTTPS/TLS]
        V2[Layer 2: Rate Limiting]
        V3[Layer 3: Input Sanitization]
        V4[Layer 4: Auth Validation]
        V5[Layer 5: Permission Check]
        V6[Layer 6: Ownership Verification]
    end

    subgraph Enforcement["Enforcement Points"]
        E1[API Gateway]
        E2[Route Middleware]
        E3[Service Layer]
        E4[Database Access]
    end

    R --> V1
    H --> V2
    C --> V4
    B --> V3

    V1 --> E1
    V2 --> E1
    V3 --> E2
    V4 --> V5
    V5 --> V6
    V6 --> E3

    E1 -->|Pass| E2
    E2 -->|Pass| E3
    E3 -->|Query| E4

    E1 -->|Block| Denied1[403/429 Response]
    E2 -->|Block| Denied2[400 Response]
    E3 -->|Block| Denied3[403 Response]
```
