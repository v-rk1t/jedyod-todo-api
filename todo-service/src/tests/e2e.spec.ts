import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { api } from '@/src/helpers/apiClient'
import { isoDateRegex } from '@/src/helpers/regex'
import { type Todo } from '@/generated/prisma/client'

beforeAll(async () => {
	const { data } = await api.post('/auth', { username: 'bun_test' })
	api.setToken(data.token)
})

describe('E2E Todo scenario', () => {
	let todoId: number
	const todoTitle = 'Visit the Colosseum'

	it('POST - should create a single todo', async () => {
		const { data, status } = await api.post('/todo', {
			title: `  ${todoTitle}  `
		})

		expect(status).toBe(201)
		expect(data.data).toHaveLength(1)
		expect(data.data[0]).toStrictEqual({
			id: expect.any(Number),
			title: todoTitle,
			completed: false,
			createdAt: expect.stringMatching(isoDateRegex),
			updatedAt: expect.stringMatching(isoDateRegex)
		})
		todoId = data.data[0].id
	})

	it('GET - should fetch a todo by ID', async () => {
		const { data, status } = await api.get(`/todo/${todoId}`)

		expect(status).toBe(200)
		expect(data.data).toHaveLength(1)
		expect(data.data[0]).toStrictEqual({
			id: todoId,
			title: todoTitle,
			completed: false,
			createdAt: expect.stringMatching(isoDateRegex),
			updatedAt: expect.stringMatching(isoDateRegex)
		})
	})

	it('PATCH - should update a todo', async () => {
		const { data, status } = await api.patch(`/todo/${todoId}`, {
			completed: true
		})

		expect(status).toBe(200)
		expect(data.data).toHaveLength(1)
		expect(data.data[0]).toStrictEqual({
			id: todoId,
			title: todoTitle,
			completed: true,
			createdAt: expect.stringMatching(isoDateRegex),
			updatedAt: expect.stringMatching(isoDateRegex)
		})
	})

	it('DELETE - should delete a todo', async () => {
		const { data, status } = await api.delete(`/todo/${todoId}`)

		expect(status).toBe(200)
		expect(data.data).toHaveLength(1)
		expect(data).toStrictEqual({
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

describe('E2E Todos scenario', () => {
	let todoIds: number[] = []

	it('POST - should create multiple todos', async () => {
		const payload = [
			{
				title: 'Take an authentic matcha from Japan',
				completed: true
			},
			{ title: 'Eat Indian cuisine', completed: false },
			{ title: 'Learn to walk like an Egyptian' }
		]

		const { data, status } = await api.post('/todos', payload)

		expect(status).toBe(201)
		expect(data.data).toHaveLength(3)
		todoIds = data.data.map((t: any) => t.id)
	})

	it('GET - should fetch all todos', async () => {
		const { data, status } = await api.get('/todos')

		expect(status).toBe(200)
		// body.forEach becomes data.forEach based on your client structure
		data.forEach((todo: Todo) => {
			expect(todo).toEqual(
				expect.objectContaining({
					id: expect.any(Number),
					title: expect.any(String),
					completed: expect.any(Boolean),
					createdAt: expect.stringMatching(isoDateRegex),
					updatedAt: expect.stringMatching(isoDateRegex)
				})
			)
		})
	})

	it('PATCH - should update multiple todos', async () => {
		const { data, status } = await api.patch('/todos', {
			ids: todoIds,
			completed: true
		})

		expect(status).toBe(200)
		expect(data.count).toBe(3)
		expect(data.data.every((t: any) => t.completed === true)).toBe(true)
	})

	it('DELETE - should delete multiple todos', async () => {
		const { data, status } = await api.delete('/todos', {
			ids: todoIds
		})

		expect(status).toBe(200)
		expect(data.count).toBe(3)
		expect(data.data).toHaveLength(3)
	})
})

afterAll(async () => {
	const reset = await api.post('/tools/reset')
	const seed = await api.post('/tools/seed')
	expect(reset.status).toBe(200)
	expect(seed.status).toBe(200)
})
