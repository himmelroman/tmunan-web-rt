import merge from '@bundled-es-modules/deepmerge'
import { configureStore, createSelector, createSlice } from '@reduxjs/toolkit'

// eslint-disable-next-line no-unused-vars
import {
	CAMERA_PROPS,
	CONNECTION_STATES,
	HEIGHT,
	IS_CONTROL,
	IS_MOBILE,
	NAME,
	OFFLINE,
	PARAMETER_SCHEMA,
	WIDTH,
} from './constants'
import logger from './logger'
import { copy } from './utils'

export const defaultState = {
	// camera
	cameras: [],
	camera: null,
	camera_settings: null,
	// connection
	rtc_state: 'disconnected',
	ably_state: 'disconnected',
	presence: {
		active_connection_name: null,
		connections: [],
	},
	// ui
	show_panel: IS_CONTROL,
	show_cuelist: IS_CONTROL && !IS_MOBILE,
	show_source: false,
	show_output: !OFFLINE,
	active_range: null,
	mouse_down: false,
	// parameters
	parameters: {
		diffusion: {
			strength: PARAMETER_SCHEMA.strength.default,
			guidance_scale: PARAMETER_SCHEMA.guidance_scale.default,
			seed: PARAMETER_SCHEMA.seed.default,
			prompt: PARAMETER_SCHEMA.prompt.default,
			negative_prompt: PARAMETER_SCHEMA.negative_prompt.default,
			width: WIDTH,
			height: HEIGHT,
		},
		client: {
			fps: PARAMETER_SCHEMA.fps.default,
			filter: {
				sepia: PARAMETER_SCHEMA.sepia.default,
				invert: PARAMETER_SCHEMA.invert.default,
				brightness: PARAMETER_SCHEMA.brightness.default,
				contrast: PARAMETER_SCHEMA.contrast.default,
				saturate: PARAMETER_SCHEMA.saturate.default,
				'hue-rotate': PARAMETER_SCHEMA['hue-rotate'].default,
				blur: PARAMETER_SCHEMA.blur.default,
			},
			transform: {
				flip_x: false,
				flip_y: false,
			},
			freeze: false,
			transition_duration: 0,
		},
	},
	// cues
	cues: [],
	cue_index: -1,
	cue_input_value: '',
	selected_cues: [],
}

export const initialState = copy(defaultState)

const localState = JSON.parse(localStorage.getItem(`${NAME}-state`))
if (localState) {
	logger.info('Restoring state from local storage', localState)
	initialState.cue_index = localState.cue_index
	initialState.cues = localState.cues
	if (localState.filter) {
		initialState.parameters.client.filter = localState.filter
	}
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
			filter: s.parameters.client.filter,
		})
	)
}

export const appSlice = createSlice({
	name: 'app',
	initialState,
	reducers: {
		setCameras: (s, { payload }) => {
			s.cameras = payload
			s.cameras.unshift('none')
			if (!s.camera || !payload.includes(s.camera)) {
				s.camera = IS_CONTROL ? s.cameras[0] : s.cameras[1]
			}
		},
		setCameraSettings: (s, { payload }) => {
			if (!payload) {
				s.camera_settings = null
				return
			}
			const { capabilities, settings } = payload
			let found = false
			s.camera_settings = {}
			CAMERA_PROPS.forEach(({ name, parent }) => {
				if (name in settings) {
					found = true
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
			if (!found) {
				s.camera_settings = null
			}
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
		setActiveRange: (s, { payload }) => {
			window.active_range = s.active_range = payload
			if (!s.mouse_down && !s.active_range && window.pending_params) {
				s.parameters = merge(s.parameters, window.pending_params)
				window.pending_params = null
			}
		},
		setMouseDown: (s, { payload }) => {
			window.mouse_down = s.mouse_down = payload
			if (!s.mouse_down && !s.active_range && window.pending_params) {
				s.parameters = merge(s.parameters, window.pending_params)
				window.pending_params = null
			}
		},
		// props params
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
		reset: s => {
			Object.assign(s.parameters, defaultState.parameters)
		},
		// cues
		setSelectedCues: (s, { payload }) => {
			s.selected_cues = payload
		},
		setCueInputValue: (s, { payload }) => {
			s.cue_input_value = payload.replace(/[^a-zA-Z0-9\- \s]/g, '')
		},
		saveCue: (s, { payload: overwrite }) => {
			let cue
			// save to selected cue
			if (overwrite) {
				cue = s.cues[s.cue_index]
				if (cue) {
					Object.assign(cue, s.parameters)
				}
				saveLocal(s)
				return
			}

			// save new cue
			let name = s.cue_input_value.trim()
			if (!name) {
				// generate name
				const last_cue = s.cues[s.cue_index || s.cues.length - 1]
				if (last_cue) {
					const match = last_cue.name.match(/(\d+)$/)
					if (match) {
						name = last_cue.name.replace(match[1], parseInt(match[1]) + 1)
					} else {
						name = `Cue ${s.cues.length}`
					}
				} else {
					// first cue
					name = 'Cue 1'
				}
			}

			// ensure unique name
			while (s.cues.some(f => f.name === name)) {
				const match = name.match(/(\d+)$/)
				if (match) {
					name = name.replace(match[1], parseInt(match[1]) + 1)
				} else {
					name += ' 1'
				}
			}

			cue = { name, ...s.parameters }
			if (s.cue_index === -1) {
				s.cues.push(cue)
				s.cue_index = s.cues.length - 1
			} else {
				s.cue_index++
				s.cues.splice(s.cue_index, 0, cue)
			}

			s.selected_cues = [name]

			s.cue_input_value = ''
			saveLocal(s)
		},
		renameCue: (s, { payload }) => {
			let { name, index } = payload
			const cue = s.cues[index]
			if (cue) {
				name = name.trim()
				if (!name.length || s.cues.some(f => f.name === name)) {
					return
				}
				cue.name = name
			}
			saveLocal(s)
		},
		removeCues: (s, { payload }) => {
			if (!Array.isArray(payload)) {
				payload = [payload]
			}
			const current = s.cues[s.cue_index]?.name
			const indices = payload.map(f => s.cues.findIndex(c => c.name === f))
			if (indices.includes(s.cue_index)) {
				s.cue_index = -1
			}
			for (let i = indices.length - 1; i >= 0; i--) {
				s.cues.splice(indices[i], 1)
			}
			if (current) {
				s.cue_index = s.cues.findIndex(f => f.name === current)
			}
			saveLocal(s)
		},
		clearCues: s => {
			s.cues = []
			s.cue_index = -1
			saveLocal(s)
		},
		loadCue: (s, { payload }) => {
			const index = parseInt(payload)
			s.cue_index = index
			// eslint-disable-next-line no-unused-vars
			const { name, ...parameters } = s.cues[index]
			s.selected_cues = [name]
			s.parameters = parameters
		},
		sortCues(s, { payload }) {
			const { oldIndex, newIndex, length } = payload
			const diff = newIndex - oldIndex
			const newCues = []
			const current = s.cues[s.cue_index]?.name
			s.cues.forEach((cue, i) => {
				let ind
				if (i < oldIndex) {
					ind = i >= newIndex ? i + length : i
				} else if (i < oldIndex + length) {
					ind = i + diff
				} else {
					ind = i < newIndex + length ? i - length : i
				}
				newCues[ind] = cue
			})
			s.cues = newCues.filter(Boolean)
			if (current) {
				s.cue_index = s.cues.findIndex(f => f.name === current)
			}

			saveLocal(s)
		},
		openFile: (s, { payload }) => {
			s.cues = payload.cues
			s.cue_index = payload.index
		},
	},
})

export const {
	clearCues,
	loadCue,
	openFile,
	removeCues,
	renameCue,
	setSelectedCues,
	reset,
	saveCue,
	setAblyState,
	setActiveRange,
	setCameras,
	setCameraSetting,
	setCameraSettings,
	setClientParameter,
	setCueInputValue,
	setDiffusionParameter,
	setFilter,
	setLocalProp,
	setMouseDown,
	setParameters,
	setPresence,
	setRTCState,
	setShowCueList,
	setShowPanel,
	setTransform,
	sortCues,
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

export const selectCueInputValue = s => s.app.cue_input_value

export const selectCues = s => s.app.cues

export const selectSelectedCues = s => s.app.selected_cues

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

export const selectIsCapturing = createSelector(selectCamera, c => c !== 'none')

export const selectIsRunning = createSelector(
	selectConnected,
	selectIsCapturing,
	selectIsActive,
	selectIsFrozen,
	(connected, capturing, active, frozen) => connected && capturing && active && !frozen
)

/* Store */

const store = configureStore({
	reducer: {
		app: appSlice.reducer,
	},
	middleware: d => d({ serializableCheck: false }),
})

export default store
