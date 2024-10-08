/**
 *
 * Select
 *
 */
import { useSelect } from 'downshift'
import PropTypes from 'prop-types'
import { forwardRef, useCallback, useEffect, useMemo, useRef } from 'react'

import useClasses from '~/lib/useClasses'
import { noop } from '~/lib/utils'
import styles from './index.module.scss'

const Select = forwardRef((props, eref) => {
	const {
		name,
		className,
		options = [],
		value,
		onChange,
		itemToString = noop,
		buttonPrefix = '',
		disabled,
		children,
	} = props

	const buttonRef = useRef(null)

	const itemToValue = props.itemToValue || itemToString

	const [currentIndex, innerString, innerValue] = useMemo(() => {
		const index = value ? options.findIndex(o => itemToValue(o) === value) : 0
		const item = options[index]
		const str = itemToString(item)
		const val = itemToValue(item)
		return [index, str, val]
	}, [options, value])

	// Event handlers

	const onSelectedItemChange = useCallback(
		({ selectedItem }) => {
			onChange?.(itemToValue(selectedItem), name)
		},
		[onChange, options]
	)

	// Downshift hook

	const { isOpen, openMenu, closeMenu, getToggleButtonProps, getMenuProps, highlightedIndex, getItemProps } =
		useSelect({
			items: options,
			itemToString,
			onSelectedItemChange,
			selectedItem: options?.length ? options[currentIndex] : '',
			id: name,
			stateReducer: (s, { changes, type }) => {
				switch (type) {
					case useSelect.stateChangeTypes.ToggleButtonKeyDownArrowDown:
						if (s.highlightedIndex === options.length - 1) {
							return { ...changes, highlightedIndex: 0 }
						} else {
							return changes
						}
					case useSelect.stateChangeTypes.ToggleButtonKeyDownArrowUp:
						if (s.highlightedIndex === 0) {
							return { ...changes, highlightedIndex: options.length - 1 }
						} else {
							return changes
						}
					default:
						return changes
				}
			},
		})

	useEffect(() => {
		if (eref) {
			eref.current = {
				isOpen,
				openMenu,
				closeMenu,
				// TODO: focus
				// TODO: fix inner keyboard navigation
			}
		}
	}, [eref, openMenu, closeMenu, isOpen])

	// useEffect(() => {
	// 	if (!isOpen) {
	// 		if (buttonRef.current) {
	// 			buttonRef.current.blur()
	// 		}
	// 	}
	// }, [isOpen])

	const cls = useClasses(styles.cont, className, (disabled || options.length < 2) && styles.disabled)

	return (
		<div
			id={name ? `${name}-select` : undefined}
			name={name}
			className={cls}
			tabIndex={disabled ? -1 : null}
			data-select
		>
			<div {...getMenuProps()} className={`${styles.menu} ${isOpen && styles.is_open}`} data-menu>
				{options.map((item, index) => {
					const itemValue = itemToValue(item)
					const itemString = itemToString(item)
					const current = itemValue === innerValue
					return (
						<div
							key={`g-${itemString}`}
							data-item
							data-first={current || undefined}
							data-index={index}
							{...getItemProps({ item, index })}
							className={`${styles.menu_item} ${highlightedIndex === index ? styles.selected_item : ''} ${current ? styles.current_item : ''}`}
						>
							<div className={styles.item_text}>{itemString}</div>
						</div>
					)
				})}
			</div>
			<div className={styles.open_button} {...getToggleButtonProps({ ref: buttonRef })} data-button>
				{buttonPrefix}
				{innerString}
			</div>
			{children}
		</div>
	)
})

Select.displayName = 'Select'

Select.propTypes = {
	name: PropTypes.string.isRequired,
	className: PropTypes.string,
	options: PropTypes.array,
	itemToString: PropTypes.func,
	itemToValue: PropTypes.func,
	onChange: PropTypes.func,
	value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.object]),
	buttonPrefix: PropTypes.string,
	disabled: PropTypes.bool,
	children: PropTypes.node,
}

export default Select
