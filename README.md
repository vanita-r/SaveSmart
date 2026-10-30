# SaveSmart

A personal savings dashboard built with **HTML, CSS, and JavaScript**. SaveSmart helps you set savings goals, record deposits and withdrawals, celebrate milestones, and estimate how long it may take to reach a goal.


## Features

- Create, edit, and customize savings goals
- Track deposits and withdrawals per goal
- Automatically calculate total savings, remaining balances, and progress percentages
- Milestone notifications for an emergency fund. Example:
  - $100 — First milestone
  - $250 — Building momentum
  - $500 — Halfway to a $1,000 starter emergency fund
  - $1,000 — Starter emergency fund complete
- Percentage-based celebrations for every goal (25%, 50%, 75%, and 100%)
- Monthly savings planner with an estimated completion date
- Responsive layout for desktop

## Future Plans

### Personal finance planning
- Add income sources and pay frequency (weekly, biweekly, monthly)
- Add recurring expenses and essential spending
- Add a savings allocation tool (for example, 10% from one paycheck and 10% from another)
- Add custom milestone amounts and dates
- Add export/import backup (JSON or CSV)
- Add charts for contributions over time

### Log in / Sign up
- Add a sign up and log in page for users
- Set up Supabase or Firebase for authentication and databases
  - Will be responsible for 3 tables: Users, SavingsGoals, Transactions

### AI financial coach
A future AI feature could accept a user's goals, income, pay frequency, recurring expenses, and target dates, then propose a realistic savings allocation and explain tradeoffs.

## Tech stack

- HTML5
- CSS3
- JavaScript (ES6+)
- Browser `localStorage`
- Native HTML `<dialog>` for modals

## Project structure

```text
savesmart/
├── index.html
├── styles.css
├── app.js
└── README.md
```
