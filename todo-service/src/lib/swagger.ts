import { Elysia } from 'elysia'
import swagger from '@elysiajs/swagger'

export const swaggerConfig = new Elysia().use(
	swagger({
		path: '/docs',
		documentation: {
			info: {
				title: 'Todo API Documentation',
				version: '1.0.0',
				description:
					'Jedyod todo api service for API test automation practices'
			},
			components: {
				securitySchemes: {
					BearerAuth: {
						type: 'http',
						scheme: 'bearer',
						bearerFormat: 'JWT'
					}
				}
			},
			tags: [
				{ name: 'Auth', description: 'Authentication operations' },
				{ name: 'General', description: 'Health and Info' },
				{ name: 'Todo', description: 'Single item operations' },
				{ name: 'Todos', description: 'Bulk operations' }
			]
		}
	})
)
