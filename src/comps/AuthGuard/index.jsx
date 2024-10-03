/**
 *
 * AuthGuard
 *
 */
import { withAuthenticationRequired } from '@auth0/auth0-react'
import PropTypes from 'prop-types'

import Loader from '~/comps/Loader'
// import styles from './index.module.scss'

const AuthGuard = ({ component }) => {
	const Component = withAuthenticationRequired(component, {
		onRedirecting: () => <Loader />,
	})
	return <Component />
}

AuthGuard.propTypes = {
	component: PropTypes.elementType.isRequired,
}

export default AuthGuard
