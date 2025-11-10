const express = require('express')
const cors = require('cors')
const { WebSocketServer } = require('ws')
const fs = require('fs')
const path = require('path')

const app = express()
app.use(cors())

const PROMPT_PATH = path.join(process.cwd(), 'prompt.md')

app.get('/prompt', (_req, res) => {
  try {
    const txt = fs.readFileSync(PROMPT_PATH, 'utf-8')
    res.json({ ok: true, prompt: txt })
  } catch (e) {
    res.status(404).json({ ok: false, error: 'prompt.md not found' })
  }
})

const server = app.listen(4001, () => {
  console.log('Prompt server listening on http://localhost:4001')
})

const wss = new WebSocketServer({ server })

fs.watch(process.cwd(), { persistent: true }, (eventType, filename) => {
  if (filename === 'prompt.md') {
    try {
      const txt = fs.readFileSync(PROMPT_PATH, 'utf-8')
      wss.clients.forEach((client) => {
        try { client.send(JSON.stringify({ type: 'prompt_update', prompt: txt })) } catch {}
      })
    } catch {}
  }
})