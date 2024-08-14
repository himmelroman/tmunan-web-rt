import { createSlice, configureStore, createSelector } from '@reduxjs/toolkit'
// import { persistReducer, persistStore } from 'redux-persist'
// import storage from 'redux-persist/lib/storage'
import { WIDTH, HEIGHT, NAME, IS_CONTROL, FILTERS_SCHEMA } from './constants'

export const initialParameters = {
	strength: 1,
	guidance_scale: 1,
	seed: 1,
	prompt: localStorage.getItem('prompt') || '',
	negative_prompt: localStorage.getItem('negative') || '',
	width: WIDTH,
	height: HEIGHT,
}

const initialState = {
	connected: false,
	active: true,
	camera: null,
	flipped: false,
	inverted: false,
	cameras: [],
	fps: 6,
	show_panel: IS_CONTROL,
	show_clients: true,
	show_source: true,
	show_output: true,
	filter: {},
	transform: {
		flip_x: false,
		flip_y: false,
	},
	presence: {
		parameters: initialParameters,
		connections: [],
	},
	frames: [],
	frame_index: 0,
}

export const appSlice = createSlice({
	name: 'app',
	initialState,
	reducers: {
		setConnected: (s, { payload }) => {
			if (!payload) {
				s.connected = false
				s.connectionId = null
				return
			}
			s.connected = true
			s.connectionId = payload.connection_id
			s.active = payload.active
		},
		setActive: (s, { payload }) => {
			s.active = payload
		},
		setCameras: (s, { payload }) => {
			s.cameras = payload
			if (!s.camera || !payload.includes(s.camera)) {
				s.camera = s.cameras[0]
			}
		},
		setCamera: (s, { payload }) => {
			s.camera = payload
		},
		setShowPanel: (s, { payload }) => {
			s.show_panel = payload
		},
		setShowClients: (s, { payload }) => {
			s.show_clients = payload
		},
		setShowSource: (s, { payload }) => {
			s.show_source = payload
		},
		setShowOutput: (s, { payload }) => {
			s.show_output = payload
		},
		setFPS: (s, { payload }) => {
			const fps = parseInt(payload)
			s.fps = fps || initialState.fps
		},
		setPresence: (s, { payload }) => {
			s.presence = payload
		},
		applyFilter: (s, { payload }) => {
			for (const [k, v] of Object.entries(payload)) {
				if (v === null || v === (FILTERS_SCHEMA[k]?.default || 0)) delete s.filter[k]
				else s.filter[k] = v
			}
		},
		applyTransform: (s, { payload }) => {
			Object.assign(s.transform, payload)
		},
	},
})

export const { setActive, setCamera, setCameras, setConnected, applyTransform, setFPS, setPresence, setShowClients, setShowOutput, setShowPanel, setShowSource, applyFilter } = appSlice.actions

/* Selectors */

export const selectApp = s => s.app

export const selectPresence = s => s.app.presence

export const selectCamera = s => s.app.camera

export const selectCameras = s => s.app.cameras

export const selectConnected = s => s.app.connected

export const selectFPS = s => s.app.fps

export const selectParameters = s => s.app.parameters

export const selectShowClients = s => s.app.show_clients

export const selectShowPanel = s => s.app.show_panel

export const selectShowSource = s => s.app.show_source

export const selectIsActive = createSelector(selectPresence, p => p.active_connection_name === NAME)

export const selectRunning = createSelector(selectConnected, selectIsActive, (connected, active) => connected && active)

export const selectConnections = createSelector(selectPresence, p => p.connections)

export const selectFilter = s => s.app.filter

export const selectFilterString = createSelector(selectFilter, f => {
	const props = Object.entries(f)
	if (!props.length) return 'none'
	return props
		.map(([k, v]) => {
			if (k === 'hue-rotate') {
				return `${k}(${v}deg)`
			} else if (k === 'blur') {
				return `${k}(${v}px)`
			} else {
				return `${k}(${v})`
			}
		})
		.join(' ')
})

export const selectTransform = s => s.app.transform

const flips = {
	flip_x: 'scaleX',
	flip_y: 'scaleY',
}

export const selectTransformString = createSelector(selectTransform, t => {
	const props = Object.entries(t)
	if (!props.length) return 'none'
	return props
		.map(([k, v]) => {
			if (!v) return
			if (k in flips) {
				return `${flips[k]}(-1)`
			}
			return `${k}(${v})`
		})
		.filter(Boolean)
		.join(' ')
})

export const selectFrames = s => s.app.frames

export const selectFrameIndex = s => s.app.frame_index

export const selectFrame = createSelector(selectFrames, selectFrameIndex, (frames, index) => (frames ? frames[index] : null))

/* Store */

const store = configureStore({
	reducer: {
		app: appSlice.reducer,
		// app: persistReducer(
		// 	{
		// 		key: 'rubin',
		// 		storage,
		// 		whitelist: ['camera', 'fps', 'flipped'],
		// 	},
		// 	appSlice.reducer
		// ),
	},
	middleware: d => d({ serializableCheck: false }),
})

// export const persistor = persistStore(store)

export default store
