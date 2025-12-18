import { Router, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { Event } from '../models/Event.model'

const router = Router()

function getUserIdFromAuthHeader(req: Request): string | undefined {
  const auth = req.headers.authorization
  if (!auth) return undefined
  const [scheme, token] = auth.split(' ')
  if (scheme !== 'Bearer' || !token) return undefined
  try {
    const secret = process.env.JWT_SECRET || 'dev_secret'
    const payload = jwt.verify(token, secret) as any
    return payload.sub as string
  } catch {
    return undefined
  }
}

router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromAuthHeader(req)
    const { eventType, path, metadata } = req.body as { eventType: string; path?: string; metadata?: Record<string, any> }
    if (!eventType) return res.status(400).json({ message: 'eventType is required' })
    const doc = await Event.create({ userId, eventType, path, metadata })
    return res.json({ ok: true, id: doc.id })
  } catch (err) {
    return res.status(500).json({ message: 'Event logging failed' })
  }
})

export default router
