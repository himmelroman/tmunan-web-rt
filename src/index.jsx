/**
 *
 * Entrypoint
 *
 */

import ReactDOM from 'react-dom/client'
import { PersistGate } from 'redux-persist/integration/react'
import { Provider } from 'react-redux'
import chalk from 'chalk'

import { SOCKET_URL, VERSION } from './lib/constants'
import logger from './lib/logger'
import socket from './lib/socket'
import store, { persistor } from '~/lib/redux'
import App from './comps/App'
import './styles/index.scss'

const print = (prop, val) => {
	logger.info(chalk.gray(prop.padEnd(20)) + chalk.blueBright(val))
}

logger.info(chalk.green('- START -'))

print('Version', VERSION)
print('Websocket URL', SOCKET_URL)

socket.connect()

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
	<Provider store={store}>
		<PersistGate loading={null} persistor={persistor}>
			<App />
		</PersistGate>
	</Provider>
)
