// export const ENV_PROTOCOL = import.meta.env.VITE_PROTOCOL
import { version } from '../../package.json'

export const VERSION = version

const url = new URL(window.location.href)

export const QUERY = Object.fromEntries(url.searchParams.entries())

export const IS_CONTROL = 'control' in QUERY

export const PROTOCOL = QUERY.protocol || import.meta.env.VITE_PROTOCOL || 'https'

export const HOST = QUERY.host || import.meta.env.VITE_HOST

export const PORT = QUERY.port || import.meta.env.VITE_PORT

export const NAME = QUERY.name || import.meta.env.VITE_NAME

export const FPS = QUERY.fps || 30

export const SOCKET_URL = `${PROTOCOL === 'https' ? 'wss' : 'ws'}://${HOST}${PORT ? ':' + PORT : ''}/api/ws?name=${NAME}`

export const BASE_URL = `${PROTOCOL}://${HOST}${PORT ? ':' + PORT : ''}/api`

export const IMG_URL = `${BASE_URL}/stream`

export const WIDTH = parseInt(QUERY.width || import.meta.env.VITE_WIDTH || 512)

export const HEIGHT = parseInt(QUERY.height || import.meta.env.VITE_HEIGHT || 512)

export const CODES = {
	NON_ACTIVE_PUBLISH: 'non_active_publish',
}

export const FILTERS_SCHEMA = {
	brightness: {
		default: 1,
		min: 0,
		max: 4,
		step: 0.1,
	},
	contrast: {
		default: 1,
		min: 0,
		max: 5,
		step: 0.1,
	},
	'hue-rotate': {
		label: 'hue',
		default: 0,
		min: -180,
		max: 180,
		step: 1,
	},
	saturate: {
		default: 1,
		min: 0,
		max: 5,
		step: 0.1,
	},
	// sepia: {
	// 	min: 0,
	// 	max: 1,
	// 	default: 0,
	// },
	grayscale: {
		default: 0,
		min: 0,
		max: 1,
		step: 0.1,
	},
	blur: {
		default: 0,
		min: 0,
		max: 10,
		step: 1,
	},
}

export const FILTER_LIST = Object.keys(FILTERS_SCHEMA).map(k => ({ name: k, ...FILTERS_SCHEMA[k] }))
