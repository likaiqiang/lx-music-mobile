import {
  // StyleSheet,
  View,
  // Button,
} from 'react-native'
import {createStyle} from "@/utils/tools";
import List, {ListType} from "./List";
import {useRef} from "react";
import Text from '@/components/common/Text'

export default () => {
  const listRef = useRef<ListType>(null)
  return (
    <View style={styles.container}>
      {/*<List*/}
      {/*  ref={listRef}*/}
      {/*  onShowMenu={()=>{}}*/}
      {/*  onLoadMore={()=>{}}*/}
      {/*  onMuiltSelectMode={()=>{}}*/}
      {/*  onRefresh={()=>{}}*/}
      {/*  onSelectAll={()=>{}}*/}
      {/*  onPlayList={()=>{}}*/}
      {/*  checkHomePagerIdle={false}*/}
      {/*/>*/}
      <Text>xiazai</Text>
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
