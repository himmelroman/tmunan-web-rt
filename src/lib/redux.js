import { createSlice, configureStore } from '@reduxjs/toolkit'
import { persistReducer, persistStore } from 'redux-persist'
import storage from 'redux-persist/lib/storage'

import { WIDTH, HEIGHT, LCM_STATUS } from './constants'

/* Async Thunks */

/* Slice */

export const initialParameters = {
	strength: 2.6,
	prompt: 'the beauty of nature is all around us',
	guidance_scale: 0.6,
	seed: 2,
	width: WIDTH,
	height: HEIGHT,
}

const initialState = {
	camera: null,
	cameras: [],
	fps: 6,
	parameters: { ...initialParameters },
	lcmStatus: LCM_STATUS.DISCONNECTED,
	panel: false,
	console: [],
	showSource: false,
	showOutput: true,
	latency: null,
}

export const appSlice = createSlice({
	name: 'app',
	initialState,
	reducers: {
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
		setParameter: (s, { payload }) => {
			const { name, value } = payload
			s.parameters[name] = name === 'seed' ? parseInt(value) : value
		},
		setShowSource: (s, { payload }) => {
			s.showSource = payload
			if (!s.showSource && !s.showOutput) s.showOutput = true
		},
		setShowOutput: (s, { payload }) => {
			s.showOutput = payload
			if (!s.showSource && !s.showOutput) s.showSource = true
		},
		setLCMStatus: (s, { payload }) => {
			s.lcmStatus = payload
		},
		setFPS: (s, { payload }) => {
			const fps = parseInt(payload)
			console.log('fps', fps)
			s.fps = fps || initialState.fps
		},
		setLatency: (s, { payload }) => {
			s.latency = payload
		},
	},
})

export const { setPanel, setParameter, setCamera, setShowSource, setShowOutput, setLCMStatus, setFPS, setLatency, setCameras } = appSlice.actions

/* Thunks */

/* Selectors */

// App

export const selectApp = s => s.app

export const selectPanel = s => s.app.panel

export const selectParameters = s => s.app.parameters

export const selectCamera = s => s.app.camera

export const selectCameras = s => s.app.cameras

export const selectshowSource = s => s.app.showSource

export const selectLCMStatus = s => s.app.lcmStatus

export const selectLCMRunning = s => window.userId !== null && s.app.lcmStatus !== LCM_STATUS.DISCONNECTED && s.app.lcmStatus !== LCM_STATUS.TIMEOUT

export const selectFPS = s => s.app.fps

export const selectLatency = s => s.app.latency

// export const selectLog = s => s.app.console

/* Store */

const store = configureStore({
	reducer: {
		// app: appSlice.reducer,
		app: persistReducer(
			{
				key: 'rubin',
				storage,
				whitelist: ['parameters'],
			},
			appSlice.reducer
		),
	},
	middleware: d => d({ serializableCheck: false }),
})

export const persistor = persistStore(store)

export default store
