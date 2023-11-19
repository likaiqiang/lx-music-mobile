import {
  View,
  AppState,
  Platform
} from 'react-native'
import {createStyle} from "@/utils/tools";
import List, {ListType} from "./List";
import React, {useEffect, useImperativeHandle, useMemo, useRef, useState} from "react";
import {InitState as CommonState} from "@/store/common/state";
import RNFetchBlob from "rn-fetch-blob";
import {getFileExtension, requestStoragePermission} from "@/core/music/utils";
import {LIST_IDS} from "@/config/constant";
import {getListMusicSync} from "@/utils/listManage";
import {usePlayMusicInfo} from "@/store/player/hook";

import ListMenu, { type ListMenuType, type Position, type SelectInfo } from './ListMenu'
import {overwriteListMusics} from "@/core/list";
import ConfirmAlert, {ConfirmAlertType} from "@/components/common/ConfirmAlert";
import Text from "@/components/common/Text";
import BackgroundTimer from "react-native-background-timer";

const supportMusic = Platform.OS === 'android' ? ['mp3','wma','wav','ape','flac','ogg','aac'] : ['mp3','wma','wav','flac','aac']


const scanMusicFiles = async (musicDir?:string): Promise<string[]> =>{
  return RNFetchBlob.fs.ls(musicDir as string).then(files=>{
    return files.filter(file => {
      return !!(supportMusic.find(item=> file.toLocaleLowerCase().endsWith(item)))
    });
  })
}

function getFileNameWithoutExtension(filename:string) {
  const match = filename.match(/(.+)(\.[^.]+)$/);
  if (match) {
    return match[1];
  } else {
    return filename;
  }
}

function generateRandomId() {
  return 'id-' + Math.random().toString(36).slice(2, 9) + Date.now();
}

function generateEmptyLocalMusicInfo(fullName: string, dir: string): LX.Music.MusicInfoDownloaded{
  const filePath = `${dir}/${fullName}`
  const id = `local__${filePath}`
  return {
    "id": id,
    "name": getFileNameWithoutExtension(fullName),
    "singer":'',
    "source":'local',
    "interval":'',
    "meta": {
      "songId": id,
      "albumName": "",
      "picUrl":"",
      "fileName": getFileNameWithoutExtension(fullName),
      "ext": getFileExtension(fullName),
      'filePath': filePath
    }
  }
}

export interface DownloadTypes {
  setFilePath: (path: string)=>void
}


export default React.forwardRef<DownloadTypes,{}>((_, ref) => {
  const listRef = useRef<ListType>(null)
  const [list, setList] = useState<LX.Music.MusicInfoDownloaded[]>([])
  const listMenuRef = useRef<ListMenuType>(null)
  const confirmAlertRef = useRef<ConfirmAlertType>(null)
  const [selectMusicInfo, setSelectMusicInfo] = useState<LX.Music.MusicInfoLocal>()
  const playMusicInfo = usePlayMusicInfo()
  const timerRef = useRef<number>()
  const [path, setPath] = useState('')
  const pathRef = useRef<string>(path)
  pathRef.current = path
  const dirRef = useRef(`${RNFetchBlob.fs.dirs.DownloadDir}/lx.music`)

  const updateDownloadedList = async ():Promise<void> =>{
    if(timerRef.current) BackgroundTimer.clearTimeout(timerRef.current)
    if(pathRef.current){
      dirRef.current = pathRef.current.substring(0, pathRef.current.lastIndexOf('/'))
    }
    timerRef.current = BackgroundTimer.setTimeout(()=>{
      scanMusicFiles(dirRef.current).then(files=>{
        const updatedList = files.map((file=> generateEmptyLocalMusicInfo(file, dirRef.current)))
        setList(updatedList)
        overwriteListMusics(LIST_IDS.DOWNLOAD, updatedList, false)
        if(pathRef.current){
          requestAnimationFrame(()=>{
            listRef.current!.playFilePath(pathRef.current)
            setPath('')
          })
        }
      })
    },300)
  }

  useImperativeHandle(ref,()=>{
    return {
      setFilePath(path:string){
        setPath(path)
      }
    }
  })
  const showMenu = (musicInfo: LX.Music.MusicInfoLocal, index: number, position: Position) => {
    listMenuRef.current?.show({
      musicInfo,
      index,
      single: false,
      selectedList: [],
    }, position)
  }
  useEffect(() => {
    updateDownloadedList().then()

    const handleNavIdUpdate = (id: CommonState['navActiveId'])=>{
      if (id == 'nav_download'){
        updateDownloadedList().then()
      }
    }

    const handleDownloadListPositionChange = ()=>{
      global.state_event.navActiveIdUpdated('nav_download')
      listRef.current?.jumpPosition()
    }


    global.state_event.on('navActiveIdUpdated', handleNavIdUpdate)
    global.app_event.on('jumpDownloadListPosition',handleDownloadListPositionChange)
    const appStateSubscription = AppState.addEventListener('change',e=>{
      if(e === 'active'){
        updateDownloadedList().then()
      }
    })
    return () => {
      global.state_event.off('navActiveIdUpdated', handleNavIdUpdate)
      global.app_event.off('jumpDownloadListPosition',handleDownloadListPositionChange)
      appStateSubscription.remove()
    }
  }, []);
  const confirmAlertText = useMemo(()=>{
    if(!selectMusicInfo) return ''
    return `真的要删除\n${selectMusicInfo!.name}.${selectMusicInfo!.meta.ext}\n吗？`
  },[selectMusicInfo])
  return (
    <View style={styles.container}>
      <List
        ref={listRef}
        onLoadMore={()=>{}}
        onRefresh={()=>{
          updateDownloadedList().then()
        }}
        checkHomePagerIdle={false}
        list={list}
        playid={playMusicInfo.musicInfo?.id || ''}
        onPress={(item)=>{

        }}
        onShowMenu={showMenu}
      />
      <ListMenu
          ref={listMenuRef}
          onRemove={(info)=>{
            setSelectMusicInfo(info.musicInfo as LX.Music.MusicInfoLocal)
            confirmAlertRef.current?.setVisible(true)
          }}
      />
      <ConfirmAlert
          onConfirm={()=>{
            RNFetchBlob.fs.unlink(selectMusicInfo!.meta.filePath).then(()=>{
              return updateDownloadedList()
            }).then(()=>{
              confirmAlertRef.current!.setVisible(false)
            })
          }}
          text={confirmAlertText}
          ref={confirmAlertRef}
      >
        <Text style={{textAlign:'center'}}>
          {confirmAlertText}
        </Text>
      </ConfirmAlert>
    </View>
  )
})

const styles = createStyle({
  container: {
    width: '100%',
    flex: 1,
  },
  content: {
    flex: 1,
  },
})
