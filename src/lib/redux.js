import { createSlice, configureStore, createSelector } from '@reduxjs/toolkit'
import merge from '@bundled-es-modules/deepmerge'
// eslint-disable-next-line no-unused-vars
import logger from './logger'
import { WIDTH, HEIGHT, NAME, IS_CONTROL, OFFLINE, CONNECTION_STATES, CAMERA_PROPS } from './constants'

export const initialState = {
	// env
	cameras: [],
	rtc_state: 'disconnected',
	ably_state: 'disconnected',
	presence: {
		active_connection_name: null,
		connections: [],
	},
	// ui
	show_panel: IS_CONTROL,
	show_cuelist: false,
	show_source: false,
	show_output: !OFFLINE,
	// exp
	camera: null,
	camera_settings: null,
	// parameters
	parameters: {
		diffusion: {
			strength: 1,
			guidance_scale: 1,
			seed: 1,
			prompt: '',
			negative_prompt: '',
			width: WIDTH,
			height: HEIGHT,
		},
		client: {
			fps: 16,
			filter: {
				sepia: 0,
				invert: 0,
				brightness: 1,
				contrast: 1,
				saturate: 1,
				'hue-rotate': 0,
				blur: 0,
			},
			transform: {
				flip_x: false,
				flip_y: false,
			},
			freeze: false,
			transition_duration: 5,
		},
	},
	// cues
	cues: [],
	cue_index: -1,
}

const localState = JSON.parse(localStorage.getItem(`${NAME}-state`))
if (localState) {
	console.log('LS restore', localState)
	initialState.cue_index = localState.cue_index
	initialState.cues = localState.cues
	const cue = localState.cues[localState.cue_index]
	if (cue) {
		const assigned = { ...cue }
		delete assigned.name
		Object.assign(initialState.parameters, assigned)
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
		// setConnected: (s, { payload }) => {
		// 	if (!payload) {
		// 		s.connected = false
		// 		return
		// 	}
		// 	s.connected = true
		// },
		setRTCState: (s, { payload }) => {
			s.rtc_state = payload
		},
		setAblyState: (s, { payload }) => {
			s.ably_state = payload
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
		setLocalProp: (s, { payload }) => {
			const [k, v] = payload
			if ((!k) in s) return
			s[k] = v
		},
		setClientParameter: (s, { payload }) => {
			const [k, v] = payload
			if ((!k) in s.parameters.client) return
			s.parameters.client[k] = v
		},
		setDiffusionParameter: (s, { payload }) => {
			const [k, v] = payload
			if ((!k) in s.parameters.diffusion) return
			s.parameters.diffusion[k] = v
		},
		// settings
		setFilter: (s, { payload }) => {
			Object.assign(s.parameters.client.filter, payload)
		},
		setTransform: (s, { payload }) => {
			Object.assign(s.parameters.client.transform, payload)
		},
		setParameters: (s, { payload }) => {
			s.parameters = merge(s.parameters, payload)
		},
		// cues
		saveCue: (s, { payload }) => {
			const { name, index } = payload

			let cue = s.cues.find(f => f.name === name)
			if (!cue) {
				s.cues.splice(index, 0, { name, ...s.parameters })
				s.cue_index = index
			} else {
				Object.assign(cue, s.parameters)
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
			// eslint-disable-next-line no-unused-vars
			const { name, ...parameters } = payload.cue
			s.parameters = parameters
			s.cue_index = payload.index
		},
		openFile: (s, { payload }) => {
			s.cues = payload.cues
			s.cue_index = payload.index
		},
		reset: s => {
			Object.assign(s.parameters, initialState.parameters)
		},
		setCameraSettings: (s, { payload }) => {
			const { capabilities, settings } = payload
			s.camera_settings = {}
			CAMERA_PROPS.forEach(({ name, parent }) => {
				if (name in settings) {
					const cap = capabilities[name]
					if (Array.isArray(cap)) {
						s.camera_settings[name] = {
							options: cap,
							value: 'continuous',
							intial: 'continuous',
						}
					} else {
						s.camera_settings[name] = {
							min: capabilities[name].min,
							max: capabilities[name].max,
							step: capabilities[name].step,
							value: settings[name],
							initial: settings[name],
							parent,
						}
						if (parent) {
							s.camera_settings[name].disabled = settings[parent] !== 'manual'
						}
					}
				}
			})
		},
		setCameraSetting: (s, { payload }) => {
			const [key, value] = payload
			if (key in s.camera_settings) {
				s.camera_settings[key].value = value
			}

			Object.values(s.camera_settings).forEach(a => {
				if (a.parent) {
					a.disabled = s.camera_settings[a.parent].value !== 'manual'
				}
			})
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
	},
})

export const {
	setAblyState,
	setRTCState,
	setShowCueList,
	setShowPanel,
	saveCue,
	loadCue,
	setFilter,
	setTransform,
	clearCues,
	removeCueAt,
	renameCue,
	setCameras,
	setCameraSettings,
	setCameraSetting,
	setCueIndex,
	setLocalProp,
	setParameters,
	setClientParameter,
	setDiffusionParameter,
	setPresence,
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

export const selectCameraSettings = s => s.app.camera_settings

export const selectConnected = s =>
	s.app.rtc_state === CONNECTION_STATES.CONNECTED && s.app.ably_state === CONNECTION_STATES.CONNECTED

export const selectParameters = s => s.app.parameters

export const selectDiffusionParameters = createSelector(selectParameters, p => p.diffusion)

export const selectClientParameters = createSelector(selectParameters, p => p.client)

export const selectIsFrozen = createSelector(selectClientParameters, p => p.freeze)

export const selectFilter = createSelector(selectClientParameters, p => p.filter)

export const selectFilterString = createSelector(selectFilter, f => {
	if (!f) return 'none'
	f = { ...f }
	if (f.invert === 1) {
		if (f['hue-rotate']) f['hue-rotate'] += 180
		else f['hue-rotate'] = 180
	}

	const props = Object.entries(f)
	if (!props?.length) return 'none'
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

export const selectTransform = createSelector(selectClientParameters, p => p.transform)

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

export const selectCueChanged = createSelector(selectCurrentCue, selectParameters, (cue, params) => {
	if (!cue) return false
	const { client, diffusion } = params
	return (
		JSON.stringify(cue.client) !== JSON.stringify(client) ||
		JSON.stringify(cue.diffusion) !== JSON.stringify(diffusion)
	)
})

// connection

export const selectPresence = s => s.app.presence

export const selectConnections = createSelector(selectPresence, p => p.connections)

export const selectIsActive = createSelector(selectPresence, p => p.active_connection_name === NAME)

export const selectIsRunning = createSelector(
	selectConnected,
	selectIsActive,
	selectIsFrozen,
	(connected, active, freeze) => connected && active && !freeze
)

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
