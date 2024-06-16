/**
 *
 * Entrypoint
 *
 */

import ReactDOM from 'react-dom/client'
import { PersistGate } from 'redux-persist/integration/react'
import { Provider } from 'react-redux'

import store, { persistor } from '~/lib/redux'
import logger from './lib/logger'
import App from './comps/App'
import './styles/index.scss'

window.con = {
	log: console.log,
	warn: console.warn,
	error: console.error,
}

console.log = logger.log
console.warn = logger.warn
console.error = logger.error

const root = ReactDOM.createRoot(document.getElementById('root'))

root.render(
	<Provider store={store}>
		<PersistGate loading={null} persistor={persistor}>
			<App />
		</PersistGate>
	</Provider>
)
