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
import {handlelocalPlay, handlePlay} from '@/components/OnlineList/listAction'
import { useSettingValue } from '@/store/setting/hook'
import playerState from "@/store/player/state";
import {useActiveListId} from "@/store/list/hook";
import {usePlayInfo, usePlayMusicInfo} from "@/store/player/hook";

type FlatListType = FlatListProps<LX.Music.MusicInfoDownloaded>

export type {
  RowInfoType,
}

export interface ListProps {
  list: LX.Music.MusicInfoDownloaded[]
  playid: string
  onRefresh: () => void
  onLoadMore: () => void
  onPlayList?: (index: number) => void
  progressViewOffset?: number
  ListHeaderComponent?: FlatListType['ListEmptyComponent']
  checkHomePagerIdle: boolean
  rowType?: RowInfoType
  onPress?: (item: LX.Music.MusicInfoDownloaded)=>void
}
export interface ListType {
  // setList: (list: LX.Music.MusicInfoDownloaded[], isAppend: boolean, showSource: boolean) => void
  // getList: () => LX.Music.MusicInfoDownloaded[]
  // setStatus: (val: Status) => void
  jumpPosition: ()=> void
}
export type Status = 'loading' | 'refreshing' | 'end' | 'error' | 'idle'


const List = forwardRef<ListType, ListProps>(({
                                                list,
                                                onRefresh,
                                                onLoadMore,
                                                progressViewOffset,
                                                checkHomePagerIdle,
                                                rowType,
                                                playid,
                                                onPress
                                              }, ref) => {
  // const t = useI18n()
  const theme = useTheme()
  const flatListRef = useRef<FlatList>(null)
  const [showSource, setShowSource] = useState(false)
  const [visibleMultiSelect, setVisibleMultiSelect] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const rowInfo = useRef(getRowInfo(rowType))
  const isShowAlbumName = useSettingValue('list.isShowAlbumName')
  const isShowInterval = useSettingValue('list.isShowInterval')

  const handlePress = (item: LX.Music.MusicInfoDownloaded, index: number) => {
    requestAnimationFrame(() => {
      if (checkHomePagerIdle && !global.lx.homePagerIdle) return
      // if (settingState.setting['list.isClickPlayList'] && onPlayList != null) {
      //   onPlayList(index)
      // } else {
      //   // console.log(currentList[index])
      //   handlelocalPlay(list[index])
      // }
      handlelocalPlay(list[index])
      onPress?.(item)
    })
  }
  useImperativeHandle(ref,()=>{
    const activeIndex = list.findIndex(item=>item.id === playid)
    return {
      jumpPosition(){
        if(activeIndex > -1){
          flatListRef.current?.scrollToIndex({ index: activeIndex, viewPosition: 0.3, animated: true })
        }
      }
    }
  })
  const renderItem: FlatListType['renderItem'] = ({ item, index }) => {
    const isActive = item.id === playid
    return (
        <ListItem
            item={item}
            index={index}
            showSource={showSource}
            onPress={handlePress}
            rowInfo={rowInfo.current}
            isShowAlbumName={isShowAlbumName}
            isShowInterval={isShowInterval}
            isActive={isActive}
        />
    )
  }
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
      data={list}
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
