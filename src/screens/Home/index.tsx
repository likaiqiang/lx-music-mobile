import { useEffect } from 'react'
import { useHorizontalMode } from '@/utils/hooks'
import PageContent from '@/components/PageContent'
import { setComponentId } from '@/core/common'
import { COMPONENT_IDS } from '@/config/constant'
import Vertical from './Vertical'
import Horizontal from './Horizontal'
import SizeView from './SizeView'
import {importUserApi} from "@/core/userApi";


interface Props {
  componentId: string
}


export default ({ componentId }: Props) => {
  const isHorizontalMode = useHorizontalMode()
  useEffect(() => {
    setComponentId(COMPONENT_IDS.home, componentId)
    // eslint-disable-next-line react-hooks/exhaustive-deps

    fetch("https://lib-bj.oss-cn-beijing.aliyuncs.com/sixyin-music-source-v1.0.7.js",{
      method:'GET'
    }).then(res=>res.text()).then(async script=>{
      return importUserApi(script)
    })
  }, [])

  return (
    <>
      <SizeView />
      <PageContent>
        {
          isHorizontalMode
            ? <Horizontal />
            : <Vertical />
        }
      </PageContent>
    </>
  )
}
