import { Elysia } from 'elysia'
import swagger from '@elysiajs/swagger'
import { generalRoutes } from '@/src/routes/general.route'
import { todoRoutes } from '@/src/routes/todo.route'
import { todosRoutes } from '@/src/routes/todos.route'
import { toolRoutes } from '@/src/routes/tools.route'

const app = new Elysia()
	.onError(({ code, error, set }) => {
		const timestamp = new Date().toISOString()

		if (code === 'INTERNAL_SERVER_ERROR') console.error(error)

		switch (code) {
			case 'NOT_FOUND':
				set.status = 404
				return { code, message: error.message, timestamp }

			case 'VALIDATION':
				set.status = 400
				return {
					code,
					message: 'Validation Failed',
					timestamp,
					errors: error.all.map((err: any) => ({
						field: err.path ? err.path.replace('/', '') : 'unknown',
						message:
							err.schema?.error || err.summary || err.message,
						found: err.value
					}))
				}

			default:
				set.status = 500
				return {
					code: 'INTERNAL_ERROR',
					message: 'An unexpected error occurred',
					timestamp
				}
		}
	})
	.use(
		swagger({
			path: '/docs',
			documentation: {
				info: {
					title: 'Todo API Documentation',
					version: '1.0.0',
					description:
						'Jedyod todo api service for API test automation practices'
				},
				tags: [
					{ name: 'General', description: 'Health and Info' },
					{ name: 'Todo', description: 'Single item operations' },
					{ name: 'Todos', description: 'Bulk operations' }
				]
			}
		})
	)
	.use(generalRoutes)
	.use(todoRoutes)
	.use(todosRoutes)
	.use(toolRoutes)

app.listen(3000)

console.log(`🚀 Server running at ${app.server?.hostname}:${app.server?.port}`)
