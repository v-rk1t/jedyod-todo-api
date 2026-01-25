import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { api } from '@/src/helpers/apiClient'
import { isoDateRegex } from '@/src/helpers/regex'

beforeAll(async () => {
	const { data } = await api.post('/auth', { username: 'bun_test' })
	api.setToken(data.token)
})

describe('/todos PATCH - update todos', () => {
	it('should return 404 and error message when one or more of provided ids not found', async () => {
		const { data: createData } = await api.post('/todo', {
			title: 'Prevent the boss to reach the truth'
		})
		const todoId = createData.data[0].id
		const missId = 999999

		const { data, status } = await api.patch('/todos', {
			ids: [todoId, missId],
			title: 'Retrieve the Stand disc'
		})

		expect(status).toBe(404)
		expect(data).toStrictEqual({
			code: 'NOT_FOUND',
			message: `Update failed. Missing IDs: ${missId}`,
			timestamp: expect.stringMatching(isoDateRegex)
		})
	})

	it('should return 400 when IDs are not Int32 (out of range)', async () => {
		const { data, status } = await api.patch('/todos', {
			ids: [3000000000],
			completed: true
		})

		expect(status).toBe(400)
		expect(data.message).toContain('32-bit range')
	})

	it('should return 401 and error message when no authorization in headers', async () => {
		const { data, status } = await api.patch(
			'/todos',
			{ ids: [1, 2], title: 'Breakout of jail' },
			{ useAuth: false }
		)

		expect(status).toBe(401)
		expect(data).toStrictEqual({
			code: 'UNAUTHORIZED',
			message: 'Missing token'
		})
	})
})

describe('/todos POST - create todos', () => {
	const errorMessage = 'Batch operation must contain between 1 and 10 todos'
	const cases = [
		{
			description: 'array is empty',
			payload: [],
			message: errorMessage
		},
		{
			description: 'exceeding max multiple todos limit (11 items)',
			payload: Array(11).fill({ title: 'Task' }),
			message: errorMessage
		},
		{
			description: 'missing title in one of the todos',
			payload: [{ title: 'Valid' }, { completed: true }],
			message:
				"Expected property '1.title' to be string but found: undefined"
		},
		{
			description: 'whitespace-only title',
			payload: [{ title: '   ' }],
			message: 'Expected string length greater or equal to 1'
		}
	]

	cases.forEach(({ description, payload, message }) => {
		it(`should return 400 and error message when ${description}`, async () => {
			const { data, status } = await api.post('/todos', payload)

			expect(status).toBe(400)
			expect(data).toStrictEqual({
				code: 'VALIDATION',
				message: `Validation Failed: ${message}`,
				timestamp: expect.stringMatching(isoDateRegex)
			})
		})
	})

	it('should return 401 and error message when no authorization in headers', async () => {
		const { data, status } = await api.post(
			'/todos',
			[{ title: 'One' }, { title: 'Two' }],
			{ useAuth: false }
		)

		expect(status).toBe(401)
		expect(data).toStrictEqual({
			code: 'UNAUTHORIZED',
			message: 'Missing token'
		})
	})
})

describe('/todos DELETE - delete todos', () => {
	it('should return 400 and error message when ids property is not an array', async () => {
		const { data, status } = await api.delete('/todos', { ids: {} })

		expect(status).toBe(400)
		expect(data).toStrictEqual({
			code: 'VALIDATION',
			message:
				'Validation Failed: ID must be a positive integer within 32-bit range (1 to 2,147,483,647)',
			timestamp: expect.stringMatching(isoDateRegex)
		})
	})

	it('should return 401 and error message when no authorization in headers', async () => {
		const { data, status } = await api.delete(
			'/todos',
			{ ids: [1, 2] },
			{ useAuth: false }
		)

		expect(status).toBe(401)
		expect(data).toStrictEqual({
			code: 'UNAUTHORIZED',
			message: 'Missing token'
		})
	})
})

afterAll(async () => {
	const reset = await api.post('/tools/reset')
	const seed = await api.post('/tools/seed')
	expect(reset.status).toBe(200)
	expect(seed.status).toBe(200)
})
