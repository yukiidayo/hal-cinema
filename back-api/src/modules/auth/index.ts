import { Hono } from 'hono'
import type { AppEnv } from '../../types.js'
import { getMe, sendOtp, verifyOtp, logout } from './handlers.js'

const router = new Hono<AppEnv>()

router.get('/auth/me', getMe)
router.post('/auth/otp/send', sendOtp)
router.post('/auth/otp/verify', verifyOtp)
router.post('/auth/logout', logout)

export default router
