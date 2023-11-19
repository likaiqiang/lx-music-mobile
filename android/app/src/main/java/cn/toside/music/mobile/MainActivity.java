package cn.toside.music.mobile;

import com.facebook.react.ReactInstanceManager;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.reactnativenavigation.NavigationActivity;

import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.database.Cursor;
import android.net.Uri;
import android.os.Bundle;
import android.provider.MediaStore;
import android.util.Log;

import androidx.loader.content.CursorLoader;

import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactActivityDelegate;
import com.rnfs.UploadResult;


class MusicPlayer{
  private ReactContext reactContext = null;
  private MainActivity MainActivityContext = null;
  MusicPlayer(MainActivity context){
    MainActivityContext = context;
    Intent intent = context.getIntent();
    final ReactInstanceManager reactInstanceManager = ((MainApplication) context.getApplication()).getReactNativeHost().getReactInstanceManager();
    reactInstanceManager.addReactInstanceEventListener(new ReactInstanceManager.ReactInstanceEventListener() {
      @Override
      public void onReactContextInitialized(ReactContext context) {
        reactContext = context;
        sendUrl(intent);
      }
    });

    if (reactInstanceManager.hasStartedCreatingInitialContext()) {
      reactContext = reactInstanceManager.getCurrentReactContext();
      // ReactContext已经创建完成，可以直接获取
      sendUrl(intent);
    }
  }
  public void sendUrl(Intent intent){
    if (intent!= null && intent.getAction().equals(Intent.ACTION_VIEW) && filterIntent(intent)) {
      // 获取intent的data，这是一个Uri对象
      Uri data = intent.getData();

      String realPath = getRealPathFromURI(data);
      if(realPath != null){
        WritableMap event = Arguments.createMap();
        event.putString("path", realPath);

        Log.d("Tag", event.toString());

        // 发送事件到RN
        reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
          .emit("onPathReceived", event);
      }
    }
  }
  private boolean filterIntent(Intent intent) {
    IntentFilter filter = new IntentFilter();
    filter.addAction(Intent.ACTION_VIEW);
    filter.addCategory(Intent.CATEGORY_DEFAULT);
    filter.addCategory(Intent.CATEGORY_APP_MUSIC);
    filter.addDataScheme("content");
    filter.addDataScheme("file");
    try{
      filter.addDataType("audio/*");
      filter.addDataType("application/ogg");
      filter.addDataType("application/x-ogg");
      filter.addDataType("application/itunes");
    } catch (IntentFilter.MalformedMimeTypeException e){
      e.printStackTrace();
    }
    int result = filter.match(MainActivityContext.getContentResolver(), intent, false, "TAG");
    return result >= 0;
  }
  private String getRealPathFromURI(Uri contentUri) {
    String[] proj = {MediaStore.Audio.Media.DATA};
    try {
      CursorLoader loader = new CursorLoader(reactContext, contentUri, proj, null, null, null);
      Cursor cursor = loader.loadInBackground();

      if (cursor != null && cursor.moveToFirst()) {
        int column_index = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DATA);
        return cursor.getString(column_index);
      } else {
        // Handle the case where the cursor is null or empty
        return null;
      }
    } catch (Exception e) {
      // Handle more specific exceptions if needed
      e.printStackTrace();
      return null;
    }
  }
  public void release() {
    reactContext = null;
    MainActivityContext = null;
  }
}

public class MainActivity extends NavigationActivity {
  private MusicPlayer musicPlayer = null;
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    musicPlayer = new MusicPlayer(this);
  }
  @Override
  public void onNewIntent(Intent intent) {
    super.onNewIntent(intent);
    musicPlayer.sendUrl(intent);
  }
  @Override
  protected void onDestroy(){
    super.onDestroy();
    musicPlayer.release();
  }
}
