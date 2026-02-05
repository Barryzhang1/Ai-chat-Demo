# Ai Chat - AI-Powered Restaurant Management System

## Architecture Overview
Monorepo with 3 independent projects (separate package.json): **ChatBackEnd** (NestJS + MongoDB + Socket.IO + Redis), **ChatUI** (React + Ant Design Mobile), **FlappyBird** (Canvas game). Services communicate via shared Docker network (`ai-chat-network`). Not using monorepo tools like Lerna/Yarn Workspaces.

## Backend Patterns (ChatBackEnd)

### Module Structure
Follow **Module → Controller → Service → Schema → DTO → Guards/Decorators** hierarchy. Each module in `src/modules/{module}/` contains: controller, service, dto, schemas, enums, interfaces. Example: `src/modules/ordering/` handles AI chat + order management.

### API Conventions
- **Routes:** `/api/{module}/{endpoint}` (global prefix `/api` set in main.ts)
- **Response Format:** Always `{ code: 0, message: string, data: any, statusCode: number, timestamp: string }`
- **Auth:** JWT via `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(UserRole.STAFF, UserRole.BOSS)` decorators
- **Validation:** Use `class-validator` DTOs with `@ApiProperty()` for Swagger docs

### Database Patterns
- **User IDs:** Use UUID v4 (not MongoDB ObjectId) for security: `randomUUID()`
- **Soft Delete:** Add `deletedAt?: Date` field instead of hard delete
- **Virtual Fields:** Define computed properties via `Schema.virtual('field').get(function() {...})`
- **Timestamps:** Enable via `@Schema({ timestamps: true })` for auto createdAt/updatedAt

### Redis & Caching
Redis is a **global module** (`@Global()` decorator) - no need to import in every module. Access via `RedisService` injection. AI responses cached to disk at `cache/deepseek-cache.json`.

## Frontend Patterns (ChatUI)

### Structure
Pages in `src/pages/{Feature}/`, API clients in `src/api/{feature}Api.js`, utils in `src/utils/`. No Redux - use **Context API** (`LanguageContext`) + **localStorage** for state.

### API Integration
- **Dev:** Absolute URLs (`http://localhost:3001/api`)
- **Prod:** Relative paths (`/api`) - nginx reverse proxy handles routing
- **Auth:** Dual storage pattern - save JWT to **both** cookie + localStorage for resilience
- **Headers:** Manual JWT injection via `{ 'Authorization': 'Bearer ${token}' }`

### Route Protection
Use wrapper components for role-based access: `<ProtectedRoute>` (auth required), `<MerchantRoute>` (STAFF+), `<BossOnlyRoute>` (BOSS only). Check roles client-side by parsing JWT payload.

## Development Workflows

### Starting Services
- **Dev (all):** `./start.sh` starts backend (3001), frontend (8080), game (8082)
- **Docker:** `docker-compose up -d` for production-like environment
- **Individual:** `cd ChatBackEnd && npm run start:dev` or `cd ChatUI && npm run dev`

### Key Commands
- **Swagger:** http://localhost:3001/api-docs (explore all APIs)
- **Test Data:** `npm run random-assign-category` (assign dish categories)
- **Logs:** `docker-compose logs -f` for containerized services

## Integration Points

### AI Ordering (DeepSeek)
Service at `src/modules/deepseek/`. Uses Map-based in-memory cache + disk persistence. API key in `.env` as `DEEPSEEK_API_KEY`. Parses natural language into structured orders.

### WebSocket (Seat Management)
Socket.IO namespaces in `src/modules/seat/`. Real-time seat allocation with Redis-backed queue (`Redis LIST`). Heartbeat detection (10s interval) auto-releases seats.

## Common Patterns
- **Error Handling:** Throw specific exceptions (`NotFoundException`, `BadRequestException`) - centralized filter formats responses
- **i18n:** Frontend uses `LanguageContext` with localStorage persistence (`language` key)
- **CORS:** Configure `ALLOWED_ORIGINS` in backend `.env` with comma-separated URLs
- **Testing:** Jest for backend (unit tests), manual testing for frontend (no test files in `src/`)

## Roles & Permissions
- **USER:** Ordering, view own orders, play game
- **STAFF:** USER + manage orders/dishes/inventory/seats
- **BOSS:** STAFF + revenue stats, data reports, user role management

## Documentation
Full module docs in `Documents/{module}/{module}.md`. Deployment guide at `Documents/deployment-guide.md`. For new features, follow workflow in `.github/agents/code-generate.agent.md`.
