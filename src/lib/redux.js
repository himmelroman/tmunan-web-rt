import { createSlice, configureStore } from '@reduxjs/toolkit'
import { persistReducer, persistStore } from 'redux-persist'
import storage from 'redux-persist/lib/storage'

import { WIDTH, HEIGHT, LCM_STATUS } from './constants'

/* Async Thunks */

// export const requestSetCamera = camera => async dispatch => {

// }

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
	camera: 'user',
	fps: 9,
	parameters: { ...initialParameters },
	lcmStatus: LCM_STATUS.DISCONNECTED,
	panel: false,
	console: [],
	showOriginal: false,
	romaFPS: null,
	latency: null,
}

export const appSlice = createSlice({
	name: 'app',
	initialState,
	reducers: {
		setPanel: (s, { payload }) => {
			s.panel = payload
		},
		setParameter: (s, { payload }) => {
			const { name, value } = payload
			s.parameters[name] = name === 'seed' ? parseInt(value) : value
		},
		setCamera: (s, { payload }) => {
			s.camera = payload ? 'user' : 'environment'
		},
		setOriginal: (s, { payload }) => {
			s.showOriginal = payload
		},
		setLCMStatus: (s, { payload }) => {
			s.lcmStatus = payload
		},
		setFPS: (s, { payload }) => {
			const fps = parseInt(payload)
			console.log('fps', fps)
			s.fps = fps || initialState.fps
		},
		setRomaFPS: (s, { payload }) => {
			s.romaFPS = payload
		},
		setLatency: (s, { payload }) => {
			s.latency = payload
		},
		// logLine: (s, { payload }) => {
		// 	s.console.push({ type: 'log', message: payload })
		// },
		// errorLine: (s, { payload }) => {
		// 	s.console.push({ type: 'error', message: payload })
		// },
	},
})

export const { setPanel, setParameter, setCamera, setOriginal, setLCMStatus, setFPS, setLatency, setRomaFPS /* , errorLine */ } = appSlice.actions

/* Thunks */

/* Selectors */

// App

export const selectApp = s => s.app

export const selectPanel = s => s.app.panel

export const selectParameters = s => s.app.parameters

export const selectCamera = s => s.app.camera

export const selectshowOriginal = s => s.app.showOriginal

export const selectLCMStatus = s => s.app.lcmStatus

export const selectLCMRunning = s => window.userId !== null && s.app.lcmStatus !== LCM_STATUS.DISCONNECTED && s.app.lcmStatus !== LCM_STATUS.TIMEOUT

export const selectFPS = s => s.app.fps

export const selectRomaFPS = s => s.app.romaFPS

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
