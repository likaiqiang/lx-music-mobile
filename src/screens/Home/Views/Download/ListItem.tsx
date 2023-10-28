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

export const ITEM_HEIGHT = scaleSizeH(LIST_ITEM_HEIGHT)

const useQualityTag = (musicInfo: LX.Music.MusicInfoBase) => {
  const t = useI18n()
  let info: { type: BadgeType | null, text: string } = { type: null, text: '' }
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

export default memo(({ item, index, showSource, onPress, rowInfo, isShowAlbumName, isShowInterval }: {
  item: LX.Music.MusicInfoDownloaded
  index: number
  showSource?: boolean
  onPress: (item: LX.Music.MusicInfoDownloaded, index: number) => void
  rowInfo: RowInfo
  isShowAlbumName: boolean
  isShowInterval: boolean
}) => {
  const theme = useTheme()

  const tagInfo = useQualityTag(item)

  const singer = `${item.singer}${isShowAlbumName && item.meta.albumName ? ` · ${item.meta.albumName}` : ''}`

  return (
    <View style={{ ...styles.listItem, width: rowInfo.rowWidth, height: ITEM_HEIGHT, backgroundColor: 'rgba(0,0,0,0)' }}>
      <TouchableOpacity style={styles.listItemLeft} onPress={() => { onPress(item, index) }}>
        <Text style={styles.sn} size={13} color={theme['c-300']}>{index + 1}</Text>
        <View style={styles.itemInfo}>
          <Text numberOfLines={1}>{item.name}</Text>
          <View style={styles.listItemSingle}>
            { tagInfo.type ? <Badge type={tagInfo.type}>{tagInfo.text}</Badge> : null }
            { showSource ? <Badge type="tertiary">{item.source}</Badge> : null }
            <Text style={styles.listItemSingleText} size={11} color={theme['c-500']} numberOfLines={1}>{singer}</Text>
          </View>
        </View>
        {
          isShowInterval ? (
            <Text size={12} color={theme['c-250']} numberOfLines={1}>{item.interval}</Text>
          ) : null
        }
      </TouchableOpacity>
    </View>
  )
}, (prevProps, nextProps) => {
  return !!(prevProps.item === nextProps.item &&
    prevProps.index === nextProps.index &&
    prevProps.isShowAlbumName === nextProps.isShowAlbumName &&
    prevProps.isShowInterval === nextProps.isShowInterval
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

