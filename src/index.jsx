/**
 *
 * Entrypoint
 *
 */

import ReactDOM from 'react-dom/client'
// import { PersistGate } from 'redux-persist/integration/react'
import { Provider } from 'react-redux'
import * as Ably from 'ably'
import { AblyProvider, ChannelProvider } from 'ably/react'
import chalk from 'chalk'

import { IMG_URL, SOCKET_URL, VERSION, NAME, IS_CONTROL, OFFLINE, ABLY_TOKEN } from './lib/constants'
import logger from './lib/logger'
import socket from './lib/socket'
import store, { /* persistor, */ setCameras } from '~/lib/redux'
import App from './comps/App'
import './styles/index.scss'

window.socket = socket

const ablyClient = new Ably.Realtime({ key: ABLY_TOKEN })

const print = (prop, val) => {
	logger.info(chalk.gray(prop.padEnd(20)) + chalk.blueBright(val))
}

export async function getCameras() {
	window.cmap = {}
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
		// logger.info(`Found ${chalk.blueBright(cameras.length)} cameras`)
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

	logger.info(chalk.green('START'))
	print('Version', VERSION)
	print('Websocket URL', SOCKET_URL)
	print('Image URL', IMG_URL)
	print('Name', NAME)

	await getCameras()

	if (!OFFLINE) socket.initiatePeerConnection()

	const root = ReactDOM.createRoot(document.getElementById('root'))
	root.render(
		<Provider store={store}>
			<AblyProvider client={ablyClient}>
				<ChannelProvider channelName='tmunan_local'>
					<App />
				</ChannelProvider>
			</AblyProvider>
		</Provider>
	)
}

main()

// <PersistGate loading={null} persistor={persistor}></PersistGate
