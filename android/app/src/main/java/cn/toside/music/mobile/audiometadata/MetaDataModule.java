package cn.toside.music.mobile.audiometadata;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;

import org.jaudiotagger.audio.AudioFile;
import org.jaudiotagger.audio.AudioFileIO;
import org.jaudiotagger.audio.AudioHeader;
import org.jaudiotagger.tag.FieldKey;
import org.jaudiotagger.tag.Tag;
import org.jaudiotagger.tag.TagField;
import org.jaudiotagger.tag.images.Artwork;
import org.jaudiotagger.tag.images.ArtworkFactory;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import android.util.Base64;

public class MetaDataModule extends ReactContextBaseJavaModule {
  private final ReactApplicationContext reactContext;

  MetaDataModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.reactContext = reactContext;
  }

  @Override
  public String getName() {
    return "MetaDataModule";
  }
  @ReactMethod
  public void saveMetadata(String filePath, ReadableMap metadata, Promise promise) {
    try {
      File audioFile = new File(filePath);
      AudioFile f = AudioFileIO.read(audioFile);

      // 获取标签对象
      Tag tag = f.getTagOrCreateAndSetDefault();
      // 设置艺术家、标题等信息
      if (metadata.hasKey("singer")) {
        tag.setField(FieldKey.ARTIST, metadata.getString("singer"));
      }
      if (metadata.hasKey("name")) {
        tag.setField(FieldKey.TITLE, metadata.getString("name"));
      }
      if (metadata.hasKey("quality")) {
        tag.setField(FieldKey.QUALITY, metadata.getString("quality"));
      }
      if(metadata.hasKey("picUrl")){
        URL url = new URL(metadata.getString("picUrl"));
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        connection.setDoInput(true);
        connection.connect();
        InputStream input = connection.getInputStream();
        Bitmap bitmap = BitmapFactory.decodeStream(input);
        ByteArrayOutputStream stream = new ByteArrayOutputStream();

        byte[] apicData = new byte[3];
        input.read(apicData, 0, 3);
        String mime_type;
        bitmap.compress(Bitmap.CompressFormat.PNG, 100, stream);

        Artwork artwork = ArtworkFactory.getNew();
        artwork.setBinaryData(stream.toByteArray());
        artwork.setMimeType("image/png");
        tag.addField(artwork);
      }

      // 保存更改
      AudioFileIO.write(f);
      promise.resolve(null);
    } catch (Exception e) {
      promise.reject("Edit Metadata Error", "An error occurred while editing metadata", e);
    }
  }
  @ReactMethod
  public void readMetadata(String filePath, Promise promise) {
    try {
      // 使用 Jaudiotagger 库来读取音频文件
      File audioFile = new File(filePath);
      AudioFile f = AudioFileIO.read(audioFile);

      // 获取标签对象
      Tag tag = f.getTag();

      // 创建一个 WritableMap 对象，用来存储元数据
      WritableMap metadata = Arguments.createMap();

      // 从标签中获取艺术家、名称等信息，并添加到 WritableMap 中
      if (tag.hasField(FieldKey.ARTIST)) {
        metadata.putString("singer", tag.getFirst(FieldKey.ARTIST));
      }
      if (tag.hasField(FieldKey.TITLE)) {
        metadata.putString("name", tag.getFirst(FieldKey.TITLE));
      }
      if(tag.hasField(FieldKey.QUALITY)){
        metadata.putString("quality", tag.getFirst(FieldKey.QUALITY));
      }

      Artwork artwork = tag.getFirstArtwork();
      if(artwork != null){
        byte[] imageData = artwork.getBinaryData();
        String base64ImagePrefix = "data:image/png;base64,";
        String base64ImageString = base64ImagePrefix + Base64.encodeToString(imageData, Base64.DEFAULT);
        metadata.putString("picUrl", base64ImageString);
      }

      // 如果成功，调用 promise 的 resolve 方法，传入 WritableMap 对象，表示成功的结果
      promise.resolve(metadata);
    } catch (Exception e) {
      // 如果失败，调用 promise 的 reject 方法，传入一个值，表示失败的原因
      promise.reject("Read Metadata Error", "An error occurred while reading metadata", e);
    }
  }
}
