import { useRef, useImperativeHandle, forwardRef, useState } from 'react'
import { useI18n } from '@/lang'
import Menu, { type MenuType, type Position } from '@/components/common/Menu'

export interface SelectInfo {
    musicInfo: LX.Music.MusicInfo
    selectedList: LX.Music.MusicInfo[]
    index: number
    // listId: string
    single: boolean
}
const initSelectInfo = {}

export interface ListMenuProps {
    onRemove: (selectInfo: SelectInfo) => void
}
export interface ListMenuType {
    show: (selectInfo: SelectInfo, position: Position) => void
}

export type {
    Position,
}

export default forwardRef<ListMenuType, ListMenuProps>((props, ref) => {
    const t = useI18n()
    const [visible, setVisible] = useState(false)
    const menuRef = useRef<MenuType>(null)
    const selectInfoRef = useRef<SelectInfo>(initSelectInfo as SelectInfo)

    useImperativeHandle(ref, () => ({
        show(selectInfo, position) {
            selectInfoRef.current = selectInfo
            if (visible) menuRef.current?.show(position)
            else {
                setVisible(true)
                requestAnimationFrame(() => {
                    menuRef.current?.show(position)
                })
            }
        },
    }))
    const menus = [{ action: 'remove', label: t('delete') }]
    const handleMenuPress = ({ action }: typeof menus[number]) => {
        const selectInfo = selectInfoRef.current
        switch (action) {
            case 'remove':
                props.onRemove(selectInfo)
                break
            default:
                break
        }
    }

    return (
        visible
            ? <Menu ref={menuRef} menus={menus} onPress={handleMenuPress} />
            : null
    )
})
