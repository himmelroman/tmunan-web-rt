import { createSlice, configureStore, createSelector } from '@reduxjs/toolkit'
import { persistReducer, persistStore } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import { WIDTH, HEIGHT, NAME } from './constants'

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
	active: true,
	camera: null,
	flipped: false,
	inverted: false,
	cameras: [],
	fps: 6,
	showPanel: false,
	showClients: false,
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
			s.showPanel = payload
		},
		setShowClients: (s, { payload }) => {
			s.showClients = payload
		},
		setFlipped: (s, { payload }) => {
			s.flipped = payload
		},
		setInverted: (s, { payload }) => {
			s.inverted = payload
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

export const { setActive, setCamera, setCameras, setConnected, setFlipped, setFPS, setServerState, setShowClients, setShowOutput, setShowPanel, setShowSource, setInverted } = appSlice.actions

/* Selectors */

export const selectApp = s => s.app

export const selectActive = s => s.app.active

export const selectCamera = s => s.app.camera

export const selectCameras = s => s.app.cameras

export const selectConnected = s => s.app.connected

export const selectFPS = s => s.app.fps

export const selectParameters = s => s.app.parameters

export const selectShowClients = s => s.app.showClients

export const selectShowPanel = s => s.app.showPanel

export const selectShowSource = s => s.app.showSource

export const selectRunning = createSelector(selectConnected, selectActive, (connected, active) => connected && active)

/* Store */

const store = configureStore({
	reducer: {
		// app: appSlice.reducer,
		app: persistReducer(
			{
				key: 'rubin',
				storage,
				whitelist: ['camera', 'fps', 'flipped'],
			},
			appSlice.reducer
		),
	},
	middleware: d => d({ serializableCheck: false }),
})

export const persistor = persistStore(store)

export default store
