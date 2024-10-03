/**
 *
 * Modal
 *
 */
import FocusLock from 'react-focus-lock'
import PropTypes from 'prop-types'
import { createPortal } from 'react-dom'

import styles from './index.module.scss'
import useClasses from '~/lib/useClasses'
import { forwardRef, memo } from 'react'

const modalRoot = document.getElementById('modal-root')

const Modal = forwardRef(({ children, className, overlayClass, autoFocus, onClose, onOkay, ...props }, ref) => {
	const onKeyDown = e => {
		if (e.key === 'Escape') {
			e.preventDefault()
			e.stopPropagation()
			onClose()
		} else if (e.key === 'Enter' && onOkay) {
			e.preventDefault()
			e.stopPropagation()
			onOkay()
		}
	}

	return createPortal(
		<div className={styles.cont} {...props} data-ignore onKeyDown={onKeyDown}>
			<FocusLock returnFocus>
				<div
					className={useClasses(styles.overlay, overlayClass)}
					onClick={onClose}
					tabIndex={autoFocus ? 0 : null}
					data-autofocus={autoFocus ? true : null}
				/>
				<div className={useClasses(className, styles.content)} ref={ref}>
					{children}
				</div>
			</FocusLock>
		</div>,
		modalRoot
	)
})

Modal.displayName = 'Modal'

Modal.propTypes = {
	className: PropTypes.string,
	children: PropTypes.node,
	onClose: PropTypes.func.isRequired,
	onOkay: PropTypes.func,
	overlayClass: PropTypes.string,
	autoFocus: PropTypes.bool,
}

export default memo(Modal)
