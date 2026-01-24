import { describe, it, expect } from 'bun:test'

const BASE_URL = 'http://localhost:3000'
const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/

describe('Todo scenario', () => {
	let todoId: number
	const todoTitle = 'Visit the Colosseum'

	it('POST - should create a single todo', async () => {
		const res = await fetch(`${BASE_URL}/todo`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ title: `  ${todoTitle}  ` })
		})
		const body = await res.json()

		expect(res.status).toBe(201)
		expect(body.data).toHaveLength(1)
		expect(body.data[0]).toStrictEqual({
			id: expect.any(Number),
			title: todoTitle,
			completed: false,
			createdAt: expect.stringMatching(isoDateRegex),
			updatedAt: expect.stringMatching(isoDateRegex)
		})
		todoId = body.data[0].id
	})

	it('GET - should fetch a todo by ID', async () => {
		const res = await fetch(`${BASE_URL}/todo/${todoId}`)
		const body = await res.json()

		expect(res.status).toBe(200)
		expect(body.data).toHaveLength(1)
		expect(body.data[0]).toStrictEqual({
			id: todoId,
			title: todoTitle,
			completed: false,
			createdAt: expect.stringMatching(isoDateRegex),
			updatedAt: expect.stringMatching(isoDateRegex)
		})
	})

	it('PATCH - should update a todo', async () => {
		const res = await fetch(`${BASE_URL}/todo/${todoId}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ completed: true })
		})
		const body = await res.json()

		expect(res.status).toBe(200)
		expect(body.data).toHaveLength(1)
		expect(body.data[0]).toStrictEqual({
			id: todoId,
			title: todoTitle,
			completed: true,
			createdAt: expect.stringMatching(isoDateRegex),
			updatedAt: expect.stringMatching(isoDateRegex)
		})
	})

	it('DELETE - should delete a todo', async () => {
		const res = await fetch(`${BASE_URL}/todo/${todoId}`, {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' }
		})
		const body = await res.json()

		expect(res.status).toBe(200)
		expect(body.data).toHaveLength(1)
		expect(body).toStrictEqual({
			count: 1,
			data: [
				{
					id: todoId,
					title: todoTitle,
					completed: true,
					createdAt: expect.stringMatching(isoDateRegex),
					updatedAt: expect.stringMatching(isoDateRegex)
				}
			],
			message: 'Successfully deleted todo'
		})
	})
})

describe('Todos scenario', () => {
	let todoIds: number[] = []

	it('POST - should create multiple todos', async () => {
		const payload = [
			{ title: 'Take an authentic matcha from Japan', completed: true },
			{ title: 'Eat Indian cuisine', completed: false },
			{ title: 'Learn to walk like an Egyptian' }
		]

		const res = await fetch(`${BASE_URL}/todos`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		})

		const body = await res.json()

		expect(res.status).toBe(201)
		expect(body.data).toHaveLength(3)

		todoIds = body.data.map((t: any) => t.id)
	})

	it('GET - should fetch all todos', async () => {
		const res = await fetch(`${BASE_URL}/todos`)
		expect(res.status).toBe(200)
	})

	it('PATCH - should update multiple todos', async () => {
		const res = await fetch(`${BASE_URL}/todos`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				ids: todoIds,
				completed: true
			})
		})
		const body = await res.json()

		expect(res.status).toBe(200)
		expect(body.count).toBe(3)
		expect(body.data.every((t: any) => t.completed === true)).toBe(true)
	})

	it('DELETE - should delete multiple todos', async () => {
		const res = await fetch(`${BASE_URL}/todos`, {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ ids: todoIds })
		})
		const body = await res.json()

		expect(res.status).toBe(200)
		expect(body.count).toBe(3)
		expect(body.data).toHaveLength(3)
	})
})

describe('Error Handling', () => {
	it('404 - should return specific missing IDs on bulk failure', async () => {
		const createRes = await fetch(`${BASE_URL}/todo`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				title: 'Prevent the boss to reach the truth'
			})
		})
		const createBody = await createRes.json()
		const todoId = createBody.data[0].id
		const missId = 999999

		const res = await fetch(`${BASE_URL}/todos`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				ids: [todoId, missId],
				title: 'Retrieve the Stand disc'
			})
		})
		const body = await res.json()

		expect(res.status).toBe(404)
		expect(body).toStrictEqual({
			code: 'NOT_FOUND',
			message: `Update failed. Missing IDs: ${missId}`,
			timestamp: expect.stringMatching(isoDateRegex)
		})
	})

	it('400 - should reject multiple create over limit (10 todos)', async () => {
		const hugePayload = Array(11).fill({ title: 'Too many' })
		const res = await fetch(`${BASE_URL}/todos`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(hugePayload)
		})
		const body = await res.json()

		expect(res.status).toBe(400)
		expect(body).toStrictEqual({
			code: 'VALIDATION',
			message: 'Validation Failed',
			timestamp: expect.stringMatching(isoDateRegex),
			errors: [
				{
					field: 'unknown',
					message:
						'Batch operation must contain between 1 and 10 todos',
					found: hugePayload
				}
			]
		})
	})

	it('400 - should reject out-of-range Int32 IDs', async () => {
		const res = await fetch(`${BASE_URL}/todo/3000000000`)
		const body = await res.json()

		expect(res.status).toBe(400)
		expect(body.errors[0].message).toBe(
			'ID must be a positive integer within 32-bit range (1 to 2,147,483,647)'
		)
	})
})
