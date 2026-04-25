# tailf

A Node.js HTTP server that streams a log file to clients in real-time, mimicking the behavior of the Unix `tail -f` command over HTTP.

## How it works

The server watches a log file (`app.log`) for changes and pushes new content to connected clients using **Server-Sent Events (SSE)**. A long-polling implementation is also included (currently inactive).

## API

| Endpoint | Description |
|---|---|
| `GET /tail?n=<num>` | Returns the last N lines of the log file along with the current byte offset |
| `GET /updates?offset=<num>` | Opens an SSE stream and pushes new log content as it is appended |

### SSE Events

- `append` — new lines were added to the log
- `reset` — the log file was truncated or rotated; client should re-fetch from offset 0

## Getting started

```bash
npm install
node tailf.js
```

Server starts on port **3000**.

## Project structure

```
tailf.js             # Entry point — file reading logic and Express routes
sseManager.js        # Manages SSE client connections and pushes updates
longPollManager.js   # Alternative long-polling transport (inactive)
package.json
```
