# Argent

A chart-first, mobile balance journal. Record how much remains in each channel, carry unchanged balances forward, and inspect cash, total money, or net worth over time.

## Run

```sh
npm install
npm run dev
```

The Vite app runs on `http://localhost:5173` and proxies its API to the Express server on `http://localhost:3001`.

```sh
npm run build
npm start
```

Production data is stored in `data/argent.sqlite`. Set `ARGENT_DATA_DIR` to change the location.
