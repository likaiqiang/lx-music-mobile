import { memo } from 'react'

import Section from '../../components/Section'
import IsDownloadLrc from './IsDownloadLrc'
import IsEnableDownload from './IsEnableDownload'
import IsSkipFile from "./IsSkipFile";

import { useI18n } from '@/lang'
import {useSettingValue} from "@/store/setting/hook";

export default memo(() => {
  const t = useI18n()
  const isEnableDownload = useSettingValue('download.enable')
  return (
    <Section title={t('setting_download')}>
      <IsEnableDownload/>
      {
        isEnableDownload ? (
          <>
            <IsDownloadLrc/>
            <IsSkipFile/>
          </>
        ) : null
      }
    </Section>
  )
})
