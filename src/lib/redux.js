import { createSlice, configureStore, createSelector } from '@reduxjs/toolkit'
// import { persistReducer, persistStore } from 'redux-persist'
// import storage from 'redux-persist/lib/storage'
import logger from './logger'
import { WIDTH, HEIGHT, NAME, IS_CONTROL, OFFLINE } from './constants'

export const initialParameters = {
	strength: 1,
	guidance_scale: 1,
	seed: 1,
	prompt: localStorage.getItem('prompt') || '',
	negative_prompt: localStorage.getItem('negative') || '',
	width: WIDTH,
	height: HEIGHT,
}

// export const CAMERA_PROPS = ['brightness', 'colorTemperature', 'contrast', 'exposureTime', 'exposureCompensation', 'exposureMode', 'focusDistance', 'focusMode', 'frameRate', 'saturation', 'sharpness']

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
	show_cuelist: true,
	show_source: false,
	show_output: !OFFLINE,
	// exp
	camera_settings: null,
	// settings
	camera: null,
	fps: 16,
	filter: {
		sepia: 0,
		contrast: 1,
		brightness: 1,
		saturate: 1,
		'hue-rotate': 0,
		blur: 0,
		invert: 0,
	},
	transform: {
		flip_x: false,
		flip_y: false,
	},
	freeze: false,
	// cues
	cues: [],
	cue_index: -1,
	transition_duration: 5,
}

const localState = JSON.parse(localStorage.getItem(`${NAME}-state`))
if (localState) {
	console.log('LS restore', localState)
	// Object.assign(initialState, localState)
	const cue = localState.cues[localState.cue_index]
	if (cue) {
		initialState.cues = localState.cues
		initialState.cue_index = localState.cue_index
		const { camera, freeze, fps, filter, transform, parameters } = cue
		initialState.camera = camera
		initialState.freeze = freeze
		initialState.fps = fps
		initialState.filter = filter
		initialState.transform = transform
		initialState.presence.parameters = parameters
	} else {
		logger.warn('Cue error in LS', localState)
	}
}

const saveLocal = s => {
	localStorage.setItem(
		`${NAME}-state`,
		JSON.stringify({
			cues: s.cues,
			cue_index: s.cue_index,
		})
	)
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
		setShowCueList: (s, { payload }) => {
			s.show_cuelist = payload
		},
		setProp: (s, { payload }) => {
			const [k, v] = payload
			if ((!k) in s) return
			s[k] = v
		},
		// settings
		setFilter: (s, { payload }) => {
			// for (const [k, v] of Object.entries(payload)) {
			// 	s.filter[k] = v === null ? FILTERS_SCHEMA[k].default : v
			// }
			Object.assign(s.filter, payload)
		},
		setTransform: (s, { payload }) => {
			Object.assign(s.transform, payload)
		},
		setParameters: (s, { payload }) => {
			console.log('setParameters', payload)
			Object.assign(s.presence.parameters, payload)
		},
		// cues
		saveCue: (s, { payload }) => {
			const { name, index } = payload
			const { camera, freeze, fps, filter, transform } = s
			const { parameters } = s.presence

			let cue = s.cues.find(f => f.name === name)
			if (!cue) {
				s.cues.splice(index, 0, { name, camera, freeze, fps, filter, transform, parameters })
				s.cue_index = index
			} else {
				Object.assign(cue, { camera, freeze, fps, filter, transform, parameters })
			}
			saveLocal(s)
		},
		renameCue: (s, { payload }) => {
			const { name, index } = payload
			const cue = s.cues[index]
			if (cue) {
				cue.name = name
			}
			saveLocal(s)
		},
		removeCueAt: (s, { payload }) => {
			s.cues.splice(payload, 1)
			if (s.cue_index <= payload) {
				s.cue_index = -1
			}
			saveLocal(s)
		},
		clearCues: s => {
			s.cues = []
			s.cue_index = -1
			saveLocal(s)
		},
		setCueIndex: (s, { payload }) => {
			s.cue_index = payload
		},
		loadCue: (s, { payload }) => {
			const { camera, fps, filter, transform, parameters, freeze } = payload.cue
			s.camera = camera
			s.fps = fps
			s.filter = filter
			s.transform = transform
			s.presence.parameters = parameters
			s.freeze = freeze
			s.cue_index = payload.index
		},
		openFile: (s, { payload }) => {
			s.cues = payload.cues
			s.cue_index = payload.index
		},
		reset: s => {
			Object.assign(s.presence.parameters, initialParameters)
			Object.assign(s.filter, initialState.filter)
			Object.assign(s.transform, initialState.transform)
			s.fps = initialState.fps
		},
		// reorderCue: (s, { payload }) => {
		// 	const { dragId, dropId, after } = payload
		// 	const { criteria } = s.document

		// 	const dragItem = criteria.find(c => c.id === dragId)
		// 	const dragSiblings = criteria.filter(c => c.chapter === dragChapter)
		// 	dragSiblings.sort((a, b) => a.order - b.order)
		// 	const dragOrder = dragItem.order

		// 	const dropItem = criteria.find(c => c.id === dropId)

		// 	let dropOrder = dropItem.order
		// 	if (after) dropOrder++

		// 	if (dragOrder === dropOrder) {
		// 		console.log('%cSame order', 'color:orange')
		// 		return
		// 	}

		// 	if (dragOrder <= dropOrder) {
		// 		for (let i = dragOrder + 1; i < dropOrder; i++) {
		// 			dragSiblings[i].order--
		// 		}
		// 		dropOrder--
		// 	} else {
		// 		for (let i = dropOrder; i < dragOrder; i++) {
		// 			dragSiblings[i].order++
		// 		}
		// 	}
		// 	dragItem.order = dropOrder
		// 	const divs = Array.from(document.querySelectorAll('[data-selectable]'))
		// 	const dragIndex = divs.findIndex(c => c.id === dragId)
		// 	let dropIndex = divs.findIndex(c => c.id === dropId)
		// 	if (dragIndex < dropIndex) dropIndex--
		// 	if (after) dropIndex++
		// },
		// setCameraSettings: (s, { payload }) => {
		// 	CAMERA_PROPS.forEach(k => {
		// 		if (k in payload) {
		// 			s.camera_settings[k] = payload[k]
		// 		}
		// 	}
		// },
	},
})

export const {
	saveCue,
	loadCue,
	setFilter,
	setTransform,
	clearCues,
	removeCueAt,
	renameCue,
	setProp,
	setCameras,
	setConnected,
	setCueIndex,
	setPresence,
	setShowCueList,
	setShowPanel,
	setParameters,
	openFile,
	reset,
} = appSlice.actions

/* Selectors */

export const selectApp = s => s.app

export const selectCameras = s => s.app.cameras

// ui

export const selectShowClients = s => s.app.show_cuelist

export const selectShowPanel = s => s.app.show_panel

export const selectShowSource = s => s.app.show_source

// settings

export const selectCamera = s => s.app.camera

export const selectConnected = s => s.app.connected

export const selectFPS = s => s.app.fps

export const selectParameters = s => s.app.parameters

export const selectIsBlackout = s => s.app.freeze

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
	const { camera, freeze, fps, filter, transform } = app
	const { parameters } = app.presence
	return { camera, freeze, fps, filter, transform, parameters }
})

export const selectCueChanged = createSelector(selectCurrentCue, selectCurrentState, (cue, state) => {
	if (!cue) return false
	const { camera, freeze, fps, filter, transform, parameters } = state
	return (
		cue.camera !== camera ||
		cue.freeze !== freeze ||
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

export const selectIsRunning = createSelector(selectConnected, selectIsActive, selectIsBlackout, (connected, active, freeze) => connected && active && !freeze)

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
