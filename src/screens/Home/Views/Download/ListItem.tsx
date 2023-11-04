import { memo, useRef } from 'react'
import { View, TouchableOpacity } from 'react-native'
// import Button from '@/components/common/Button'
import Text from '@/components/common/Text'
import Badge, { type BadgeType } from '@/components/common/Badge'
import { Icon } from '@/components/common/Icon'
import { useI18n } from '@/lang'
import { useTheme } from '@/store/theme/hook'
import { scaleSizeH } from '@/utils/pixelRatio'
import { LIST_ITEM_HEIGHT } from '@/config/constant'
import { createStyle, type RowInfo } from '@/utils/tools'
import {useAssertApiSupport} from "@/store/common/hook";
import playerState from "@/store/player/state";

export const ITEM_HEIGHT = scaleSizeH(LIST_ITEM_HEIGHT)

const useQualityTag = (musicInfo: LX.Music.MusicInfoBase) => {
  const t = useI18n()
  let info: { type: BadgeType | null, text: string } = { type: null, text: '' }
  // @ts-ignore
  if(!musicInfo.source === 'local'){
    const _musicInfo = musicInfo as LX.Music.MusicInfoOnline
    if (_musicInfo.meta._qualitys.flac24bit) {
      info.type = 'secondary'
      info.text = t('quality_lossless_24bit')
    } else if (_musicInfo.meta._qualitys.flac ?? _musicInfo.meta._qualitys.ape) {
      info.type = 'secondary'
      info.text = t('quality_lossless')
    } else if (_musicInfo.meta._qualitys['320k']) {
      info.type = 'tertiary'
      info.text = t('quality_high_quality')
    }
  }
  return info
}

export default memo(({ item, index, onPress, rowInfo, isShowAlbumName, isShowInterval, isActive }: {
  item: LX.Music.MusicInfoDownloaded
  index: number
  showSource?: boolean
  onPress: (item: LX.Music.MusicInfoDownloaded, index: number) => void
  rowInfo: RowInfo
  isShowAlbumName: boolean
  isShowInterval: boolean,
  isActive: boolean
}) => {
  const theme = useTheme()

  const tagInfo = useQualityTag(item)
  const isSupported = useAssertApiSupport(item.source)

  const singer = `${item.singer}${isShowAlbumName && item.meta.albumName ? ` · ${item.meta.albumName}` : ''}`

  return (
    <View style={{ ...styles.listItem, width: rowInfo.rowWidth, height: ITEM_HEIGHT, backgroundColor: 'rgba(0,0,0,0)', opacity: isSupported ? 1 : 0.5 }}>
      <TouchableOpacity style={styles.listItemLeft} onPress={() => { onPress(item, index) }}>
        {
          isActive
            ? <Icon style={styles.sn} name="play-outline" size={13} color={theme['c-primary-font']} />
            : <Text style={styles.sn} size={13} color={theme['c-300']}>{index + 1}</Text>
        }
        <View style={styles.itemInfo}>
          {/* <View style={styles.listItemTitle}> */}
          <Text color={isActive ? theme['c-primary-font'] : theme['c-font']} numberOfLines={1}>{item.name}</Text>
          {/* </View> */}
          <View style={styles.listItemSingle}>
            <Badge>{item.source.toUpperCase()}</Badge>
            <Text style={styles.listItemSingleText} size={11} color={isActive ? theme['c-primary-alpha-200'] : theme['c-500']} numberOfLines={1}>
              {singer}
            </Text>
          </View>
        </View>
        {
          isShowInterval ? (
            <Text size={12} color={isActive ? theme['c-primary-alpha-400'] : theme['c-250']} numberOfLines={1}>{item.interval}</Text>
          ) : null
        }
      </TouchableOpacity>
    </View>
  )
}, (prevProps, nextProps) => {
  return !!(prevProps.item === nextProps.item &&
    prevProps.index === nextProps.index &&
    prevProps.isShowAlbumName === nextProps.isShowAlbumName &&
    prevProps.isShowInterval === nextProps.isShowInterval &&
    prevProps.isActive === nextProps.isActive
  )
})

const styles = createStyle({
  listItem: {
    // width: '100%',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    // paddingLeft: 10,
    paddingRight: 2,
    alignItems: 'center',
    // borderBottomWidth: BorderWidths.normal,
  },
  listItemLeft: {
    flex: 1,
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  listActiveIcon: {
    // width: 18,
    marginLeft: 3,
    // paddingRight: 5,
    textAlign: 'center',
    verticalAlign:'middle'
  },
  sn: {
    width: 38,
    // fontSize: 12,
    textAlign: 'center',
    // backgroundColor: 'rgba(0,0,0,0.2)',
    paddingLeft: 3,
    paddingRight: 3,
  },
  itemInfo: {
    flexGrow: 1,
    flexShrink: 1,
    paddingRight: 2,
    // paddingTop: 10,
    // paddingBottom: 10,
  },
  // listItemTitle: {
  //   // backgroundColor: 'rgba(0,0,0,0.2)',
  //   flexGrow: 0,
  //   flexShrink: 1,
  //   // fontSize: 15,
  // },
  listItemSingle: {
    paddingTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    // alignItems: 'flex-end',
    // backgroundColor: 'rgba(0,0,0,0.2)',
  },
  listItemTimeLabel: {
    marginRight: 5,
    fontWeight: '400',
  },
  listItemSingleText: {
    // fontSize: 13,
    // paddingTop: 2,
    flexGrow: 0,
    flexShrink: 1,
    fontWeight: '300',
  },
  listItemBadge: {
    // fontSize: 10,
    paddingLeft: 5,
    paddingTop: 2,
    alignSelf: 'flex-start',
  },
  listItemRight: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto',
    justifyContent: 'center',
  },
  moreButton: {
    height: '80%',
    paddingLeft: 16,
    paddingRight: 16,
    // paddingTop: 10,
    // paddingBottom: 10,
    // backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
  },
})

