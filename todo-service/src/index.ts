import { Elysia } from 'elysia'
import jwt from '@elysiajs/jwt'
import { authRoutes } from '@/src/lib/auth'
import { swaggerConfig } from '@/src/lib/swagger'
import { generalRoutes } from '@/src/routes/general.route'
import { todoRoutes } from '@/src/routes/todo.route'
import { todosRoutes } from '@/src/routes/todos.route'
import { toolsRoutes } from '@/src/routes/tools.route'
import { appErrorModel } from '@/src/models/todo.model'

const app = new Elysia()
	.use(appErrorModel)
	.use(swaggerConfig)
	.use(jwt({ name: 'jwt', secret: process.env.JWT_SECRET || 'local-test' }))
	.use(authRoutes)
	.use(generalRoutes)
	.use(toolsRoutes)
	.onRequest(async ({ jwt, request, set }) => {
		const url = new URL(request.url)
		const path = url.pathname

		const isPublic =
			[
				'/auth',
				'/tools/seed',
				'/tools/reset',
				'/tools/health',
				'/docs'
			].some((p) => path.startsWith(p)) || path === '/'

		if (isPublic) return

		const auth = request.headers.get('authorization')

		if (!auth?.startsWith('Bearer ')) {
			set.status = 401
			return { code: 'UNAUTHORIZED', message: 'Missing token' }
		}

		const token = auth.split(' ')[1]
		const payload = await jwt.verify(token)

		if (!payload) {
			set.status = 401
			return { code: 'UNAUTHORIZED', message: 'Invalid or expired token' }
		}
	})
	.use(todoRoutes)
	.use(todosRoutes)

app.listen(3000)

console.log(
	`📝 API Server running at ${app.server?.hostname}:${app.server?.port}`
)
