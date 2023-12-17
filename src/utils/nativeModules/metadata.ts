import { NativeModules } from 'react-native'
import type {MusicMetadata} from "react-native-local-media-metadata";

const {MediaMeta} = NativeModules
export async function readMetadata(filePath:string): Promise<MusicMetadata> {
  return MediaMeta.readMetadata(filePath)
}

export async function writeMetaData(filePath:string, metadata: MusicMetadata){
  return MediaMeta.writeMetadata(filePath, metadata, true)
}

export async function readPic(filePath:string, picDir:string):Promise<void>{
  return MediaMeta.readPic(filePath, picDir)
}

export async function readBase64Pic(filePath:string):Promise<string>{
  return MediaMeta.readBase64Pic(filePath)
}

export async function writePic(filePath:string, picPath:string):Promise<void>{
  return MediaMeta.writePic(filePath, picPath)
}

export async function writeQuality(filePath:string, quality:string):Promise<void>{
  return MediaMeta.writeQuality(filePath, quality)
}

export async function readQuality(filePath:string):Promise<string>{
  return MediaMeta.readQuality(filePath)
}

