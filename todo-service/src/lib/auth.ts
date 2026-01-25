import { Elysia, t } from 'elysia'
import { jwt } from '@elysiajs/jwt'

export const authRoutes = new Elysia()
	.use(
		jwt({
			name: 'jwt',
			secret: process.env.JWT_SECRET || 'local-test',
			exp: '1h'
		})
	)
	.post(
		'/auth',
		async ({ jwt, body }) => {
			const token = await jwt.sign({
				username: body.username,
				sub: body.username
			})

			return {
				token,
				type: 'Bearer',
				message: 'Authentication successful'
			}
		},
		{
			body: t.Object({
				username: t.String({ minLength: 3 })
			}),
			detail: { tags: ['Auth'], summary: 'Generate a test token' }
		}
	)
