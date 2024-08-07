/**
 *
 * Entrypoint
 *
 */

import ReactDOM from 'react-dom/client'
import { PersistGate } from 'redux-persist/integration/react'
import { Provider } from 'react-redux'
import chalk from 'chalk'

import { IMG_URL, SOCKET_URL, VERSION } from './lib/constants'
import logger from './lib/logger'
import socket from './lib/socket'
import store, { persistor, setCameras } from '~/lib/redux'
import App from './comps/App'
import './styles/index.scss'

const print = (prop, val) => {
	logger.info(chalk.gray(prop.padEnd(20)) + chalk.blueBright(val))
}

async function getCameras() {
	window.cmap = {}
	try {
		logger.info('Getting cameras...')
		const devices = await navigator.mediaDevices.enumerateDevices()
		const cameras = devices
			.filter(device => device.kind === 'videoinput')
			.map(({ deviceId, label }) => {
				window.cmap[deviceId] = label
				return deviceId
			})
		logger.info(`Found ${chalk.blueBright(cameras.length)} cameras`)
		store.dispatch(setCameras(cameras))
		return true
	} catch (error) {
		logger.error('Error getting cameras', error)
		return false
	}
}

async function main() {
	logger.info(chalk.green('START'))
	print('Version', VERSION)
	print('Websocket URL', SOCKET_URL)
	print('Image URL', IMG_URL)

	socket.connect()

	await getCameras()

	const root = ReactDOM.createRoot(document.getElementById('root'))
	root.render(
		<Provider store={store}>
			<PersistGate loading={null} persistor={persistor}>
				<App />
			</PersistGate>
		</Provider>
	)
}

main()
