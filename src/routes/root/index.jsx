/**
 *
 * Layout
 *
 */
import { useAuth0 } from '@auth0/auth0-react'
import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'

import Loader from '~/comps/Loader'
import { IS_CONTROL, NAME } from '~/lib/constants'

const Root = () => {
	const { isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0()

	useEffect(() => {
		if (isAuthenticated) {
			if (!NAME) {
				const name = Math.random().toString(36).substring(2, 10)
				let query = `?name=${name}`
				if (IS_CONTROL) query += '&control'
				window.history.replaceState({}, '', query)
				return
			}

			const getToken = async () => {
				const token = await getAccessTokenSilently()
				console.log('token:')
				console.log(token)
			}
			getToken()
		}
	}, [isAuthenticated, getAccessTokenSilently])

	if (isLoading) return <Loader />
	return <Outlet />
}

export default Root
