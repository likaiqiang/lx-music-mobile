import { NativeModules } from 'react-native'

const {MediaMeta} = NativeModules


export async function readMetadata(filePath:string): Promise<LX.Music.MetaData> {
  try{
    return await MediaMeta.get(filePath)
  } catch {
    console.log('getMetaData catch');
    return {
      singer:'',
      picUrl:'',
      name:''
    }
  }
}

export const writeMetaData = async (filePath:string, metadata: LX.Music.MetaData)=>{
  try{
    await MediaMeta.set(
      filePath,
      {
        singer: metadata.singer,
        name: metadata.name,
        picUrl: metadata.picUrl,
        quality: metadata.quality
      }
    )
  } catch {
      console.log('writeMetaData catch');
  }
}
