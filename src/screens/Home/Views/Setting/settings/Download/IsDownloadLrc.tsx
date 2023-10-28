import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import { memo } from 'react'
import { View } from 'react-native'
import { useSettingValue } from '@/store/setting/hook'


import CheckBoxItem from '../../components/CheckBoxItem'

export default memo(() => {
  const t = useI18n()
  const isDownloadLrc = useSettingValue('download.isDownloadLrc')
  const handleUpdate = (isShowHotSearch: boolean) => {
    updateSetting({ 'download.isDownloadLrc': isShowHotSearch })
  }

  return (
    <View style={styles.content}>
      <CheckBoxItem check={isDownloadLrc} onChange={handleUpdate} label={t('setting_download_lrc_enable')} />
    </View>
  )
})


const styles = createStyle({
  content: {
    marginTop: 5,
  },
})

