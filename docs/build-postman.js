import { writeFileSync } from "node:fs";

const j = (o) => JSON.stringify(o, null, 2);

// Builds one Postman request. auth: 'token' | 'token2' | 'none' | 'bad'
const req = ({
  name,
  method = "GET",
  path,
  body,
  auth = "token",
  tests = [],
}) => {
  const header = [];
  if (body) header.push({ key: "Content-Type", value: "application/json" });
  if (auth === "token")
    header.push({ key: "Authorization", value: "Bearer {{token}}" });
  if (auth === "token2")
    header.push({ key: "Authorization", value: "Bearer {{token2}}" });
  if (auth === "bad")
    header.push({ key: "Authorization", value: "Bearer not.a.real.token" });

  return {
    name,
    request: {
      method,
      header,
      url: `{{baseUrl}}${path}`,
      ...(body && { body: { mode: "raw", raw: j(body) } }),
    },
    event: [
      { listen: "test", script: { type: "text/javascript", exec: tests } },
    ],
  };
};

const status = (code) =>
  `pm.test('Status is ${code}', () => pm.response.to.have.status(${code}));`;
const save = (variable, expr) =>
  `pm.collectionVariables.set('${variable}', ${expr});`;

const folder = (name, item) => ({ name, item });

const collection = {
  info: {
    name: "Personal Finance API",
    schema:
      "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    description:
      "Run the whole collection top to bottom (Collection Runner). It creates fresh users each run, so it is safe to repeat.",
  },
  variable: [
    { key: "baseUrl", value: "http://localhost:3000/api/v1" },
    { key: "password", value: "StrongPassword123" },
  ],
  item: [
    folder("1. Auth", [
      req({
        name: "Register user",
        method: "POST",
        path: "/auth/register",
        auth: "none",
        body: {
          name: "Kalid",
          email: "kalid{{$timestamp}}@example.com",
          password: "{{password}}",
        },
        tests: [
          status(201),
          "const d = pm.response.json().data;",
          save("email", "d.user.email"),
          save("token", "d.token"),
          "pm.test('Password is never returned', () => pm.expect(d.user).to.not.have.property('password'));",
        ],
      }),
      req({
        name: "Register duplicate email (409)",
        method: "POST",
        path: "/auth/register",
        auth: "none",
        body: { name: "Kalid", email: "{{email}}", password: "{{password}}" },
        tests: [status(409)],
      }),
      req({
        name: "Register invalid input (400)",
        method: "POST",
        path: "/auth/register",
        auth: "none",
        body: { name: "K", email: "not-an-email", password: "123" },
        tests: [status(400)],
      }),
      req({
        name: "Login",
        method: "POST",
        path: "/auth/login",
        auth: "none",
        body: { email: "{{email}}", password: "{{password}}" },
        tests: [status(200), save("token", "pm.response.json().data.token")],
      }),
      req({
        name: "Login wrong password (401)",
        method: "POST",
        path: "/auth/login",
        auth: "none",
        body: { email: "{{email}}", password: "wrong-password" },
        tests: [status(401)],
      }),
      req({ name: "Get my profile", path: "/auth/me", tests: [status(200)] }),
      req({
        name: "Profile without token (401)",
        path: "/auth/me",
        auth: "none",
        tests: [status(401)],
      }),
      req({
        name: "Profile with invalid token (401)",
        path: "/auth/me",
        auth: "bad",
        tests: [status(401)],
      }),
    ]),

    folder("2. Categories", [
      req({
        name: "Create category Food (EXPENSE)",
        method: "POST",
        path: "/categories",
        body: { name: "Food", type: "EXPENSE" },
        tests: [
          status(201),
          save("expenseCategoryId", "pm.response.json().data.id"),
        ],
      }),
      req({
        name: "Create category Salary (INCOME)",
        method: "POST",
        path: "/categories",
        body: { name: "Salary", type: "INCOME" },
        tests: [
          status(201),
          save("incomeCategoryId", "pm.response.json().data.id"),
        ],
      }),
      req({
        name: "Duplicate category (409)",
        method: "POST",
        path: "/categories",
        body: { name: "Food", type: "EXPENSE" },
        tests: [status(409)],
      }),
      req({
        name: "Invalid category type (400)",
        method: "POST",
        path: "/categories",
        body: { name: "Oops", type: "FOO" },
        tests: [status(400)],
      }),
      req({
        name: "List categories",
        path: "/categories",
        tests: [
          status(200),
          "pm.test('Has 2 categories', () => pm.expect(pm.response.json().data.length).to.eql(2));",
        ],
      }),
      req({
        name: "Rename category",
        method: "PATCH",
        path: "/categories/{{expenseCategoryId}}",
        body: { name: "Food & Drinks" },
        tests: [status(200)],
      }),
      req({
        name: "Create temp category",
        method: "POST",
        path: "/categories",
        body: { name: "Temp", type: "EXPENSE" },
        tests: [
          status(201),
          save("tempCategoryId", "pm.response.json().data.id"),
        ],
      }),
      req({
        name: "Delete temp category",
        method: "DELETE",
        path: "/categories/{{tempCategoryId}}",
        tests: [status(200)],
      }),
    ]),

    folder("3. Transactions", [
      req({
        name: "Create expense",
        method: "POST",
        path: "/transactions",
        body: {
          amount: 250,
          type: "EXPENSE",
          description: "Lunch",
          date: "2026-10-20",
          categoryId: "{{expenseCategoryId}}",
        },
        tests: [
          status(201),
          save("transactionId", "pm.response.json().data.id"),
          "pm.test('Amount is a 2-decimal string', () => pm.expect(pm.response.json().data.amount).to.eql('250.00'));",
        ],
      }),
      req({
        name: "Create income",
        method: "POST",
        path: "/transactions",
        body: {
          amount: 15000,
          type: "INCOME",
          description: "October salary",
          date: "2026-10-01",
          categoryId: "{{incomeCategoryId}}",
        },
        tests: [status(201)],
      }),
      req({
        name: "Negative amount (400)",
        method: "POST",
        path: "/transactions",
        body: { amount: -5, type: "EXPENSE" },
        tests: [status(400)],
      }),
      req({
        name: "Missing fields (400)",
        method: "POST",
        path: "/transactions",
        body: { description: "no amount or type" },
        tests: [status(400)],
      }),
      req({
        name: "Invalid type (400)",
        method: "POST",
        path: "/transactions",
        body: { amount: 10, type: "FOO" },
        tests: [status(400)],
      }),
      req({
        name: "Category type mismatch (400)",
        method: "POST",
        path: "/transactions",
        body: {
          amount: 10,
          type: "EXPENSE",
          categoryId: "{{incomeCategoryId}}",
        },
        tests: [status(400)],
      }),
      req({
        name: "List transactions",
        path: "/transactions",
        tests: [
          status(200),
          "pm.test('Has 2 items', () => pm.expect(pm.response.json().pagination.total).to.eql(2));",
        ],
      }),
      req({
        name: "Pagination (limit 1)",
        path: "/transactions?page=1&limit=1",
        tests: [
          status(200),
          "const r = pm.response.json();",
          "pm.test('1 item, 2 pages', () => { pm.expect(r.data.length).to.eql(1); pm.expect(r.pagination.totalPages).to.eql(2); });",
        ],
      }),
      req({
        name: "Filter by type and month",
        path: "/transactions?type=EXPENSE&month=10&year=2026",
        tests: [
          status(200),
          "pm.test('Only expenses', () => pm.response.json().data.forEach((t) => pm.expect(t.type).to.eql('EXPENSE')));",
        ],
      }),
      req({
        name: "Filter by category",
        path: "/transactions?categoryId={{incomeCategoryId}}",
        tests: [
          status(200),
          "pm.test('Only income category', () => pm.expect(pm.response.json().pagination.total).to.eql(1));",
        ],
      }),
      req({
        name: "Get one transaction",
        path: "/transactions/{{transactionId}}",
        tests: [status(200)],
      }),
      req({
        name: "Update transaction",
        method: "PATCH",
        path: "/transactions/{{transactionId}}",
        body: { amount: 300 },
        tests: [
          status(200),
          "pm.test('Amount updated', () => pm.expect(pm.response.json().data.amount).to.eql('300.00'));",
        ],
      }),
      req({
        name: "List without token (401)",
        path: "/transactions",
        auth: "none",
        tests: [status(401)],
      }),
    ]),

    folder("4. Reports", [
      req({
        name: "Monthly report",
        path: "/reports/monthly?month=10&year=2026",
        tests: [
          status(200),
          "const r = pm.response.json();",
          "pm.test('Totals are correct', () => { pm.expect(r.totalIncome).to.eql('15000.00'); pm.expect(r.totalExpenses).to.eql('300.00'); pm.expect(r.balance).to.eql('14700.00'); });",
        ],
      }),
      req({
        name: "Report for an empty month",
        path: "/reports/monthly?month=1&year=2026",
        tests: [
          status(200),
          "pm.test('All zero', () => pm.expect(pm.response.json().balance).to.eql('0.00'));",
        ],
      }),
      req({
        name: "Invalid month (400)",
        path: "/reports/monthly?month=13&year=2026",
        tests: [status(400)],
      }),
      req({
        name: "Missing year (400)",
        path: "/reports/monthly?month=10",
        tests: [status(400)],
      }),
    ]),

    folder("5. Security: second user cannot touch first user data", [
      req({
        name: "Register second user",
        method: "POST",
        path: "/auth/register",
        auth: "none",
        body: {
          name: "Other",
          email: "other{{$timestamp}}@example.com",
          password: "{{password}}",
        },
        tests: [status(201), save("token2", "pm.response.json().data.token")],
      }),
      req({
        name: "Other user GET transaction (404)",
        path: "/transactions/{{transactionId}}",
        auth: "token2",
        tests: [status(404)],
      }),
      req({
        name: "Other user PATCH transaction (404)",
        method: "PATCH",
        path: "/transactions/{{transactionId}}",
        auth: "token2",
        body: { amount: 1 },
        tests: [status(404)],
      }),
      req({
        name: "Other user DELETE transaction (404)",
        method: "DELETE",
        path: "/transactions/{{transactionId}}",
        auth: "token2",
        tests: [status(404)],
      }),
      req({
        name: "Other user DELETE category (404)",
        method: "DELETE",
        path: "/categories/{{expenseCategoryId}}",
        auth: "token2",
        tests: [status(404)],
      }),
      req({
        name: "Other user list is empty",
        path: "/transactions",
        auth: "token2",
        tests: [
          status(200),
          "pm.test('No data leaked', () => pm.expect(pm.response.json().pagination.total).to.eql(0));",
        ],
      }),
      req({
        name: "Other user report is zero",
        path: "/reports/monthly?month=10&year=2026",
        auth: "token2",
        tests: [
          status(200),
          "pm.test('All zero', () => pm.expect(pm.response.json().totalIncome).to.eql('0.00'));",
        ],
      }),
    ]),

    folder("6. Cleanup", [
      req({
        name: "Delete transaction",
        method: "DELETE",
        path: "/transactions/{{transactionId}}",
        tests: [status(200)],
      }),
      req({
        name: "Deleted transaction is gone (404)",
        path: "/transactions/{{transactionId}}",
        tests: [status(404)],
      }),
    ]),
  ],
};

writeFileSync(
  "docs/postman_collection.json",
  JSON.stringify(collection, null, 2),
);
console.log("Created docs/postman_collection.json");
