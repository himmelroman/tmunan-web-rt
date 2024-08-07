/**
 *
 * Select
 *
 */
import PropTypes from 'prop-types'
import { useSelect } from 'downshift'
import { useCallback, useEffect, useMemo, forwardRef } from 'react'

import useClasses from '~/lib/useClasses'
import styles from './index.module.scss'

const noop = () => {}

const noToString = item => item

const Select = forwardRef((props, eref) => {
	const { name, className, options = [], value, onChange = noop, itemToString = noToString, buttonPrefix = '', disabled } = props

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
			onChange(name, itemToValue(selectedItem))
		},
		[onChange, options]
	)

	// Downshift hook

	const { isOpen, openMenu, closeMenu, getToggleButtonProps, getMenuProps, highlightedIndex, getItemProps } = useSelect({
		items: options,
		itemToString,
		onSelectedItemChange,
		selectedItem: options?.length ? options[currentIndex] : '',
		id: name,
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

	const cls = useClasses(styles.cont, className, (disabled || options.length < 2) && styles.disabled)

	return (
		<div id={`${name}-select`} name={name} className={cls} tabIndex={disabled ? -1 : null} data-select>
			<div {...getMenuProps()} className={`${styles.menu} ${isOpen && styles.is_open}`} data-menu>
				{options.map((item, index) => {
					const itemValue = itemToValue(item)
					const current = itemValue === innerValue
					return (
						<div
							key={`g-${itemValue}`}
							data-item
							data-first={current || undefined}
							data-index={index}
							{...getItemProps({ item, index })}
							className={`${styles.menu_item} ${highlightedIndex === index ? styles.selected_item : ''} ${current ? styles.current_item : ''}`}
						>
							<div className={styles.item_text}>{itemToString(item)}</div>
						</div>
					)
				})}
			</div>
			<div className={styles.open_button} {...getToggleButtonProps()} data-button>
				{buttonPrefix}
				{innerString}
			</div>
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
}

export default Select
