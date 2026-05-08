import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { AppEnv } from '#types.js'
import { requestIdMiddleware } from '#middleware/requestId.js'
import { sessionMiddleware } from '#middleware/session.js'
import { errorHandler } from '#middleware/errorHandler.js'
import { auditLogMiddleware } from '#middleware/auditLog.js'
import membersRouter from '#interfaces/http/members/router.js'
import authRouter from '#interfaces/http/auth/router.js'
import moviesRouter from '#interfaces/http/movies/router.js'
import reservationsRouter from '#interfaces/http/reservations/router.js'

const app = new Hono<AppEnv>()

app.use(
  '/api/*',
  cors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  }),
)

app.use('/api/*', requestIdMiddleware)
app.use('/api/*', sessionMiddleware)
app.use('/api/*', auditLogMiddleware)

app.route('/api', membersRouter)
app.route('/api', authRouter)
app.route('/api', moviesRouter)
app.route('/api', reservationsRouter)

app.onError(errorHandler)
app.get('/health', (c) => c.json({ status: 'ok' }))

const port = Number(process.env.PORT ?? 3000)
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
