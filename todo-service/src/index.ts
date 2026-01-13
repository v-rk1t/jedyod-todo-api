import { Elysia } from 'elysia'
import { todoRoutes } from '@/src/routes/todo'
import swagger from '@elysiajs/swagger'

const app = new Elysia()
	.get('/', () => '📝 Todo API is ready!')
	.use(
		swagger({
			path: '/docs',
			documentation: {
				info: {
					title: 'Todo API Documentation',
					version: '1.0.0'
				}
			}
		})
	)
	.use(todoRoutes)
app.listen(3000)

console.log('📝 Todo API running at http://localhost:3000')
console.log('📑 Swagger available at http://localhost:3000/docs')
