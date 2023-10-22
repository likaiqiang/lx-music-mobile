import { useMemo, useRef, useState, forwardRef, useImperativeHandle } from 'react'
import { FlatList, type FlatListProps, RefreshControl, View } from 'react-native'
import ListItem, { ITEM_HEIGHT } from './ListItem'
import { createStyle, getRowInfo, type RowInfoType } from '@/utils/tools'
import type { Position } from '@/components/OnlineList/ListMenu'
import type { SelectMode } from '@/components/OnlineList/MultipleModeBar'
import { useTheme } from '@/store/theme/hook'
import settingState from '@/store/setting/state'
import { MULTI_SELECT_BAR_HEIGHT } from '@/components/OnlineList/MultipleModeBar'
import { useI18n } from '@/lang'
import Text from '@/components/common/Text'
import { handlePlay } from '@/components/OnlineList/listAction'
import { useSettingValue } from '@/store/setting/hook'

type FlatListType = FlatListProps<LX.Music.MusicInfoOnline>

export type {
  RowInfoType,
}

export interface ListProps {
  onShowMenu: (musicInfo: LX.Music.MusicInfoOnline, index: number, position: Position) => void
  onMuiltSelectMode: () => void
  onSelectAll: (isAll: boolean) => void
  onRefresh: () => void
  onLoadMore: () => void
  onPlayList?: (index: number) => void
  progressViewOffset?: number
  ListHeaderComponent?: FlatListType['ListEmptyComponent']
  checkHomePagerIdle: boolean
  rowType?: RowInfoType
}
export interface ListType {
  setList: (list: LX.Music.MusicInfoOnline[], isAppend: boolean, showSource: boolean) => void
  setIsMultiSelectMode: (isMultiSelectMode: boolean) => void
  setSelectMode: (mode: SelectMode) => void
  selectAll: (isAll: boolean) => void
  getSelectedList: () => LX.Music.MusicInfoOnline[]
  getList: () => LX.Music.MusicInfoOnline[]
  setStatus: (val: Status) => void
}
export type Status = 'loading' | 'refreshing' | 'end' | 'error' | 'idle'


const List = forwardRef<ListType, ListProps>(({
                                                onMuiltSelectMode,
                                                onSelectAll,
                                                onRefresh,
                                                onShowMenu,
                                                onLoadMore,
                                                onPlayList,
                                                progressViewOffset,
                                                checkHomePagerIdle,
                                                rowType,
                                              }, ref) => {
  // const t = useI18n()
  const theme = useTheme()
  const flatListRef = useRef<FlatList>(null)
  const [currentList, setList] = useState<LX.Music.MusicInfoOnline[]>([])
  const [showSource, setShowSource] = useState(false)
  const isMultiSelectModeRef = useRef(false)
  const selectModeRef = useRef<SelectMode>('single')
  const prevSelectIndexRef = useRef(-1)
  const [selectedList, setSelectedList] = useState<LX.Music.MusicInfoOnline[]>([])
  const selectedListRef = useRef<LX.Music.MusicInfoOnline[]>([])
  const [visibleMultiSelect, setVisibleMultiSelect] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const rowInfo = useRef(getRowInfo(rowType))
  const isShowAlbumName = useSettingValue('list.isShowAlbumName')
  const isShowInterval = useSettingValue('list.isShowInterval')


  const handleUpdateSelectedList = (newList: LX.Music.MusicInfoOnline[]) => {
    if (selectedListRef.current.length && newList.length == currentList.length) onSelectAll(true)
    else if (selectedListRef.current.length == currentList.length) onSelectAll(false)
    selectedListRef.current = newList
    setSelectedList(newList)
  }
  const handleSelect = (item: LX.Music.MusicInfoOnline, pressIndex: number) => {
    let newList: LX.Music.MusicInfoOnline[]
    if (selectModeRef.current == 'single') {
      prevSelectIndexRef.current = pressIndex
      const index = selectedListRef.current.indexOf(item)
      if (index < 0) {
        newList = [...selectedListRef.current, item]
      } else {
        newList = [...selectedListRef.current]
        newList.splice(index, 1)
      }
    } else {
      if (selectedListRef.current.length) {
        const prevIndex = prevSelectIndexRef.current
        const currentIndex = pressIndex
        if (prevIndex == currentIndex) {
          newList = []
        } else if (currentIndex > prevIndex) {
          newList = currentList.slice(prevIndex, currentIndex + 1)
        } else {
          newList = currentList.slice(currentIndex, prevIndex + 1)
          newList.reverse()
        }
      } else {
        newList = [item]
        prevSelectIndexRef.current = pressIndex
      }
    }

    handleUpdateSelectedList(newList)
  }

  const handlePress = (item: LX.Music.MusicInfoOnline, index: number) => {
    requestAnimationFrame(() => {
      if (checkHomePagerIdle && !global.lx.homePagerIdle) return
      if (isMultiSelectModeRef.current) {
        handleSelect(item, index)
      } else {
        if (settingState.setting['list.isClickPlayList'] && onPlayList != null) {
          onPlayList(index)
        } else {
          // console.log(currentList[index])
          handlePlay(currentList[index])
        }
      }
    })
  }

  const handleLongPress = (item: LX.Music.MusicInfoOnline, index: number) => {
    if (isMultiSelectModeRef.current) return
    prevSelectIndexRef.current = index
    handleUpdateSelectedList([item])
    onMuiltSelectMode()
  }


  const renderItem: FlatListType['renderItem'] = ({ item, index }) => (
    <ListItem
      item={item}
      index={index}
      showSource={showSource}
      onShowMenu={onShowMenu}
      onPress={handlePress}
      onLongPress={handleLongPress}
      selectedList={selectedList}
      rowInfo={rowInfo.current}
      isShowAlbumName={isShowAlbumName}
      isShowInterval={isShowInterval}
    />
  )
  const getkey: FlatListType['keyExtractor'] = item => item.id
  const getItemLayout: FlatListType['getItemLayout'] = (data, index) => {
    return { length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index }
  }
  const refreshControl = useMemo(() => (
    <RefreshControl
      colors={[theme['c-primary']]}
      // progressBackgroundColor={theme.primary}
      refreshing={status == 'refreshing'}
      onRefresh={onRefresh} />
  ), [status, onRefresh, theme])
  const footerComponent = useMemo(() => {
    let label: FooterLabel
    switch (status) {
      case 'refreshing': return null
      case 'loading':
        label = 'list_loading'
        break
      case 'end':
        label = 'list_end'
        break
      case 'error':
        label = 'list_error'
        break
      case 'idle':
        label = null
        break
    }
    return (
      <View style={{ width: '100%', paddingBottom: visibleMultiSelect ? MULTI_SELECT_BAR_HEIGHT : 0 }} >
        <Footer label={label} onLoadMore={onLoadMore} />
      </View>
    )
  }, [onLoadMore, status, visibleMultiSelect])

  return (
    <FlatList
      ref={flatListRef}
      style={styles.list}
      data={currentList}
      numColumns={rowInfo.current.rowNum}
      horizontal={false}
      maxToRenderPerBatch={4}
      windowSize={8}
      removeClippedSubviews={true}
      initialNumToRender={12}
      renderItem={renderItem}
      keyExtractor={getkey}
      getItemLayout={getItemLayout}
      onEndReachedThreshold={0.5}
      progressViewOffset={progressViewOffset}
      refreshControl={refreshControl}
      ListFooterComponent={footerComponent}
    />
  )
})

type FooterLabel = 'list_loading' | 'list_end' | 'list_error' | null
const Footer = ({ label, onLoadMore }: {
  label: FooterLabel
  onLoadMore: () => void
}) => {
  const theme = useTheme()
  const t = useI18n()
  const handlePress = () => {
    if (label != 'list_error') return
    onLoadMore()
  }
  return (
    label
      ? (
        <View>
          <Text onPress={handlePress} style={styles.footer} color={theme['c-font-label']}>{t(label)}</Text>
        </View>
      )
      : null
  )
}

const styles = createStyle({
  container: {
    flex: 1,
  },
  list: {
    flexGrow: 1,
    flexShrink: 1,
  },
  footer: {
    textAlign: 'center',
    padding: 10,
  },
})

export default List
