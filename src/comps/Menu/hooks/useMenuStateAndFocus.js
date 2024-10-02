import { useState } from 'react'
import { useMenuState } from './useMenuState'

export const useMenuStateAndFocus = options => {
	const [menuProps, toggleMenu] = useMenuState(options)
	const [menuItemFocus, setMenuItemFocus] = useState()

	const openMenu = (position, alwaysUpdate) => {
		console.log('open menu 2')
		setMenuItemFocus({ position, alwaysUpdate })
		toggleMenu(true)
	}

	return [{ menuItemFocus, ...menuProps }, toggleMenu, openMenu]
}
