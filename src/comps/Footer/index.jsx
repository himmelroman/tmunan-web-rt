/**
 *
 * Footer
 *
 */
import { useSelector } from 'react-redux'
import { VERSION } from '~/lib/constants'
import { selectApp, selectConnected } from '~/lib/redux'
import useClasses from '~/lib/useClasses'
import styles from './index.module.scss'

const Footer = () => {
	const { ably_state, rtc_state } = useSelector(selectApp)
	const connected = useSelector(selectConnected)

	const cls = useClasses(styles.cont, connected && styles.connected)

	return (
		<div className={cls}>
			<div className={styles.leds}>
				<div className={styles.led} data-state={ably_state} />
				<div className={styles.led} data-state={rtc_state} />
			</div>
			<span className='spacer' />
			<div className={styles.version}>{VERSION}</div>
		</div>
	)
}

export default Footer
