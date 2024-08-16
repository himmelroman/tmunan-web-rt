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

export const initialState = {
	// env
	cameras: [],
	connected: false,
	presence: {
		active_connection_name: null,
		parameters: initialParameters,
		connections: [],
	},
	// ui
	show_panel: IS_CONTROL,
	show_clients: true,
	show_source: false,
	show_output: false,
	// settings
	camera: null,
	fps: 16,
	filter: {},
	transform: {
		flip_x: false,
		flip_y: false,
	},
	blackout: false,
	// cues
	cues: [],
	cue_index: -1,
}

export const appSlice = createSlice({
	name: 'app',
	initialState,
	reducers: {
		setCameras: (s, { payload }) => {
			s.cameras = payload
			if (!s.camera || !payload.includes(s.camera)) {
				s.camera = s.cameras[0]
			}
		},
		setConnected: (s, { payload }) => {
			if (!payload) {
				s.connected = false
				return
			}
			s.connected = true
		},
		setPresence: (s, { payload }) => {
			s.presence = payload
		},
		// ui
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
		setProp: (s, { payload }) => {
			const [k, v] = payload
			if ((!k) in s) return
			s[k] = v
		},
		// settings
		setCamera: (s, { payload }) => {
			s.camera = payload
		},
		setFPS: (s, { payload }) => {
			const fps = parseInt(payload)
			s.fps = fps || initialState.fps
		},
		setFilter: (s, { payload }) => {
			for (const [k, v] of Object.entries(payload)) {
				if (v === null || v === (FILTERS_SCHEMA[k]?.default || 0)) delete s.filter[k]
				else s.filter[k] = v
			}
		},
		setTransform: (s, { payload }) => {
			Object.assign(s.transform, payload)
		},
		setParameters: (s, { payload }) => {
			console.log('setParameters', payload)
			Object.assign(s.presence.parameters, payload)
		},
		// cues
		saveCue: (s, { payload: name }) => {
			const { camera, blackout, fps, filter, transform } = s
			const { parameters } = s.presence

			const cue = s.cues.find(f => f.name === name)
			if (!cue) {
				s.cues.push({ name, camera, blackout, fps, filter, transform, parameters })
				s.cue_index = s.cues.length - 1
			} else {
				Object.assign(cue, { camera, blackout, fps, filter, transform, parameters })
			}
		},
		removeCueAt: (s, { payload }) => {
			s.cues.splice(payload, 1)
			if (s.cue_index >= s.cues.length) {
				s.cue_index = s.cues.length - 1
			}
		},
		clearCues: s => {
			s.cues = []
			s.cue_index = -1
		},
		setCueIndex: (s, { payload }) => {
			s.cue_index = payload
		},
		loadCue: (s, { payload }) => {
			const { camera, fps, filter, transform, parameters, blackout } = payload.cue
			s.camera = camera
			s.fps = fps
			s.filter = filter
			s.transform = transform
			s.presence.parameters = parameters
			s.blackout = blackout
			s.cue_index = payload.index
		},
	},
})

export const {
	saveCue,
	loadCue,
	setFilter,
	setTransform,
	clearCues,
	removeCueAt,
	setProp,
	setCamera,
	setCameras,
	setConnected,
	setFPS,
	setCueIndex,
	setPresence,
	setShowClients,
	setShowOutput,
	setShowPanel,
	setShowSource,
	setParameters,
} = appSlice.actions

/* Selectors */

export const selectApp = s => s.app

export const selectCameras = s => s.app.cameras

// ui

export const selectShowClients = s => s.app.show_clients

export const selectShowPanel = s => s.app.show_panel

export const selectShowSource = s => s.app.show_source

// settings

export const selectCamera = s => s.app.camera

export const selectConnected = s => s.app.connected

export const selectFPS = s => s.app.fps

export const selectParameters = s => s.app.parameters

export const selectIsBlackout = s => s.app.blackout

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

// cues

export const selectCues = s => s.app.cues

export const selectCueIndex = s => s.app.cue_index

export const selectCurrentCue = createSelector(selectCues, selectCueIndex, (cues, index) => (cues ? cues[index] : null))

export const selectCurrentState = createSelector(selectApp, app => {
	const { camera, blackout, fps, filter, transform } = app
	const { parameters } = app.presence
	return { camera, blackout, fps, filter, transform, parameters }
})

export const selectCueChanged = createSelector(selectCurrentCue, selectCurrentState, (cue, state) => {
	if (!cue) return false
	const { camera, blackout, fps, filter, transform, parameters } = state
	return (
		cue.camera !== camera ||
		cue.blackout !== blackout ||
		cue.fps !== fps ||
		JSON.stringify(cue.filter) !== JSON.stringify(filter) ||
		JSON.stringify(cue.transform) !== JSON.stringify(transform) ||
		JSON.stringify(cue.parameters) !== JSON.stringify(parameters)
	)
})

// connection

export const selectPresence = s => s.app.presence

export const selectConnections = createSelector(selectPresence, p => p.connections)

export const selectIsActive = createSelector(selectPresence, p => p.active_connection_name === NAME)

export const selectIsRunning = createSelector(selectConnected, selectIsActive, selectIsBlackout, (connected, active, blackout) => connected && active && !blackout)

/* Thunks */

// export const loadCue = name => (dispatch, getState) => {
// 	const s = getState().app
// 	const cue = s.cues.find(f => f.name === name)
// 	if (!cue) return
// 	if (s.connected) {
// 		socket.send('set_parameters', { ...cue.parameters, override: true })
// 	}
// 	dispatch(setCue(cue))
// }

// export const loadCue = index => (dispatch, getState) => {
// 	const s = getState().app
// 	const cue = s.cues[index]
// 	if (!cue) return
// 	s.cue_index = index
// 	const { }
// 	dispatch()
// }

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
