import { createSlice, configureStore, createSelector } from '@reduxjs/toolkit'
import { persistReducer, persistStore } from 'redux-persist'
import storage from 'redux-persist/lib/storage'

import { WIDTH, HEIGHT, NAME } from './constants'

/* Async Thunks */

/* Slice */

export const initialParameters = {
	strength: 1,
	guidance_scale: 1,
	seed: 1,
	prompt: localStorage.getItem('prompt') || '',
	width: WIDTH,
	height: HEIGHT,
}

const initialState = {
	connected: false,
	connectionId: null,
	camera: null,
	cameras: [],
	fps: 6,
	active: true,
	panel: false,
	console: [],
	showSource: false,
	showOutput: true,
	server: {
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
		setPanel: (s, { payload }) => {
			s.panel = payload
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
		setShowSource: (s, { payload }) => {
			s.showSource = payload
			if (!s.showSource && !s.showOutput) s.showOutput = true
		},
		setShowOutput: (s, { payload }) => {
			s.showOutput = payload
			if (!s.showSource && !s.showOutput) s.showSource = true
		},
		setFPS: (s, { payload }) => {
			const fps = parseInt(payload)
			s.fps = fps || initialState.fps
		},
		setServerState: (s, { payload }) => {
			s.server = payload
			if ('active_connection_name' in payload) {
				s.active = payload.active_connection_name === NAME
			}
		},
	},
})

export const { setPanel, setCamera, setShowSource, setShowOutput, setConnected, setFPS, setCameras, setServerState, setActive } = appSlice.actions

/* Thunks */

/* Selectors */

// App

export const selectApp = s => s.app

export const selectPanel = s => s.app.panel

export const selectParameters = s => s.app.parameters

export const selectCamera = s => s.app.camera

export const selectCameras = s => s.app.cameras

export const selectshowSource = s => s.app.showSource

export const selectConnected = s => s.app.connected

export const selectActive = s => s.app.active

export const selectRunning = createSelector(selectConnected, selectActive, (connected, active) => connected && active)

export const selectFPS = s => s.app.fps

// export const selectLog = s => s.app.console

/* Store */

const store = configureStore({
	reducer: {
		// app: appSlice.reducer,
		app: persistReducer(
			{
				key: 'rubin',
				storage,
				whitelist: ['camera', 'fps'],
			},
			appSlice.reducer
		),
	},
	middleware: d => d({ serializableCheck: false }),
})

export const persistor = persistStore(store)

export default store
