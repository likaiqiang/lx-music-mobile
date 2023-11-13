import {useRef, useImperativeHandle, forwardRef, useState, useCallback, useEffect} from 'react'
import Text from '@/components/common/Text'
import {View, TouchableOpacity, LayoutChangeEvent} from 'react-native'
import {createStyle, openUrl, tipDialog, toast} from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import Dialog, { type DialogType } from '@/components/common/Dialog'
import Button from '@/components/common/Button'
import List from './List'
import ScriptImportExport, { type ScriptImportExportType } from './ScriptImportExport'
import {state, useUserApiList} from '@/store/userApi'
import Input, {InputType} from "@/components/common/Input";

interface UrlInputType {
  setText: (text: string) => void
  getText: () => string
  focus: () => void
}
const UrlInput = forwardRef<UrlInputType, {}>((props, ref) => {
  const theme = useTheme()
  const t = useI18n()
  const [text, setText] = useState('')
  const inputRef = useRef<InputType>(null)
  const [height, setHeight] = useState(100)

  useImperativeHandle(ref, () => ({
    getText() {
      return text.trim()
    },
    setText(text) {
      setText(text)
    },
    focus() {
      inputRef.current?.focus()
    }
  }))

  return (
    <View style={{height}}>
      <Input
        ref={inputRef}
        value={text}
        onChangeText={setText}
        textAlignVertical="center"
        placeholder={'请输入source url'}
        size={12}
        style={{backgroundColor: theme['c-primary-input-background'] }}
        onLayout={e=>{
          setHeight(e.nativeEvent.layout.height)
        }}
        multiline
        returnKeyType={'done'}
        blurOnSubmit={true}
        // onSubmitEditing={ async ()=>{
        //   if(text.trim().length && /^https?:\/\//.test(text.trim())){
        //     toast('正在加载请稍后...')
        //     const script = await downloadAndReadFile(text)
        //     await importUserApi(script)
        //   }
        // }}
      />
    </View>
  )
})


// export interface UserApiEditModalProps {
//   onSave: (rules: string) => void
//   // onSourceChange: SourceSelectorProps['onSourceChange']
// }
export interface UserApiEditModalType {
  show: () => void
}

export default forwardRef<UserApiEditModalType, {}>((props, ref) => {
  const dialogRef = useRef<DialogType>(null)
  const scriptImportExportRef = useRef<ScriptImportExportType>(null)
  // const sourceSelectorRef = useRef<SourceSelectorType>(null)
  const inputRef = useRef<UrlInputType>(null)
  const [visible, setVisible] = useState(false)
  const theme = useTheme()
  const t = useI18n()
  const userApiList = useUserApiList()

  const handleShow = () => {
    dialogRef.current?.setVisible(true)
    // requestAnimationFrame(() => {
    // inputRef.current?.setText('')
    // sourceSelectorRef.current?.setSource(source)
    // setTimeout(() => {
    //   inputRef.current?.focus()
    // }, 300)
    // })
  }
  useImperativeHandle(ref, () => ({
    show() {
      if (visible) handleShow()
      else {
        setVisible(true)
        requestAnimationFrame(() => {
          handleShow()
        })
      }
    }
  }))

  const handleCancel = () => {
    dialogRef.current?.setVisible(false)
  }
  const handleImport = () => {
    if (state.list.length > 20) {
      void tipDialog({
        message: t('user_api_max_tip'),
        btnText: t('ok'),
      })
      return
    }
    scriptImportExportRef.current?.import()
  }
  const openFAQPage = () => {
    void openUrl('https://lyswhut.github.io/lx-music-doc/mobile/custom-source')
  }

  return (
    visible
      ? (
          <Dialog ref={dialogRef} bgHide={false}>
            <View style={styles.content}>
              {
                // userApiList.length ? null : <UrlInput ref={inputRef} />
              }
              <Text size={16} style={styles.title}>{t('user_api_title')}</Text>
              <List />
              <View style={styles.tips}>
                <Text style={styles.tipsText} size={12}>
                  {t('user_api_readme')}
                </Text>
                <TouchableOpacity onPress={openFAQPage}>
                  <Text style={{ ...styles.tipsText, textDecorationLine: 'underline' }} size={12} color={theme['c-primary-font']}>FAQ</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.tipsText} size={12}>{t('user_api_note')}</Text>
            </View>
            <View style={styles.btns}>
              <Button style={{ ...styles.btn, backgroundColor: theme['c-button-background'] }} onPress={handleCancel}>
                <Text size={14} color={theme['c-button-font']}>{t('close')}</Text>
              </Button>
              <Button style={{ ...styles.btn, backgroundColor: theme['c-button-background'] }} onPress={handleImport}>
                <Text size={14} color={theme['c-button-font']}>{t('user_api_btn_import')}</Text>
              </Button>
              <ScriptImportExport ref={scriptImportExportRef} />
            </View>
          </Dialog>
        ) : null
  )
})


const styles = createStyle({
  content: {
    // flexGrow: 1,
    flexShrink: 1,
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 10,
    flexDirection: 'column',
  },
  title: {
    marginBottom: 15,
    textAlign: 'center',
    // backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  tips: {
    marginTop: 15,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tipsText: {
    marginTop: 8,
    textAlignVertical: 'bottom',
    // lineHeight: 18,
    // backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  btns: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: 15,
    paddingLeft: 15,
    // paddingRight: 15,
  },
  btn: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    borderRadius: 4,
    marginRight: 15,
  },
})


