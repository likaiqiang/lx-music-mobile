package cn.toside.music.mobile;

import com.facebook.react.ReactInstanceManager;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.reactnativenavigation.NavigationActivity;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.os.Bundle;
import android.provider.MediaStore;
import android.util.Log;

import androidx.loader.content.CursorLoader;

import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactActivityDelegate;


class MusicPlayer{
  public void sendUrl(Intent intent){
    if (intent!= null && intent.getAction().equals(Intent.ACTION_VIEW)) {
      // 获取intent的data，这是一个Uri对象
      Uri data = intent.getData();

      String realPath = getRealPathFromURI(data);

      // 创建一个事件
      WritableMap event = Arguments.createMap();
      event.putString("path", realPath);

      Log.d("Tag", event.toString());

      // 发送事件到RN
      MainActivity.reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
        .emit("onPathReceived", event);
    }
  }
//  private String getRealPathFromURI(Uri contentUri) {
//    String[] proj = { MediaStore.Audio.Media.DATA };
//    Cursor cursor = managedQuery(contentUri, proj, null, null, null);
//    int column_index = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DATA);
//    cursor.moveToFirst();
//    return cursor.getString(column_index);
//  }
  private String getRealPathFromURI(Uri contentUri) {
    String[] proj = { MediaStore.Audio.Media.DATA };
    CursorLoader loader = new CursorLoader(MainActivity.reactContext, contentUri, proj, null, null, null);
    Cursor cursor = loader.loadInBackground();
    int column_index = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DATA);
    cursor.moveToFirst();
    return cursor.getString(column_index);
  }
}

public class MainActivity extends NavigationActivity {
    private MusicPlayer musicPlayer = null;
    public static ReactContext reactContext = null;
    @Override
    protected void onCreate(Bundle savedInstanceState) {
      super.onCreate(savedInstanceState);

      Intent intent = getIntent();
      musicPlayer = new MusicPlayer();

      final ReactInstanceManager reactInstanceManager = ((MainApplication) getApplication()).getReactNativeHost().getReactInstanceManager();
      // 添加监听器
      reactInstanceManager.addReactInstanceEventListener(new ReactInstanceManager.ReactInstanceEventListener() {
        @Override
        public void onReactContextInitialized(ReactContext context) {
          reactContext = context;
          musicPlayer.sendUrl(intent);
        }
      });

      if (reactInstanceManager.hasStartedCreatingInitialContext()) {
        reactContext = reactInstanceManager.getCurrentReactContext();
        // ReactContext已经创建完成，可以直接获取
        musicPlayer.sendUrl(intent);
      }
    }
    @Override
    public void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        musicPlayer.sendUrl(intent);
    }
}
