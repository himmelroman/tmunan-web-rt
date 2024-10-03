/**
 *
 * Confirm
 *
 */
import { memo } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { clearConfirm, confirmAction, selectConfirm } from '~/lib/redux'
import Button from '~/comps/Button'
import Modal from '~/comps/Modal'
import styles from './index.module.scss'

const Confirm = () => {
	const confirm = useSelector(selectConfirm)

	const dispatch = useDispatch()

	const onClose = () => {
		dispatch(clearConfirm())
	}

	const onYes = () => {
		dispatch(confirmAction())
	}

	const onNo = () => {
		dispatch(confirmAction(false))
	}

	return confirm ? (
		<Modal className={styles.cont} onClose={onClose}>
			<div className={styles.header}>{confirm.title}</div>
			<div className={styles.message}>{confirm.message}</div>
			<div className={styles.options}>
				{confirm.noAction ? (
					<>
						<Button onClick={onClose} data-autofocus>
							Cancel
						</Button>
						<Button onClick={onNo}>No</Button>
						<Button onClick={onYes}>Yes</Button>
					</>
				) : (
					<>
						<Button onClick={onClose} data-autofocus>
							Cancel
						</Button>
						<Button onClick={onYes}>Okay</Button>
					</>
				)}
			</div>
		</Modal>
	) : null
}

export default memo(Confirm)
