/**
 *
 * Entrypoint
 *
 */

import ReactDOM from 'react-dom/client'
// import { PersistGate } from 'redux-persist/integration/react'
import { Provider } from 'react-redux'
import chalk from 'chalk'

import { VERSION, NAME, IS_CONTROL, ABLY_CHANNEL, BASE_URL } from './lib/constants'
import logger from './lib/logger'
import socket from './lib/socket'
import store, { /* persistor, */ setCameras } from '~/lib/redux'
import App from './comps/App'
import './styles/index.scss'

window.socket = socket

const print = (prop, val) => {
	logger.info(chalk.gray(prop.padEnd(20)) + chalk.blueBright(val))
}

export async function getCameras() {
	window.cmap = { none: 'None' }
	try {
		logger.info('Getting cameras...')
		const devices = await navigator.mediaDevices.enumerateDevices()
		const cameras = devices
			.filter(device => device.kind === 'videoinput')
			.map(({ deviceId, label }) => {
				window.cmap[deviceId] = label
				logger.info(chalk.blueBright(label))
				return deviceId
			})
		window.cameras = cameras
		store.dispatch(setCameras(cameras))
		return true
	} catch (error) {
		logger.error('Error getting cameras', error)
		return false
	}
}

async function main() {
	if (!NAME) {
		// generate random 8 char string
		const name = Math.random().toString(36).substring(2, 10)
		let query = `?name=${name}`
		if (IS_CONTROL) query += '&control'
		window.open(query, '_self')
		return
	}

	logger.info(chalk.greenBright('START'))
	print('Version', VERSION)
	// print('Websocket URL', SOCKET_URL)
	print('Server URL', BASE_URL)
	print('Name', NAME)
	print('Channel', ABLY_CHANNEL)

	await getCameras()

	const root = ReactDOM.createRoot(document.getElementById('root'))
	root.render(
		<Provider store={store}>
			<App />
		</Provider>
	)
}

main()

// <PersistGate loading={null} persistor={persistor}></PersistGate
