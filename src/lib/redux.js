import { createSlice, configureStore, createSelector } from '@reduxjs/toolkit'
// import { persistReducer, persistStore } from 'redux-persist'
// import storage from 'redux-persist/lib/storage'
import { WIDTH, HEIGHT, NAME } from './constants'

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
	show_panel: false,
	show_clients: true,
	show_source: true,
	show_output: true,
	filter: 'none',
	transform: 'none',
	presence: {
		parameters: initialParameters,
		connections: [],
	},
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
		setFlipped: (s, { payload }) => {
			s.flipped = payload
		},
		setInverted: (s, { payload }) => {
			s.inverted = payload
		},
		setShowSource: (s, { payload }) => {
			s.show_source = payload
			if (!s.show_source && !s.show_output) s.show_output = true
		},
		setShowOutput: (s, { payload }) => {
			s.show_output = payload
			if (!s.show_source && !s.show_output) s.show_source = true
		},
		setFPS: (s, { payload }) => {
			const fps = parseInt(payload)
			s.fps = fps || initialState.fps
		},
		setPresence: (s, { payload }) => {
			s.presence = payload
		},
	},
})

export const { setActive, setCamera, setCameras, setConnected, setFlipped, setFPS, setPresence, setShowClients, setShowOutput, setShowPanel, setShowSource, setInverted } = appSlice.actions

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
