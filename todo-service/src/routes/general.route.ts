import { Elysia, t } from 'elysia'

const defaultText = `📝 Todo API running at ${process.env.BASE_URL}
📑 Swagger available at ${process.env.BASE_URL}/docs`

export const generalRoutes = new Elysia().get(
	'/',
	({ set }) => {
		set.status = 418
		return defaultText
	},
	{
		response: { 418: t.String() },
		detail: {
			tags: ['General'],
			summary: "I'm a teapot"
		}
	}
)
