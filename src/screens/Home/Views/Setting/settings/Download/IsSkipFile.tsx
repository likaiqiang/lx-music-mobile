import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import { memo } from 'react'
import { View } from 'react-native'
import { useSettingValue } from '@/store/setting/hook'


import CheckBoxItem from '../../components/CheckBoxItem'

export default memo(() => {
  const t = useI18n()
  const isSkipFile = useSettingValue('download.skipIfFileExists')
  const handleUpdate = (isShowHotSearch: boolean) => {
    updateSetting({ 'download.skipIfFileExists': isShowHotSearch })
  }

  return (
    <View style={styles.content}>
      <CheckBoxItem check={isSkipFile} onChange={handleUpdate} label={t('setting_download_skip_file')} />
    </View>
  )
})


const styles = createStyle({
  content: {
    marginTop: 5,
  },
})

