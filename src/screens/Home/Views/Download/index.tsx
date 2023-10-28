import {
  View,
  AppState
} from 'react-native'
import {createStyle} from "@/utils/tools";
import List, {ListType} from "./List";
import {useEffect, useRef, useState} from "react";
import {InitState as CommonState} from "@/store/common/state";
import RNFetchBlob from "rn-fetch-blob";
import {getFileExtension, requestStoragePermission} from "@/core/music/utils";
import {getData, saveData} from "@/plugins/storage";
import {storageDataPrefix} from "@/config/constant";

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

function generateEmptyLocalMusicInfo(filePath: string): LX.Music.MusicInfoDownloaded{
  const id = generateRandomId()
  const dirs = RNFetchBlob.fs.dirs;
  return {
    "id": `local__${id}`,
    "name": getFileNameWithoutExtension(filePath),
    "singer":'',
    "source":'local',
    "interval":'',
    "meta": {
      "songId": id,
      "albumName": "",
      "picUrl":"",
      "fileName": getFileNameWithoutExtension(filePath),
      "ext": getFileExtension(filePath),
      'filePath': `${dirs.DownloadDir}/lx.music/${filePath}`
    }
  }
}

const getDownloadedList = async ():Promise<LX.Music.MusicInfoDownloaded[]> =>{
  return scanMusicFiles().then(files=>{
    return files.reduce<LX.Music.MusicInfoDownloaded[]>((acc,filename)=>{
      acc.push(
        generateEmptyLocalMusicInfo(filename)
      )
      return acc
    },[])
  })
}

export default () => {
  const listRef = useRef<ListType>(null)
  const [list, setList] = useState<LX.Music.MusicInfoDownloaded[]>([])
  useEffect(() => {
    console.log('useEffect');
    getDownloadedList().then(setList)

    const handleNavIdUpdate = (id: CommonState['navActiveId'])=>{
      if (id == 'nav_download'){
        getDownloadedList().then(setList)
      }
    }

    global.state_event.on('navActiveIdUpdated', handleNavIdUpdate)
    const appStateSubscription = AppState.addEventListener('change',e=>{
      if(e === 'active'){
        getDownloadedList().then(setList)
      }
    })
    return () => {
      global.state_event.off('navActiveIdUpdated', handleNavIdUpdate)
      appStateSubscription.remove()
    }
  }, []);
  return (
    <View style={styles.container}>
      <List
        ref={listRef}
        onLoadMore={()=>{}}
        onRefresh={()=>{
          getDownloadedList().then(setList)
        }}
        onPlayList={()=>{}}
        checkHomePagerIdle={false}
        list={list}
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
