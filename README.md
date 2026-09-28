# Expense Tracker

A simple expense tracker built with plain HTML, CSS and JavaScript. No build step, no dependencies.

## Live demo

Try it here: https://abhishek820-cyber.github.io/expense-tracker-ABHISHEK_RP/

## Run it

1. Clone the repository.
2. Open `index.html` in any modern browser (or run `npx serve .` / `python3 -m http.server` and visit the printed address).

## Features

- Add income or expense transactions with amount, category, date and description
- Edit and delete transactions
- Total income, total expenses and current balance
- Filter by type, category and month
- Data saved in browser Local Storage, so it stays after a refresh
- Responsive layout for desktop and mobile, with automatic dark mode
- Bonus: monthly summary, category-wise expense chart, and form validation with clear error messages

## Files

- `index.html` – page structure
- `style.css` – styles and responsive layout
- `script.js` – app logic and Local Storage handling

## Notes

Amounts are shown in INR. To change the currency, edit the `money` formatter at the top of `script.js`.
