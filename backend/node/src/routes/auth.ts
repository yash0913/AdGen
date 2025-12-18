import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { User } from '../models/User.model'

const router = Router()

function signToken(userId: string) {
  const secret = process.env.JWT_SECRET || 'dev_secret'
  return jwt.sign({ sub: userId }, secret, { expiresIn: '7d' })
}

router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body as { name: string; email: string; password: string }
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' })
    }
    const emailNorm = String(email).trim().toLowerCase()
    const existing = await User.findOne({ email: emailNorm })
    const passwordHash = await bcrypt.hash(password, 10)
    let user
    if (existing) {
      if ((existing as any).passwordHash) {
        return res.status(409).json({ message: 'Email already in use' })
      } else {
        existing.passwordHash = passwordHash as any
        existing.name = name
        user = await existing.save()
      }
    } else {
      user = await User.create({ name, email: emailNorm, passwordHash })
    }
    const token = signToken(user.id)
    return res.json({ token, user: { id: user.id, name: user.name, email: user.email } })
  } catch (err) {
    console.error('Signup error:', err)
    return res.status(500).json({ message: 'Signup failed' })
  }
})

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as { email: string; password: string }
    if (!email || !password) {
      return res.status(400).json({ message: 'Missing credentials' })
    }
    const emailNorm = String(email).trim().toLowerCase()
    const user = await User.findOne({ email: emailNorm })
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }
    if (typeof user.passwordHash !== 'string' || !user.passwordHash) {
      console.error('Login error: user has no passwordHash field', { userId: user.id, email: user.email })
      return res.status(400).json({ message: 'Account not configured for password login. Please sign up again.' })
    }
    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }
    const token = signToken(user.id)
    return res.json({ token, user: { id: user.id, name: user.name, email: user.email } })
  } catch (err) {
    console.error('Login error:', err)
    return res.status(500).json({ message: 'Login failed' })
  }
})

export default router
