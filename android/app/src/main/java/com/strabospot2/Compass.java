package com.strabospot2;

import static androidx.core.content.ContextCompat.getSystemService;

import android.Manifest;
import android.content.Context;
import android.content.DialogInterface;
import android.hardware.GeomagneticField;
import android.content.pm.PackageManager;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.location.LocationRequest;
import android.os.Bundle;
import android.telecom.Call;
import android.util.Log;
import android.util.*;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AlertDialog;
import androidx.core.app.ActivityCompat;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.lang.reflect.Array;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;

public class Compass extends ReactContextBaseJavaModule implements SensorEventListener {
    private static final String PERMISSION_LOCATION_ACCESS = Manifest.permission.ACCESS_FINE_LOCATION;
    private static final int PERMISSION_REQ_CODE = 100;
    private int listenerCount = 0;
    private final ReactApplicationContext context;
//    private LocationRequest locationRequest;
//    protected Location mCurrentLocation;
    private LocationManager locationManager;
    private LocationListener locationListener;
    private SensorManager sensorManager;
    private Arguments arguments;
    private Callback callback;

    private Sensor sensorAccelerometer;
    private Sensor sensorMagneticField;
    private final float[] lastAccelerometer = new float[3];
    private final float[] lastMagnetometer = new float[3];
    private int[][] rotationMatrixArray = new int[5][];
    private final float[] orientation = new float[3];
    private final float[] rotationMatrix = new float[9];
    boolean isLastAccelerometerCopied = false;
    boolean isLastMagnetometerCopied = false;

    private float[] mGravity = new float[3];
    private float[] mGeomagnetic = new float[3];
//    private float azimuth = 0f;
    float I[] = new float[9];


    Compass(ReactApplicationContext context) {
        super(context);
        this.context = context;

        this.sensorManager = (SensorManager)context.getSystemService(context.SENSOR_SERVICE);
        this.sensorAccelerometer = this.sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
        this.sensorMagneticField = this.sensorManager.getDefaultSensor(Sensor.TYPE_MAGNETIC_FIELD);

//        if (mCurrentLocation == null) {
//            LocationManager locationManager =(LocationManager)context.getSystemService(Context.LOCATION_SERVICE);
//            if (ActivityCompat.checkSelfPermission(this.context, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED && ActivityCompat.checkSelfPermission(this.context, Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
////                requestRuntimePermissions();
//                return;
//            }
//            mCurrentLocation = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER);
//            if (mCurrentLocation == null) mCurrentLocation = locationManager.getLastKnownLocation((LocationManager.NETWORK_PROVIDER));
//        }
//
//        if (mCurrentLocation != null) mDeclination = getDeclination(mCurrentLocation, System.currentTimeMillis());
    }

//    private void requestRuntimePermissions() {
//        if (ActivityCompat.checkSelfPermission(this.context, PERMISSION_LOCATION_ACCESS) == PackageManager.PERMISSION_GRANTED) {
//            Toast.makeText(this.context, "Permission Granted", Toast.LENGTH_LONG).show();
////            userLocation();
//        } else if (ActivityCompat.shouldShowRequestPermissionRationale(this.context, PERMISSION_LOCATION_ACCESS)) {
//            AlertDialog.Builder builder = new AlertDialog.Builder(this.context);
//            builder.setMessage("This app requires LOCATION to get the users declination")
//                    .setTitle("Permission Required")
//                    .setCancelable(false)
//                    .setPositiveButton("Ok", new DialogInterface.OnClickListener() {
//                        @Override
//                        public void onClick(DialogInterface dialog, int which) {
//                            ActivityCompat.requestPermissions(MainActivity., new String[]{PERMISSION_LOCATION_ACCESS}, PERMISSION_REQ_CODE);
//                            dialog.dismiss();
//                        }
//                    })
//                    .setNegativeButton("Cancel", (dialog, which) -> dialog.dismiss());
//
//            builder.show();
//
//        } else {
//            ActivityCompat.requestPermissions(this, new String[]{PERMISSION_LOCATION_ACCESS}, PERMISSION_REQ_CODE);
//        }
//    }

    private void sendEvent(ReactContext reactContext, String eventName, @Nullable WritableMap params) {

        reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, params);
    }

    @ReactMethod
    public void startSensors() {
        this.sensorManager.registerListener(this, sensorAccelerometer, SensorManager.SENSOR_DELAY_UI);
        this.sensorManager.registerListener(this, sensorMagneticField, SensorManager.SENSOR_DELAY_UI);
        Log.d("MatrixDataModule", "Sensors started!" );
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        final float alpha = 0.97f;

        synchronized (this) {
            if (event.sensor.getType() == Sensor.TYPE_ACCELEROMETER) {
                mGravity[0] = alpha * mGravity[0] + (1 - alpha) * event.values[0];
                mGravity[1] = alpha * mGravity[1] + (1 - alpha) * event.values[1];
                mGravity[2] = alpha * mGravity[2] + (1 - alpha) * event.values[2];
            }

            if (event.sensor.getType() == Sensor.TYPE_MAGNETIC_FIELD) {
                mGeomagnetic[0] = alpha * mGeomagnetic[0] + (1 - alpha) * event.values[0];
                mGeomagnetic[1] = alpha * mGeomagnetic[1] + (1 - alpha) * event.values[1];
                mGeomagnetic[2] = alpha * mGeomagnetic[2] + (1 - alpha) * event.values[2];
            }

            boolean success = SensorManager.getRotationMatrix(rotationMatrix, I, mGravity, mGeomagnetic);

            if (success) {
                SensorManager.getOrientation(rotationMatrix, orientation);

                float azimuth = (float) Math.toDegrees(orientation[0]);
                azimuth = (azimuth + 360) % 360;
                azimuth = Math.round(azimuth);

                float declination = 0f;
                float trueHeading = azimuth;

                LocationManager lm = (LocationManager) context.getSystemService(Context.LOCATION_SERVICE);
                Location location = null;

                    if (ActivityCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
                                location = lm.getLastKnownLocation(LocationManager.GPS_PROVIDER);
                                if (location == null) {
                                    location = lm.getLastKnownLocation(LocationManager.NETWORK_PROVIDER);
                                }

                                if (location != null) {
                                    GeomagneticField geoField = new GeomagneticField(
                                            (float) location.getLatitude(),
                                            (float) location.getLongitude(),
                                            (float) location.getAltitude(),
                                            System.currentTimeMillis()
                                    );
                                    declination = geoField.getDeclination();
                                    trueHeading = (azimuth + declination + 360) % 360;
                                }
                            }

                sendAzimuthChangeEvent(trueHeading, azimuth, declination);
//                 sendAzimuthChangeEvent();
            }


//        if(this.listenerCount <= 0) {
//            return; // avoid all the computation if there are no observers
//        }
        }
    }

    private void sendAzimuthChangeEvent() {
        WritableMap wm = Arguments.createMap();

        // Transposed Matrix
        wm.putDouble("trueHeading", trueHeading);
        wm.putDouble("magneticHeading", magneticHeading);
        wm.putDouble("declination", declination);
        wm.putDouble("m11", rotationMatrix[0]);
        wm.putDouble("m12", rotationMatrix[3]);
        wm.putDouble("m13", rotationMatrix[6]);
        wm.putDouble("m21", rotationMatrix[1]);
        wm.putDouble("m22", rotationMatrix[4]);
        wm.putDouble("m23", rotationMatrix[7]);
        wm.putDouble("m31", rotationMatrix[2]);
        wm.putDouble("m32", rotationMatrix[5]);
        wm.putDouble("m33", rotationMatrix[8]);

//         wm.putDouble("newAzimuth", azimuth);
//         wm.putDouble("M11", rotationMatrix[0]);
//         wm.putDouble("M12", rotationMatrix[1]);
//         wm.putDouble("M13", rotationMatrix[2]);
//         wm.putDouble("M21", rotationMatrix[3]);
//         wm.putDouble("M22", rotationMatrix[4]);
//         wm.putDouble("M23", rotationMatrix[5]);
//         wm.putDouble("M31", rotationMatrix[6]);
//         wm.putDouble("M32", rotationMatrix[7]);
//         wm.putDouble("M33", rotationMatrix[8]);


        sendEvent(this.context, "rotationMatrix", wm);
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {

    }

//    @ReactMethod
//    public void addListener(String eventName) {
//        this.listenerCount += 1;
//    }

    // Required for rn built in EventEmitter Calls.
    @ReactMethod
    public void addListener(String eventName) {
        Log.d("Matrix Array", "Listener has been ADDED: " + eventName);
    }

    @ReactMethod
    public void removeListeners(Integer count) {
        Log.d("Matrix Array", "Listener has been REMOVED: " + count);
    }

    @ReactMethod
    public void stopSensors() {
        sensorManager.unregisterListener(this, sensorAccelerometer);
        sensorManager.unregisterListener(this, sensorMagneticField);
        Log.d("Compass", "All Sensors Stopped!!");
    }

    @NonNull
    @Override
    public String getName() {
        return "Compass";
    }
}

