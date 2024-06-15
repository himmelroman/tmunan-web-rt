/**
 *
 * Entrypoint
 *
 */

import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'

import store from '~/lib/redux'
import App from './comps/App'
import './styles/index.scss'

const root = ReactDOM.createRoot(document.getElementById('root'))

root.render(
	<Provider store={store}>
		<App />
	</Provider>
)
