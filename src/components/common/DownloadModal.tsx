import Dialog, { type DialogType } from '@/components/common/Dialog'
import {View} from "react-native";
import {createStyle} from "@/utils/tools";
import React, {useImperativeHandle, useMemo, useRef, useState} from "react";
import Text from '@/components/common/Text'
import {useI18n} from "@/lang";
import {useTheme} from "@/store/theme/hook";
import Button from '@/components/common/Button'
import {useSettingValue} from "@/store/setting/hook";
import {downloadMusic} from "@/core/music/utils";

export interface DownloadModalType {
    show: (info: LX.Music.MusicInfo)=> void
}

const styles = createStyle({
  main: {
    padding: 15,
    maxWidth: 400,
    minWidth: 200,
    display: "flex",
    flexDirection: "column",
    flexWrap: "nowrap",
    justifyContent: "center",
    alignItems:'center'
  },
  h2: {
    fontSize: 13,
    color: "var(--color-font)",
    lineHeight: 1.3,
    textAlign: "center",
    marginBottom: 15,
  },
  button: {
    textAlign: 'center',
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: 5,
    paddingBottom: 5,
    borderRadius: 4,
    marginRight: 10,
    marginBottom: 8,
  },
  btnLastChild: {
    marginBottom: 0,
  },
})

export default React.forwardRef<DownloadModalType, {}>(({}, ref)=>{
    const dialogRef = useRef<DialogType>(null)
    const [visible, setVisible] = useState(false)
    const [musicInfo, setMusicInfo] = useState<LX.Music.MusicInfo>()
    const t = useI18n()
    const isDownloadLrc = useSettingValue('download.isDownloadLrc')
    const isEnableDownload = useSettingValue('download.enable')
    const isSkipFile = useSettingValue('download.skipIfFileExists')
    const theme = useTheme()
    const sourceQualityList = useMemo(()=>{
        if(musicInfo){
            return global.lx.qualityList[musicInfo!.source] || []
        }
        return []
    },[musicInfo, global.lx.qualityList])

    const qualitys = useMemo(()=>{
        if(musicInfo){
            return (musicInfo as LX.Music.MusicInfoOnline).meta?.qualitys?.filter(quality=> sourceQualityList.includes(quality.type))
        }
        return []
    },[musicInfo,sourceQualityList])
    const handleShow = () => {
        dialogRef.current?.setVisible(true)
    }
    const getTypeName = (quality: string) =>{
        switch (quality) {
            case 'flac24bit':
                return t('download__lossless') + ' FLAC Hires'
            case 'flac':
            case 'ape':
            case 'wav':
                return t('download__lossless') + ' ' + quality.toUpperCase()
            case '320k':
                return t('download__high_quality') + ' ' + quality.toUpperCase()
            case '192k':
            case '128k':
                return t('download__normal') + ' ' + quality.toUpperCase()
        }
    }
    useImperativeHandle(ref,()=>{
        return {
            show(info){
                setMusicInfo(info)
                if (visible) handleShow()
                else {
                    setVisible(true)
                    requestAnimationFrame(() => {
                        handleShow()
                    })
                }
            }
        }
    })
    return (
        <Dialog ref={dialogRef} bgHide={true}>
            <View style={styles.main}>
                <View style={styles.h2}>
                    <Text>{musicInfo?.name + '-' + musicInfo?.singer}</Text>
                </View>
                {
                    qualitys.map(quality=>{
                        return (
                            <Button style={styles.button} key={quality.type} onPress={()=>{
                                downloadMusic(
                                    musicInfo as LX.Music.MusicInfoOnline,
                                    {isDownloadLrc,isEnableDownload,isSkipFile},
                                    quality.type
                                )
                                dialogRef.current?.setVisible(false)
                            }}>
                                <Text color={theme['c-button-font']}>
                                    {
                                        getTypeName(quality.type) + '' + (quality.size ? ` - ${quality.size.toUpperCase()}` : '')
                                    }
                                </Text>
                            </Button>
                        )
                    })

                }
            </View>
        </Dialog>
    )
})
