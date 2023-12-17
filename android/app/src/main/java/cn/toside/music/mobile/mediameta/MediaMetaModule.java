package cn.toside.music.mobile.mediameta;

import android.content.Context;
import android.util.Base64;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.Promise;

import org.jaudiotagger.audio.AudioFile;
import org.jaudiotagger.audio.AudioFileIO;
import org.jaudiotagger.tag.FieldKey;
import org.jaudiotagger.tag.Tag;
import org.jaudiotagger.tag.id3.valuepair.ImageFormats;
import org.jaudiotagger.tag.images.Artwork;

import java.io.File;
import java.io.FileOutputStream;
import java.util.concurrent.Callable;

import com.localmediametadata.*;
import com.localmediametadata.media3.MetadataMedia3;

class CustomMetadata extends Metadata{
  static public void writeQuality(String filePath, String quality) throws Exception {
    File audioFile = new File(filePath);
    AudioFile f = AudioFileIO.read(audioFile);
    Tag tag = f.getTag();

    tag.setField(FieldKey.QUALITY, quality);
  }
  static public String readQuality(String filePath) throws Exception {
    File audioFile = new File(filePath);
    AudioFile f = AudioFileIO.read(audioFile);

    Tag tag = f.getTag();

    return tag.getFirst(FieldKey.QUALITY);
  }
  public static String readBase64Pic(String filePath) throws Exception {
    File file = new File(filePath);
    AudioFile audioFile = AudioFileIO.read(file);
    Tag tag = audioFile.getTag();
    Artwork artwork = tag.getFirstArtwork();
    if (artwork == null) return "";

    byte[] imageData = artwork.getBinaryData();
    String base64ImagePrefix = "data:image/png;base64,";
    return  base64ImagePrefix + Base64.encodeToString(imageData, Base64.DEFAULT);
  }
}

class CustomMetadataCallable extends MetadataCallable{
  public static class ReadQuality implements Callable<Object> {
    private final ReactApplicationContext context;
    private final String filePath;

    public ReadQuality(ReactApplicationContext context, String filePath) {
      this.context = context;
      this.filePath = filePath;
    }
    @Override
    public String call() {
      try {
        return CustomMetadata.readQuality(this.filePath);
      } catch (Exception err) {
        Log.e("ReadMetadata", "Read Pic Error:");
        err.printStackTrace();
        return "";
      }
    }
  }
  public static class WriteQuality implements Callable<Object> {
    private final ReactApplicationContext context;
    private final String filePath;
    private final String quality;
    public WriteQuality(ReactApplicationContext context, String filePath, String quality) {
      this.context = context;
      this.filePath = filePath;
      this.quality = quality;
    }
    @Override
    public Object call() throws Exception {
      CustomMetadata.writeQuality(this.filePath, this.quality);
      return null;
    }
  }
  public static class ReadBase64Pic implements Callable<Object>{
    private final ReactApplicationContext context;
    private final String filePath;
    public ReadBase64Pic(ReactApplicationContext context, String filePath) {
      this.context = context;
      this.filePath = filePath;
    }
    @Override
    public Object call() throws Exception {
      return CustomMetadata.readBase64Pic(this.filePath);
    }
  }
}


public class MediaMetaModule extends ReactContextBaseJavaModule {
  private Context context;
  MediaMetaModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.context = reactContext;
  }
  @Override
  public String getName() {
    return "MediaMeta";
  }

  @ReactMethod
  public void readMetadata(String filePath, Promise promise) {
    AsyncTask.runTask(new CustomMetadataCallable.ReadMetadata((ReactApplicationContext) context, filePath), promise);
  }
  @ReactMethod
  public void writeMetadata(String filePath, ReadableMap metadata, boolean isOverwrite, Promise promise) {
    AsyncTask.runTask(new CustomMetadataCallable.WriteMetadata((ReactApplicationContext) context, filePath, Arguments.toBundle(metadata), isOverwrite), promise);
  }
  private static boolean isSupportMedia3Pic(String filePath) {
    if (!filePath.startsWith("content://")) return false;
    String ext = Utils.getFileExtension(filePath).toLowerCase();
    switch (ext) {
      case "mp3":
      case "flac": return true;
      default: return false;
    }
  }
  @ReactMethod
  public void readPic(String filePath, String picDir, Promise promise) {
    if (isSupportMedia3Pic(filePath)) {
      MetadataMedia3.readPic((ReactApplicationContext) context, filePath, picDir, promise);
    } else {
      AsyncTask.runTask(new CustomMetadataCallable.ReadPic((ReactApplicationContext) context, filePath, picDir), promise);
    }
  }
  @ReactMethod
  public void readBase64Pic(String filePath, Promise promise){
    AsyncTask.runTask(new CustomMetadataCallable.ReadBase64Pic((ReactApplicationContext) context, filePath), promise);
  }
  @ReactMethod
  public void writePic(String filePath, String picPath, Promise promise) {
    AsyncTask.runTask(new CustomMetadataCallable.WritePic((ReactApplicationContext) context, filePath, picPath), promise);
  }
  @ReactMethod
  public void writeQuality(String filePath, String quality ,Promise promise) {
    AsyncTask.runTask(new CustomMetadataCallable.WriteQuality((ReactApplicationContext) context, filePath, quality), promise);
  }
  @ReactMethod
  public void readQuality(String filePath ,Promise promise){
    AsyncTask.runTask(new CustomMetadataCallable.ReadQuality((ReactApplicationContext) context, filePath), promise);
  }
}
