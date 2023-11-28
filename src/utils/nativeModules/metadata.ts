import { NativeModules } from 'react-native'

const {MetaDataModule} = NativeModules

interface Metadata{
  singer:string,
  name: string,
  picUrl?: string,
  quality?: LX.Quality
}

export const writeMetaData = async (filePath:string, metadata: Metadata)=>{
  try{
    await MetaDataModule.saveMetadata(
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
export const getMetaData = async (filePath:string)=>{
  try{
    return await MetaDataModule.readMetadata(filePath)
  } catch {
      console.log('getMetaData catch');
      return {
          singer:'',
          quality:'',
          picUrl:''
      }
  }
}
