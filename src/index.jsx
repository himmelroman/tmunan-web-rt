/**
 *
 * Entrypoint
 *
 */

import { Auth0Provider } from '@auth0/auth0-react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { createBrowserRouter, RouterProvider, useNavigate } from 'react-router-dom'

import App from '~/routes/app'
import AuthGuard from '~/comps/AuthGuard'
import Callback from '~/routes/callback'
import store from '~/lib/redux'
import socket from '~/lib/socket'
import NotFound from '~/routes/not-found'
import Root from '~/routes/root'
import '~/styles/index.scss'

const domain = import.meta.env.VITE_AUTH0_DOMAIN
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID
const redirect_uri = import.meta.env.VITE_AUTH0_CALLBACK_URL
const audience = import.meta.env.VITE_AUTH0_AUDIENCE

window.socket = socket

// logger.info(chalk.greenBright('START'))
// print('Version', VERSION)
// print('Server URL', BASE_URL)
// print('Name', NAME)
// print('Channel', ABLY_CHANNEL)

// const root = ReactDOM.createRoot(document.getElementById('root'))
// root.render(
// 		<Provider store={store}>
// 			<App />
// 		</Provider>
// 	</Auth0Provider>
// )

const AuthRoot = () => {
	const navigate = useNavigate()

	const onRedirectCallback = appState => {
		navigate(appState?.returnTo || window.location.pathname)
	}

	return (
		<Auth0Provider
			domain={domain}
			clientId={clientId}
			authorizationParams={{
				redirect_uri,
				audience,
			}}
			onRedirectCallback={onRedirectCallback}
		>
			<Root />
		</Auth0Provider>
	)
}

const router = createBrowserRouter([
	{
		path: '/',
		element: <AuthRoot />,
		children: [
			{
				index: true,
				element: <AuthGuard component={App} />,
			},
			{
				path: '/callback',
				element: <Callback />,
			},
			{
				path: '*',
				element: <AuthGuard component={NotFound} />,
			},
		],
	},
])

createRoot(document.getElementById('root')).render(
	<Provider store={store}>
		<RouterProvider router={router} />
	</Provider>
)
