import { createSlice, configureStore } from '@reduxjs/toolkit'
import { persistReducer, persistStore } from 'redux-persist'
import storage from 'redux-persist/lib/storage'

import { HEIGHT, LCM_STATUS, WIDTH } from './constants'

/* Async Thunks */

// export const requestSetCamera = camera => async dispatch => {

// }

/* Slice */

export const initialParameters = {
	strength: 1,
	prompt: 'the beauty of nature is all around us',
	guidance_scale: 0.6,
	seed: 2,
	width: WIDTH,
	height: HEIGHT,
}

export const appSlice = createSlice({
	name: 'app',
	initialState: {
		camera: 'environment',
		fps: 1,
		parameters: { ...initialParameters },
		lcmStatus: LCM_STATUS.DISCONNECTED,
		panel: false,
		console: [],
	},
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
		setLCMStatus: (s, { payload }) => {
			s.lcmStatus = payload
		},
		setFPS: (s, { payload }) => {
			s.fps = parseInt(payload) || 10
		},
		logLine: (s, { payload }) => {
			s.console.push({ type: 'log', message: payload })
		},
		errorLine: (s, { payload }) => {
			s.console.push({ type: 'error', message: payload })
		},
	},
})

export const { setPanel, setParameter, setCamera, setLCMStatus, setFPS, errorLine } = appSlice.actions

/* Thunks */

/* Selectors */

// App

export const selectApp = s => s.app

export const selectPanel = s => s.app.panel

export const selectParameters = s => s.app.parameters

export const selectCamera = s => s.app.camera

export const selectLCMStatus = s => s.app.lcmStatus

export const selectLCMRunning = s => window.userId !== null && s.app.lcmStatus !== LCM_STATUS.DISCONNECTED && s.app.lcmStatus !== LCM_STATUS.TIMEOUT

export const selectLog = s => s.app.console

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
