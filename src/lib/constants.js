import { version } from '../../package.json'

export const VERSION = version

const url = new URL(window.location.href)

export const QUERY = Object.fromEntries(url.searchParams.entries())

export const IS_CONTROL = 'control' in QUERY

export const IS_MOBILE = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

export const MOBILE_CONTROL = IS_MOBILE && IS_CONTROL

export const OFFLINE = 'offline' in QUERY

export const PROTOCOL = QUERY.protocol || import.meta.env.VITE_PROTOCOL || 'https'

export const HOST = QUERY.host || import.meta.env.VITE_HOST

export const PORT = QUERY.port || import.meta.env.VITE_PORT

export const NAME = QUERY.name || 'nobody'

export const FPS = QUERY.fps || 30

export const BASE_URL = `${PROTOCOL}://${HOST}${PORT ? ':' + PORT : ''}/api`

export const WIDTH = parseInt(QUERY.width || 904)

export const HEIGHT = parseInt(QUERY.height || 512)

export const RATIO = WIDTH / HEIGHT

export const ABLY_TOKEN = import.meta.env.VITE_ABLY_TOKEN

export const ABLY_CHANNEL = QUERY.channel || import.meta.env.VITE_ABLY_CHANNEL || 'tmunan_dev'

export const SCTP_CAUSE_CODES = [
	'No SCTP error',
	'Invalid stream identifier',
	'Missing mandatory parameter',
	'Stale cookie error',
	'Sender is out of resource (i.e., memory)',
	'Unable to resolve address',
	'Unrecognized SCTP chunk type received',
	'Invalid mandatory parameter',
	'Unrecognized parameters',
	'No user data (SCTP DATA chunk has no data)',
	'Cookie received while shutting down',
	'Restart of an association with new addresses',
	'User-initiated abort',
	'Protocol violation',
]

export const SIGNALING_STATES = {
	STABLE: 'stable',
	HAVE_LOCAL_OFFER: 'have-local-offer',
	HAVE_REMOTE_OFFER: 'have-remote-offer',
	HAVE_LOCAL_PRANSWER: 'have-local-pranswer',
	HAVE_REMOTE_PRANSWER: 'have-remote-pranswer',
	CLOSED: 'closed',
}

export const CONNECTION_STATES = {
	NEW: 'new',
	INITIALIZED: 'initialized',
	CONNECTING: 'connecting',
	CONNECTED: 'connected',
	DISCONNECTED: 'disconnected',
	SUSPENDED: 'suspended',
	CLOSING: 'closing',
	CLOSED: 'closed',
	FAILED: 'failed',
}

// Schema

export const PARAMETER_SCHEMA = {
	strength: {
		parameter_type: 'diffusion',
		type: 'range',
		min: 1,
		max: 2.96,
		natural_step: 0.1,
		step: 0.01,
		default: 1,
		key: 'KeyS',
	},
	guidance_scale: {
		parameter_type: 'diffusion',
		type: 'range',
		min: 0,
		max: 1,
		step: 0.1,
		default: 1,
		key: 'KeyG',
		label: 'guidance',
	},
	seed: {
		parameter_type: 'diffusion',
		type: 'range',
		min: 0,
		max: 50,
		step: 1,
		default: 1,
		key: 'KeyD',
	},
	prompt: {
		parameter_type: 'diffusion',
		type: 'text',
		default: '',
	},
	negative_prompt: {
		parameter_type: 'diffusion',
		type: 'text',
		default: '',
	},
	fps: {
		parameter_type: 'client',
		type: 'range',
		min: 1,
		max: 30,
		step: 1,
		default: 15,
		label: 'FPS',
	},
	invert: {
		parameter_type: 'filter',
		type: 'toggle',
		default: false,
		key: 'KeyI',
	},
	brightness: {
		parameter_type: 'filter',
		type: 'range',
		min: 0,
		max: 4,
		step: 0.1,
		default: 1,
		key: 'KeyB',
	},
	contrast: {
		parameter_type: 'filter',
		type: 'range',
		min: 0,
		max: 5,
		step: 0.1,
		default: 1,
		key: 'KeyC',
	},
	'hue-rotate': {
		parameter_type: 'filter',
		type: 'range',
		min: -180,
		max: 180,
		step: 1,
		natural_step: 10,
		default: 0,
		label: 'hue',
		key: 'KeyH',
	},
	saturate: {
		parameter_type: 'filter',
		type: 'range',
		min: 0,
		max: 10,
		step: 0.1,
		default: 1,
		label: 'saturation',
		key: 'KeyT',
	},
	sepia: {
		parameter_type: 'filter',
		type: 'range',
		min: 0,
		max: 1,
		step: 0.1,
		default: 0,
		key: 'KeyP',
	},
	blur: {
		parameter_type: 'filter',
		type: 'range',
		min: 0,
		max: 30,
		step: 1,
		default: 0,
		key: 'KeyU',
	},
}

const paths = {
	diffusion: 'parameters.diffusion',
	filter: 'parameters.client.filter',
	client: 'parameters.client',
}

export const RANGE_KEYS = {}

for (const k in PARAMETER_SCHEMA) {
	const a = PARAMETER_SCHEMA[k]
	a.name = k
	a.path = `${paths[a.parameter_type]}.${k}`
	if (a.key) RANGE_KEYS[a.key] = a.name
}

export const DIFFUSION_RANGES = Object.entries(PARAMETER_SCHEMA)
	.filter(([_, v]) => v.parameter_type === 'diffusion' && v.type === 'range')
	.map(([k, v]) => ({ name: k, ...v }))

export const FILTER_RANGES = Object.entries(PARAMETER_SCHEMA)
	.filter(([_, v]) => v.parameter_type === 'filter' && v.type === 'range')
	.map(([k, v]) => ({ name: k, ...v }))

export const CAMERA_PROPS = [
	{ name: 'brightness', row: 0 },
	{ name: 'contrast', row: 0 },
	{ name: 'exposureMode' },
	{ name: 'exposureTime', label: 'Exposure', parent: 'exposureMode', row: 1 },
	{ name: 'exposureCompensation', label: 'Compensation', parent: 'exposureMode', row: 1 },
	{ name: 'whiteBalanceMode' },
	{ name: 'colorTemperature', label: 'Color temp', parent: 'whiteBalanceMode', row: 2 },
	{ name: 'saturation', row: 2 },
	{ name: 'focusMode' },
	{ name: 'focusDistance', label: 'Focus', parent: 'focusMode', row: 3 },
	{ name: 'sharpness', row: 3 },
]

console.log('Env test', ABLY_CHANNEL, ABLY_TOKEN, HOST)
