import {
  View,
  AppState, InteractionManager
} from 'react-native'
import {createStyle} from "@/utils/tools";
import List, {ListType} from "./List";
import {useEffect, useRef, useState} from "react";
import {InitState as CommonState} from "@/store/common/state";
import RNFetchBlob from "rn-fetch-blob";
import {getFileExtension, requestStoragePermission} from "@/core/music/utils";
import {getData, saveData} from "@/plugins/storage";
import {LIST_IDS, storageDataPrefix} from "@/config/constant";
import {clearListMusics, overwriteListMusics} from "@/core/list";
import {getListMusicSync} from "@/utils/listManage";
import {setList} from "@/core/songlist";
import state from "@/store/player/state";
import BackgroundTimer from "react-native-background-timer";
import {usePlayMusicInfo} from "@/store/player/hook";

const scanMusicFiles = async (): Promise<string[]> =>{
  await requestStoragePermission()
  const musicDir = `${RNFetchBlob.fs.dirs.DownloadDir}/lx.music`
  return RNFetchBlob.fs.ls(musicDir).then(files=>{
    return files.filter(file => file.endsWith('.mp3') || file.endsWith('.wav'));
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

function getConcatMusicInfos(fileNames: string[]): LX.Music.MusicInfoDownloaded[] {
  const downloadList = (getListMusicSync(LIST_IDS.DOWNLOAD) || []) as LX.Music.MusicInfoDownloaded[]
  if(fileNames.length >= downloadList.length){
    return downloadList.concat(fileNames.filter(fileName => {
      const path = `${RNFetchBlob.fs.dirs.DownloadDir}/lx.music/${fileName}`
      return !downloadList.some(item => item.meta.filePath === path)
    }).map(generateEmptyLocalMusicInfo))
  }
  else {
    const paths = fileNames.map(fileName=> `${RNFetchBlob.fs.dirs.DownloadDir}/lx.music/${fileName}`)
    return downloadList.filter(musicInfo=>{
      return paths.includes(musicInfo.meta.filePath)
    })
  }
}


function generateEmptyLocalMusicInfo(fullName: string): LX.Music.MusicInfoDownloaded{
  const id = generateRandomId()
  const dirs = RNFetchBlob.fs.dirs;
  return {
    "id": `local__${id}`,
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
      'filePath': `${dirs.DownloadDir}/lx.music/${fullName}`
    }
  }
}

export default () => {
  const listRef = useRef<ListType>(null)
  const [list, setList] = useState<LX.Music.MusicInfoDownloaded[]>([])

  const playMusicInfo = usePlayMusicInfo()
  const updateDownloadedList = async ():Promise<void> =>{
    void scanMusicFiles().then(files=>{
      console.log('scanMusicFiles', files);
      const updatedList = getConcatMusicInfos(files)
      setList(updatedList)
      overwriteListMusics(LIST_IDS.DOWNLOAD, updatedList, false)
    })
  }
  useEffect(() => {
    updateDownloadedList().then()

    const handleNavIdUpdate = (id: CommonState['navActiveId'])=>{
      if (id == 'nav_download'){
        updateDownloadedList().then()
      }
    }

    const handleDownloadListPositionChange = ()=>{
      console.log('handleDownloadListPositionChange');
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
      />
    </View>
  )
}

const styles = createStyle({
  container: {
    width: '100%',
    flex: 1,
  },
  content: {
    flex: 1,
  },
})
