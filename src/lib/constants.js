// export const ENV_PROTOCOL = import.meta.env.VITE_PROTOCOL
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

export const NAME = QUERY.name || import.meta.env.VITE_NAME

export const FPS = QUERY.fps || 30

// export const SOCKET_URL = `${PROTOCOL === 'https' ? 'wss' : 'ws'}://${HOST}${PORT ? ':' + PORT : ''}/api/ws?name=${NAME}`

// export const IMG_URL = `${BASE_URL}/stream`

export const BASE_URL = `${PROTOCOL}://${HOST}${PORT ? ':' + PORT : ''}/api`

export const WIDTH = parseInt(QUERY.width || import.meta.env.VITE_WIDTH || 512)

export const HEIGHT = parseInt(QUERY.height || import.meta.env.VITE_HEIGHT || 512)

export const ABLY_TOKEN = import.meta.env.VITE_ABLY_TOKEN

export const ABLY_CHANNEL = QUERY.channel || import.meta.env.VITE_ABLY_CHANNEL || 'tmunan_dev'

export const CODES = {
	NON_ACTIVE_PUBLISH: 'non_active_publish',
}

export const PARAMETERS_SCHEMA = {
	strength: {
		type: 'range',
		min: 1,
		max: 2.9,
		step: 0.05,
		default: 1,
	},
	guidance_scale: {
		type: 'range',
		min: 0,
		max: 1,
		step: 0.05,
		default: 1,
	},
	seed: {
		type: 'range',
		min: 1,
		max: 100,
		step: 1,
		default: 1,
	},
	prompt: {
		type: 'textarea',
		default: '',
	},
	negative_prompt: {
		type: 'textarea',
		default: '',
	},
}

export const FILTERS_SCHEMA = {
	brightness: {
		type: 'range',
		min: 0,
		max: 4,
		step: 0.1,
		default: 1,
	},
	contrast: {
		type: 'range',
		min: 0,
		max: 5,
		step: 0.1,
		default: 1,
	},
	'hue-rotate': {
		type: 'range',
		min: -180,
		max: 180,
		step: 1,
		default: 0,
		label: 'hue',
	},
	saturate: {
		type: 'range',
		min: 0,
		max: 10,
		step: 0.1,
		default: 1,
		label: 'saturation',
	},
	sepia: {
		type: 'range',
		min: 0,
		max: 1,
		step: 0.1,
		default: 0,
	},
	blur: {
		type: 'range',
		min: 0,
		max: 30,
		step: 1,
		default: 0,
	},
}

export const FILTER_LIST = Object.keys(FILTERS_SCHEMA).map(k => ({ name: k, ...FILTERS_SCHEMA[k] }))

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
