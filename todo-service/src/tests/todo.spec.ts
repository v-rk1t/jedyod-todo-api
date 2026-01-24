import { describe, it, expect } from 'bun:test'

const BASE_URL = 'http://localhost:3000'

const validateEnvelope = (body: any, expectedCount: number) => {
	expect(body).toHaveProperty('count', expectedCount)
	expect(body).toHaveProperty('data')
	expect(body.data).toBeArrayOfSize(expectedCount)
	expect(body).toHaveProperty('message')
}

describe('Todo API Tests', () => {
	let sharedId: number
	let bulkIds: number[] = []

	describe('Single Operations (/todo)', () => {
		it('POST - should create a single todo', async () => {
			const res = await fetch(`${BASE_URL}/todo`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title: '  Clean my room  ' })
			})
			const body = await res.json()

			expect(res.status).toBe(201)
			validateEnvelope(body, 1)
			expect(body.data[0].title).toBe('Clean my room')
			sharedId = body.data[0].id
		})

		it('GET - should fetch a todo by ID', async () => {
			const res = await fetch(`${BASE_URL}/todo/${sharedId}`)
			const body = await res.json()

			expect(res.status).toBe(200)
			validateEnvelope(body, 1)
			expect(body.data[0].id).toBe(sharedId)
		})

		it('PATCH - should update a todo', async () => {
			const res = await fetch(`${BASE_URL}/todo/${sharedId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ completed: true })
			})
			const body = await res.json()

			expect(res.status).toBe(200)
			expect(body.data[0].completed).toBe(true)
		})
	})

	describe('Bulk Operations (/todos)', () => {
		it('POST - should create multiple todos', async () => {
			const payload = [
				{ title: 'Bulk 1' },
				{ title: 'Bulk 2' },
				{ title: 'Bulk 3' }
			]
			const res = await fetch(`${BASE_URL}/todos`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			})
			const body = await res.json()

			expect(res.status).toBe(201)
			validateEnvelope(body, 3)
			bulkIds = body.data.map((t: any) => t.id)
		})

		it('PATCH - should update multiple todos at once', async () => {
			const res = await fetch(`${BASE_URL}/todos`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					ids: bulkIds,
					completed: true
				})
			})
			const body = await res.json()

			expect(res.status).toBe(200)
			validateEnvelope(body, bulkIds.length)
			expect(body.data.every((t: any) => t.completed === true)).toBe(true)
		})
	})

	describe('Error & Constraint Handling', () => {
		it('404 - should return specific missing IDs on bulk failure', async () => {
			const res = await fetch(`${BASE_URL}/todos`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					ids: [sharedId, 999999],
					title: 'New Title'
				})
			})
			const body = await res.json()

			expect(res.status).toBe(404)
			expect(body.message).toContain('Update failed. Missing IDs: 999999')
		})

		it('400 - should reject bulk create over limit (10 items)', async () => {
			const hugePayload = Array(11).fill({ title: 'Too many' })
			const res = await fetch(`${BASE_URL}/todos`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(hugePayload)
			})
			const body = await res.json()

			expect(res.status).toBe(400)
			expect(body.code).toBe('VALIDATION')
			expect(body.errors[0].message).toBe('Batch operation must contain between 1 and 10 items')
		})

		it('400 - should reject out-of-range Int32 IDs', async () => {
			const res = await fetch(`${BASE_URL}/todo/3000000000`)
			const body = await res.json()

			expect(res.status).toBe(400)
			expect(body.errors[0].message).toBe('ID must be a positive integer within 32-bit range (1 to 2,147,483,647)')
		})
	})

	describe('Cleanup', () => {
		it('DELETE - should remove created items', async () => {
			const allIds = [sharedId, ...bulkIds]
			const res = await fetch(`${BASE_URL}/todos`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ids: allIds })
			})
			expect(res.status).toBe(200)
		})
	})
})
