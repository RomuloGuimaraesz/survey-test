# Architecture Diagram

## Clean Architecture Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                         admin.html (199 lines)                   │
│                     Minimal Presentation Only                    │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                        main.js (237 lines)                       │
│                    Composition Root (DI Container)               │
│  • Wires all dependencies                                       │
│  • Single source of truth for instantiation                     │
└─────────────────────────────────────────────────────────────────┘
                                 │
                 ┌───────────────┼───────────────┐
                 ▼               ▼               ▼
┌────────────────────┐ ┌──────────────┐ ┌──────────────────┐
│  Presentation      │ │ Application  │ │ Infrastructure   │
│  Layer             │ │ Layer        │ │ Layer            │
└────────────────────┘ └──────────────┘ └──────────────────┘
         │                     │                   │
         └─────────────────────┼───────────────────┘
                               ▼
                     ┌──────────────────┐
                     │  Domain Layer    │
                     │  (Core Business) │
                     └──────────────────┘
```

## Dependency Flow (Following Dependency Inversion)

```
   Presentation Layer (UI)
   ────────────────────────────────────────
   • StatisticsPanel      • AIChatWidget
   • CitizenTable         • CitizenDetailsPanel
   • AdminViewModel       • Formatters
          │
          │ depends on (abstractions)
          ▼
   Application Layer (Use Cases)
   ────────────────────────────────────────
   • LoadCitizensUseCase  • ProcessAIQueryUseCase
   • SendWhatsAppUseCase  • ExportCitizensUseCase
   • FilterCriteriaDTO    • CitizenDTO
          │
          │ depends on (abstractions)
          ▼
   Domain Layer (Business Logic)
   ────────────────────────────────────────
   • Citizen (Aggregate)  • Value Objects
   • ICitizenRepository   • Domain Services
   • CitizenFilterService • StatisticsService
          ▲
          │ implements (interfaces)
          │
   Infrastructure Layer (External)
   ────────────────────────────────────────
   • HttpCitizenRepository • ApiClient
   • AIAssistantService     • Storage
```

## Component Relationships

```
                    AdminViewModel
                    (Orchestrator)
                          │
         ┌────────────────┼────────────────┐
         ▼                ▼                ▼
   StatisticsPanel  CitizenTable  CitizenDetailsPanel
         │                │                │
         │                │                │
         └────────────────┼────────────────┘
                          │
                          ▼
                 LoadCitizensUseCase
                          │
         ┌────────────────┼────────────────┐
         ▼                ▼                ▼
  CitizenRepository  FilterService  StatisticsService
         │
         ▼
    ApiClient ──► Backend API
```

## Data Flow Example: Loading Citizens

```
1. User clicks "Apply Filter"
   │
   ▼
2. AdminViewModel.applyFilters()
   │
   ▼
3. LoadCitizensUseCase.execute(filterCriteria)
   │
   ├─► 4a. HttpCitizenRepository.findAll()
   │        │
   │        └─► ApiClient.get('/api/contacts')
   │             │
   │             └─► Backend API
   │
   ├─► 4b. CitizenFilterService.apply(citizens, criteria)
   │
   └─► 4c. StatisticsService.calculate(citizens)
   │
   ▼
5. Returns { citizens, statistics }
   │
   ├─► 6a. CitizenTable.render(citizens)
   │
   └─► 6b. StatisticsPanel.render(statistics)
```

## SOLID Principles in Action

### Single Responsibility Principle (SRP)

```
Before:
┌─────────────────────────────────┐
│     loadContacts()              │
│  • Fetch data                   │
│  • Filter data                  │
│  • Calculate statistics         │
│  • Render table                 │
│  • Update statistics panel      │
└─────────────────────────────────┘

After:
┌────────────────────┐   ┌────────────────────┐
│ LoadCitizensUseCase│   │ FilterService      │
│ • Orchestrate      │   │ • Filter only      │
└────────────────────┘   └────────────────────┘

┌────────────────────┐   ┌────────────────────┐
│ StatisticsService  │   │ CitizenTable       │
│ • Calculate stats  │   │ • Render only      │
└────────────────────┘   └────────────────────┘
```

### Dependency Inversion Principle (DIP)

```
Before (High-level depends on low-level):
┌──────────────────┐
│  LoadContacts    │
│                  │
│  fetch(url) ───────► Direct HTTP call
└──────────────────┘

After (Both depend on abstraction):
┌──────────────────┐       ┌─────────────────────┐
│ LoadCitizensUse  │       │ ICitizenRepository  │
│ Case             │◄──────┤  (Interface)        │
└──────────────────┘       └─────────────────────┘
                                      ▲
                                      │
                           ┌──────────┴──────────┐
                           │                     │
                  ┌────────┴──────────┐  ┌──────┴─────────┐
                  │HttpCitizenRepo    │  │MockCitizenRepo │
                  │(Production)       │  │(Testing)       │
                  └───────────────────┘  └────────────────┘
```

## File Organization by Layer

```
js/
│
├── domain/                     [Core Business - No External Dependencies]
│   ├── entities/
│   │   ├── Citizen.js         ◄─── Aggregate Root
│   │   ├── PersonalInfo.js    ◄─── Value Object
│   │   ├── ContactInfo.js     ◄─── Value Object
│   │   ├── SurveyResponse.js  ◄─── Value Object
│   │   └── EngagementHistory.js ◄─ Value Object
│   ├── repositories/
│   │   └── ICitizenRepository.js ◄─ Interface (DIP)
│   └── services/
│       ├── CitizenFilterService.js
│       └── StatisticsService.js
│
├── application/                [Use Cases - Orchestration]
│   ├── dto/
│   │   ├── FilterCriteriaDTO.js
│   │   └── CitizenDTO.js
│   └── usecases/
│       ├── LoadCitizensUseCase.js
│       ├── SendWhatsAppMessageUseCase.js
│       ├── ExportCitizensUseCase.js
│       └── ProcessAIQueryUseCase.js
│
├── infrastructure/             [External Services]
│   ├── api/
│   │   └── ApiClient.js       ◄─── HTTP Client
│   ├── repositories/
│   │   └── HttpCitizenRepository.js ◄─ Implements Interface
│   └── services/
│       └── AIAssistantService.js
│
├── presentation/               [UI Components]
│   ├── components/
│   │   ├── StatisticsPanel.js
│   │   ├── CitizenTable.js
│   │   ├── CitizenDetailsPanel.js
│   │   └── AIChatWidget.js
│   ├── viewmodels/
│   │   └── AdminViewModel.js  ◄─── Coordinates UI & Use Cases
│   └── formatters/
│       ├── DateFormatter.js
│       └── StatusFormatter.js
│
├── shared/                     [Shared Kernel]
│   ├── constants.js           ◄─── Ubiquitous Language
│   └── utils/
│       └── columnDefinitions.js
│
└── main.js                     [Composition Root - DI Container]
```

## Domain Model (DDD)

```
┌─────────────────────────────────────────────┐
│           Citizen (Aggregate Root)          │
├─────────────────────────────────────────────┤
│ - id: number                                │
│ - personalInfo: PersonalInfo                │
│ - contactInfo: ContactInfo                  │
│ - engagementHistory: EngagementHistory      │
│ - surveyResponse: SurveyResponse | null     │
│ - metadata: { createdAt, updatedAt }        │
├─────────────────────────────────────────────┤
│ + hasResponded(): boolean                   │
│ + isEngaged(): boolean                      │
│ + wasContacted(): boolean                   │
│ + getSatisfactionLevel(): string            │
│ + getEngagementStatus(): string             │
│ + isPending(): boolean                      │
└─────────────────────────────────────────────┘
         │
         │ contains
         │
    ┌────┴─────┬─────────────┬──────────────┐
    ▼          ▼             ▼              ▼
┌─────────┐ ┌──────────┐ ┌──────────────┐ ┌──────────────┐
│Personal │ │ Contact  │ │ Engagement   │ │ Survey       │
│Info     │ │ Info     │ │ History      │ │ Response     │
└─────────┘ └──────────┘ └──────────────┘ └──────────────┘
(Value Obj)  (Value Obj)  (Value Object)    (Value Object)
```

## Testing Strategy

```
┌──────────────────────────────────────────────┐
│              Testing Pyramid                 │
└──────────────────────────────────────────────┘

                    ▲
                   ╱ ╲
                  ╱   ╲          E2E Tests
                 ╱ E2E ╲         (Puppeteer)
                ╱───────╲        - Full user flows
               ╱         ╲
              ╱───────────╲
             ╱ Integration ╲     Integration Tests
            ╱───────────────╲    - Use cases with mocks
           ╱                 ╲
          ╱───────────────────╲
         ╱      Unit Tests     ╲  Unit Tests
        ╱───────────────────────╲ - Domain entities
       ╱_________________________╲ - Value objects
                                   - Services

Layer Testing:
├── Domain Layer      ──► Unit Tests (Pure functions)
├── Application Layer ──► Integration Tests (Mock repos)
├── Infrastructure    ──► Integration Tests (API mocks)
└── Presentation      ──► E2E Tests (Puppeteer)
```

## Comparison: Before vs After

```
BEFORE (Monolithic)
─────────────────────────────────────
admin.html (1,226 lines)
│
└─► <script>
    ├─ Global variables
    ├─ Mixed concerns
    ├─ Direct fetch calls
    ├─ Inline event handlers
    ├─ 360-line class doing everything
    └─ No clear separation

Problems:
❌ Hard to test
❌ Hard to maintain
❌ Hard to extend
❌ Tight coupling
❌ No abstraction

AFTER (Clean Architecture)
─────────────────────────────────────
admin-refactored.html (199 lines)
│
└─► <script type="module" src="js/main.js">
    │
    └─► main.js (Composition Root)
        │
        ├─► Domain Layer (9 files, 578 lines)
        │   └─ Pure business logic
        │
        ├─► Application Layer (6 files, 219 lines)
        │   └─ Use cases & DTOs
        │
        ├─► Infrastructure Layer (3 files, 180 lines)
        │   └─ External services
        │
        └─► Presentation Layer (6 files, 906 lines)
            └─ UI components

Benefits:
✅ Fully testable
✅ Easy to maintain
✅ Easy to extend
✅ Loose coupling
✅ Clear abstractions
```

---

**Key Takeaway**: Dependencies flow **inward** toward the domain layer, which remains pure and independent of external concerns. This is the essence of Clean Architecture.
