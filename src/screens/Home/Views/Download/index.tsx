import {
  View,
  AppState,
  Platform
} from 'react-native'
import {createStyle, toast} from "@/utils/tools";
import List, {ListType} from "./List";
import React, {useEffect, useImperativeHandle, useMemo, useRef, useState} from "react";
import {InitState as CommonState} from "@/store/common/state";
import RNFetchBlob from "rn-fetch-blob";
import {getFileExtension, requestStoragePermission} from "@/core/music/utils";
import {LIST_IDS} from "@/config/constant";
import {usePlayMusicInfo} from "@/store/player/hook";
import cnchar from 'cnchar'
import cloneDeep from 'clone-deep'

import ListMenu, { type ListMenuType, type Position, type SelectInfo } from './ListMenu'
import {overwriteListMusics} from "@/core/list";
import ConfirmAlert, {ConfirmAlertType} from "@/components/common/ConfirmAlert";
import Text from "@/components/common/Text";
import BackgroundTimer, {TimeoutId} from "react-native-background-timer";
import InputItem from "@/screens/Home/Views/Setting/components/InputItem";
import {useI18n} from "@/lang";

const supportMusic = Platform.OS === 'android' ? ['mp3','wma','wav','ape','flac','ogg','aac'] : ['mp3','wma','wav','flac','aac']

const createDebouncedFunction = <T extends any[]>(
  func: (...args: T) => Promise<void>,
  wait: number
): ((...args: T) => Promise<void>) => {
  let timeoutId: TimeoutId | null;
  let pendingPromiseReject: ((reason?: any) => void) | null = null;

  return (...args: T): Promise<void> => {
    // 返回一个新的Promise
    return new Promise<void>((resolve, reject) => {
      // 如果已存在timeoutId，则清除并拒绝挂起的Promise
      if (timeoutId) {
        BackgroundTimer.clearTimeout(timeoutId);
        if (pendingPromiseReject) {
          pendingPromiseReject(new Error("Debounced"));
        }
      }
      pendingPromiseReject = reject; // 存储当前Promise的reject方法

      // 设置一个新的定时器
      timeoutId = BackgroundTimer.setTimeout(() => {
        timeoutId = null
        pendingPromiseReject = null;
        // 调用原始函数并传递参数，然后根据执行结果解决或拒绝Promise
        func(...args).then(resolve).catch(reject);
      }, wait);
    });
  };
};

const createSinglePromiseFunction = <T extends any[]>(
  func: (...args: T) => Promise<void>
): ((...args: T) => Promise<void>) => {
  let lastPromise: Promise<void> | null = null;

  return (...args: T): Promise<void> => {
    // 如果上一个promise还没解决，则返回它
    if (lastPromise) return lastPromise;

    // 创建新的promise，并保存它
    lastPromise = func(...args).then(
      () => {
        // 成功时重置promise为null
        lastPromise = null;
      },
      () => {
        // 失败时也重置promise为null
        lastPromise = null;
      }
    );

    return lastPromise;
  };
};


const scanMusicFiles = async (musicDir?:string): Promise<string[]> =>{
  await requestStoragePermission()
  return RNFetchBlob.fs.ls(musicDir as string).then(files=>{
    return files.filter(file => {
      return !!(supportMusic.find(item=> file.toLocaleLowerCase().endsWith(item)))
    }).sort((a,b)=>{
      return (cnchar.spell(a) as string).localeCompare((cnchar.spell(b) as string));
    })
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
  const renameRef = useRef<ConfirmAlertType>(null)
  const [selectMusicInfo, setSelectMusicInfo] = useState<LX.Music.MusicInfoLocal>()
  const playMusicInfo = usePlayMusicInfo()
  const timerRef = useRef<number>()
  const [path, setPath] = useState('')
  const pathRef = useRef<string>(path)
  pathRef.current = path
  const dirRef = useRef(`${RNFetchBlob.fs.dirs.DownloadDir}/lx.music`)
  const renameInputRef = useRef('')
  const t = useI18n()

  const updateDownloadedList = createSinglePromiseFunction(async (): Promise<void> => {
    if (pathRef.current) {
      dirRef.current = pathRef.current.substring(0, pathRef.current.lastIndexOf('/'))
    }
    const files = await scanMusicFiles(dirRef.current);
    const updatedList = files.map((file => generateEmptyLocalMusicInfo(file, dirRef.current)));
    setList(updatedList);
    await overwriteListMusics(LIST_IDS.DOWNLOAD, updatedList, false);
    if (pathRef.current) {
      requestAnimationFrame(() => {
        listRef.current!.playFilePath(pathRef.current);
        setPath('');
      });
    }
  })

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
    listRef.current?.startRefresh(
      updateDownloadedList()
    ).then()

    const handleNavIdUpdate = (id: CommonState['navActiveId'])=>{
      if (id == 'nav_download'){
        listRef.current?.startRefresh(
          updateDownloadedList()
        ).then()
      }
    }

    const handleDownloadListPositionChange = ()=>{
      global.state_event.navActiveIdUpdated('nav_download')
      listRef.current?.jumpPosition()
    }


    global.state_event.on('navActiveIdUpdated', handleNavIdUpdate)
    global.app_event.on('jumpDownloadListPosition',handleDownloadListPositionChange)
    // const appStateSubscription = AppState.addEventListener('change',e=>{
    //   if(e === 'active'){
    //     listRef.current?.startRefresh(
    //       updateDownloadedList()
    //     ).then()
    //   }
    // })
    return () => {
      global.state_event.off('navActiveIdUpdated', handleNavIdUpdate)
      global.app_event.off('jumpDownloadListPosition',handleDownloadListPositionChange)
      // appStateSubscription.remove()
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
          onrRename={(info)=>{
            setSelectMusicInfo(info.musicInfo as LX.Music.MusicInfoLocal)
            renameRef.current?.setVisible(true)
          }}
      />
      <ConfirmAlert
          onConfirm={()=>{
            RNFetchBlob.fs.unlink(selectMusicInfo!.meta.filePath).then(async ()=>{
              const newList: LX.Music.MusicInfoLocal[] = cloneDeep(list)
              const deletedIndex = newList.findIndex(item=> item.id === selectMusicInfo!.id)
              if(deletedIndex > -1){
                newList.splice(deletedIndex,1)
                if (playMusicInfo.musicInfo?.id === selectMusicInfo!.id){
                  await overwriteListMusics(LIST_IDS.DOWNLOAD, newList, false)
                }
                setList(newList)
              }
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
      <ConfirmAlert
        ref={renameRef}
        onConfirm={async ()=>{
          const originalPath = `${dirRef.current}/${selectMusicInfo!.name}`
          const latestPath = `${dirRef.current}/${renameInputRef.current}`
          const exist = await RNFetchBlob.fs.exists(`${latestPath}.${selectMusicInfo?.meta.ext}`)
          if(!exist){
            Promise.all([
              RNFetchBlob.fs.mv(`${originalPath}.${selectMusicInfo?.meta.ext}`,`${latestPath}.${selectMusicInfo?.meta.ext}`),
              RNFetchBlob.fs.mv(`${originalPath}.lrc`,`${latestPath}.lrc`)
            ]).then(async ()=>{
              const newList: LX.Music.MusicInfoLocal[] = cloneDeep(list)
              const renameIndex = newList.findIndex(item=> item.id === selectMusicInfo!.id)
              if(renameIndex > -1){
                newList[renameIndex] = generateEmptyLocalMusicInfo(`${renameInputRef.current}.${selectMusicInfo?.meta.ext}`,dirRef.current)
                await overwriteListMusics(LIST_IDS.DOWNLOAD, newList, false)
                setList(newList)
              }
              renameRef.current?.setVisible(false)
            })
          }
          else{
            toast('文件名重复!','short', 'top')
          }
        }}
      >
        <Text>{t('list_rename')}</Text>
        <InputItem
          editable={true}
          value={selectMusicInfo?.name!}
          label={''}
          containerStyle={{paddingLeft:0}}
          onChanged={()=>{}}
          onChangeText={(text)=>{
            renameInputRef.current = text
          }}/>
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
