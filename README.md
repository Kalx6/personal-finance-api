# Personal Finance Management API

A backend REST API where registered users track income and expenses, organize transactions into categories, and get monthly financial summaries.

Built with **Node.js, Express, PostgreSQL, Prisma, JWT, bcrypt and Zod**.

## Features

- **Authentication:** register, login, and profile with JWT; passwords hashed with bcrypt
- **Transactions:** create, read, update, delete income and expense records
- **Categories:** organize transactions into INCOME or EXPENSE categories
- **Filtering and pagination:** by type, category, month and year
- **Monthly report:** total income, total expenses and balance for a selected month
- **Validation and errors:** Zod validation, consistent JSON errors and status codes
- **Data isolation:** every query is scoped to the authenticated user

## Tech stack

| Technology           | Purpose              |
| -------------------- | -------------------- |
| Node.js (ES modules) | Runtime              |
| Express 4            | REST API and routing |
| PostgreSQL           | Database             |
| Prisma 6             | ORM and migrations   |
| JWT                  | Authentication       |
| bcrypt               | Password hashing     |
| Zod                  | Request validation   |
| Postman              | API testing          |

## Getting started

### Prerequisites

- Node.js 18+
- PostgreSQL running locally

### Setup

```bash
git clone https://github.com/Kalx6/personal-finance-api.git
cd personal-finance-api
npm install
cp .env.example .env
```

Edit `.env` with your own values, then create the tables:

```bash
npx prisma migrate dev
npm run dev
```

The API runs at `http://localhost:3000/api/v1`. Health check: `GET /api/v1/health`.

### Environment variables

| Variable         | Description                                           | Example                                                                   |
| ---------------- | ----------------------------------------------------- | ------------------------------------------------------------------------- |
| `PORT`           | Server port                                           | `3000`                                                                    |
| `DATABASE_URL`   | PostgreSQL connection string                          | `postgresql://postgres:password@localhost:5432/finance_api?schema=public` |
| `JWT_SECRET`     | Secret used to sign tokens (use a long random string) | `change-me`                                                               |
| `JWT_EXPIRES_IN` | Token lifetime                                        | `1d`                                                                      |

## Database schema

- **User:** id, name, email (unique), password (hashed), createdAt
- **Category:** id, name, type (INCOME or EXPENSE), userId
- **Transaction:** id, amount (Decimal 12,2), type, description, date, userId, categoryId (optional)

Money is stored as `Decimal(12,2)` (never floating point) and returned as a string with two decimals, for example `"250.00"`.

## API endpoints

Base path: `/api/v1`. All endpoints except register, login and health require the header `Authorization: Bearer <token>`.

| Method | Endpoint                              | Purpose                                    |
| ------ | ------------------------------------- | ------------------------------------------ |
| POST   | `/auth/register`                      | Register a user                            |
| POST   | `/auth/login`                         | Log in and receive a JWT                   |
| GET    | `/auth/me`                            | Get the authenticated user's profile       |
| POST   | `/categories`                         | Create a category                          |
| GET    | `/categories`                         | List your categories (optional `?type=`)   |
| PATCH  | `/categories/:id`                     | Update a category                          |
| DELETE | `/categories/:id`                     | Delete a category                          |
| POST   | `/transactions`                       | Create a transaction                       |
| GET    | `/transactions`                       | List transactions (filters and pagination) |
| GET    | `/transactions/:id`                   | Get one transaction                        |
| PATCH  | `/transactions/:id`                   | Update a transaction                       |
| DELETE | `/transactions/:id`                   | Delete a transaction                       |
| GET    | `/reports/monthly?month=10&year=2026` | Monthly report                             |

### List filters (`GET /transactions`)

`page` (default 1), `limit` (default 10, max 100), `type` (INCOME or EXPENSE), `categoryId`, `month` (1-12, requires `year`), `year`.

## Example requests

**Register**

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Kalid","email":"kalid@example.com","password":"StrongPassword123"}'
```

**Create a category**

```bash
curl -X POST http://localhost:3000/api/v1/categories \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Food","type":"EXPENSE"}'
```

**Create an expense**

```bash
curl -X POST http://localhost:3000/api/v1/transactions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" -H "Content-Type: application/json" \
  -d '{"amount":250,"type":"EXPENSE","description":"Lunch","date":"2026-10-20","categoryId":"YOUR_CATEGORY_ID"}'
```

The user is taken from the verified JWT. A `userId` in the request body is never trusted.

**Monthly report**

```bash
curl "http://localhost:3000/api/v1/reports/monthly?month=10&year=2026" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

```json
{
  "month": 10,
  "year": 2026,
  "totalIncome": "15000.00",
  "totalExpenses": "300.00",
  "balance": "14700.00"
}
```

## Error format and status codes

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "amount", "message": "Amount must be greater than zero" }
  ]
}
```

| Code | Meaning                                               |
| ---- | ----------------------------------------------------- |
| 200  | Successful read, update or delete                     |
| 201  | Resource created                                      |
| 400  | Invalid input                                         |
| 401  | Missing, invalid or expired token; wrong credentials  |
| 404  | Resource not found (including other users' resources) |
| 409  | Conflict (duplicate email or category)                |
| 500  | Unexpected server error                               |

## Design decisions

- **Other users' data returns 404, not 403**, so the API never confirms that someone else's resource exists.
- **Category type must match the transaction type**, and a category's type cannot change once it has transactions.
- **Deleting a category keeps its transactions**, which become uncategorized, so financial records are never silently lost.
- **Login uses one generic error** for unknown email and wrong password, so emails cannot be probed.

## Testing

Import `docs/postman_collection.json` into Postman and run the whole collection with the Collection Runner. It uses fresh users on every run and covers:

- Registration, duplicate emails, invalid input, wrong credentials
- Missing and invalid JWTs
- Negative amounts, missing fields, invalid types, category mismatch
- Filtering and pagination
- Monthly report accuracy
- Cross-user access (a second user cannot view, update or delete another user's data)

## Project structure

```
prisma/            schema and migrations
src/
  config/          Prisma client
  controllers/     request handlers
  middleware/      auth, validation, error handling
  routes/          route definitions
  validators/      Zod schemas
  utils/           helpers (errors, dates, serializers)
  app.js           Express app
  server.js        entry point
docs/              Postman collection
```

## Not implemented (future work)

Monthly budgets and budget usage tracking, automated tests, deployment.
