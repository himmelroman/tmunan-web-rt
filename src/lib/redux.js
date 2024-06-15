import { createSlice, configureStore } from '@reduxjs/toolkit'
import { HEIGHT, LCM_STATUS, WIDTH } from './constants'

/* Slices */

// App

export const appSlice = createSlice({
	name: 'app',
	initialState: {
		panel: false,
		parameters: {
			strength: 1,
			prompt: 'the beauty of nature is all around us',
			guidance_scale: 0.6,
			seed: 0,
			width: WIDTH,
			height: HEIGHT,
		},
		camera: 'environment',
		lcmStatus: LCM_STATUS.DISCONNECTED,
		streamId: null,
	},
	reducers: {
		setPanel: (s, { payload }) => {
			s.panel = payload
		},
		setParameter: (s, { payload }) => {
			const [name, value] = payload
			let val
			if (name === 'seed') {
				val = parseInt(value)
			} else if (name === 'interval') {
				val = Math.max(200, Math.min(2000, parseInt(value)))
			} else {
				val = value
			}
			console.log('setparameter', payload)
			s.parameters[name] = val
		},
		setCamera: (s, { payload }) => {
			console.log('setcamera', payload)
			s.camera = payload ? 'user' : 'environment'
		},
		setLCMStatus: (s, { payload }) => {
			s.lcmStatus = payload
		},
		setStreamId: (s, { payload }) => {
			s.streamId = payload
		},
	},
})

export const { setPanel, setParameter, setCamera, setLCMStatus, setStreamId } = appSlice.actions

/* Selectors */

// App

export const selectApp = s => s.app

export const selectPanel = s => s.app.panel

export const selectParameters = s => s.app.parameters

export const selectCamera = s => s.app.camera

export const selectLCMStatus = s => s.app.lcmStatus

export const selectLCMRunning = s => s.app.lcmStatus !== LCM_STATUS.DISCONNECTED

export const selectStreamId = s => s.app.streamId

/* Store */

const store = configureStore({
	reducer: {
		app: appSlice.reducer,
	},
})

export default store
