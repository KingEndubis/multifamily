import express, { Request, Response } from 'express'
import cors from 'cors'
import { WebSocketServer } from 'ws'
import fs from 'fs'
import path from 'path'

const app = express()
app.use(cors())

const PROMPT_PATH = path.join(process.cwd(), 'prompt.md')

app.get('/prompt', (_req: Request, res: Response) => {
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
      wss.clients.forEach((client: any) => {
        client.send(JSON.stringify({ type: 'prompt_update', prompt: txt }))
      })
    } catch {}
  }
})