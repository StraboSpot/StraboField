package com.strabospot2;

import android.Manifest;
import android.content.Context;
import android.hardware.GeomagneticField;
import android.content.pm.PackageManager;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.app.ActivityCompat;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.util.Arrays;

public class Compass extends ReactContextBaseJavaModule implements SensorEventListener {
    private boolean sensorsRegistered = false;
    private static final String PERMISSION_LOCATION_ACCESS = Manifest.permission.ACCESS_FINE_LOCATION;
    private static final int PERMISSION_REQ_CODE = 100;
    private int listenerCount = 0;
    private final ReactApplicationContext context;
    private LocationManager locationManager;
    private LocationListener locationListener;
    private SensorManager sensorManager;
    private Arguments arguments;
    private Callback callback;

    private Sensor sensorAccelerometer;
    private Sensor sensorMagneticField;
    private final float[] orientation = new float[3];
    private final float[] rotationMatrix = new float[9];

    private float[] mGravity = new float[3];
    private float[] mGeomagnetic = new float[3];
    float I[] = new float[9];


    Compass(ReactApplicationContext context) {
        super(context);
        this.context = context;

        this.sensorManager = (SensorManager) context.getSystemService(context.SENSOR_SERVICE);
        this.sensorAccelerometer = this.sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
        this.sensorMagneticField = this.sensorManager.getDefaultSensor(Sensor.TYPE_MAGNETIC_FIELD);
    }

    private void sendEvent(ReactContext reactContext, String eventName, @Nullable WritableMap params) {

        reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, params);
    }

    @ReactMethod
    public void startSensors() {
        if (!sensorsRegistered) {
            if (sensorAccelerometer != null) {
                boolean accelOk = sensorManager.registerListener(this, sensorAccelerometer, SensorManager.SENSOR_DELAY_GAME);
                Log.d("Compass", "Accelerometer registered: " + accelOk);
            } else {
                Log.e("Compass", "Accelerometer not available!");
            }

            if (sensorMagneticField != null) {
                boolean magOk = sensorManager.registerListener(this, sensorMagneticField, SensorManager.SENSOR_DELAY_GAME);
                Log.d("Compass", "MagneticField registered: " + magOk);
            } else {
                Log.e("Compass", "Magnetic field sensor not available!");
            }

            sensorsRegistered = true;
        } else {
            Log.d("Compass", "Sensors already registered.");
        }
    }

    @ReactMethod
    public void stopSensors() {
        if (!sensorsRegistered) {
            Log.d("Compass", "Sensors were not registered or already stopped.");
            return;
        }
            sensorManager.unregisterListener(this);
            sensorsRegistered = false;
            Log.d("Compass", "All sensors unregistered.");
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        if (listenerCount <= 0) return;
        // Low-pass smoothing of the raw gravity/magnetometer vectors: value = alpha*old + (1-alpha)*new.
        // At SENSOR_DELAY_GAME (~50 Hz, dt ~= 0.02 s) the smoothing time constant is dt*alpha/(1-alpha).
        // The old 0.97 gave ~0.65 s of lag (a needle that visibly trails); 0.85 gives ~0.11 s -- responsive
        // but still enough to filter magnetometer noise. Raise toward 0.9 if the heading looks jittery.
        final float alpha = 0.85f;

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

                float azimuth = (float) Math.toDegrees(orientation[0]); // Gets magnetic north
                azimuth = (azimuth + 360f) % 360f;

                sendAzimuthChangeEvent(azimuth);
            }
        }

    private void sendAzimuthChangeEvent(float magneticHeading) {

        WritableMap wm = Arguments.createMap();

        // Transposed Matrix
        wm.putDouble("magneticHeading", magneticHeading);
        wm.putDouble("m11", rotationMatrix[0]);
        wm.putDouble("m12", rotationMatrix[3]);
        wm.putDouble("m13", rotationMatrix[6]);
        wm.putDouble("m21", rotationMatrix[1]);
        wm.putDouble("m22", rotationMatrix[4]);
        wm.putDouble("m23", rotationMatrix[7]);
        wm.putDouble("m31", rotationMatrix[2]);
        wm.putDouble("m32", rotationMatrix[5]);
        wm.putDouble("m33", rotationMatrix[8]);

        System.out.println(wm);
        sendEvent(this.context, "rotationMatrix", wm);
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {

    }

    // Required for rn built in EventEmitter Calls.
    @ReactMethod
    public void addListener(String eventName) {
        listenerCount++;
        Log.e("Sensor", "Listener added. Total: " + listenerCount);

        if (listenerCount == 1) {
            startSensors(); // Start only on first listener
        }
    }

    @ReactMethod
    public void removeListeners(Integer count) {
        listenerCount -= count;
        if (listenerCount < 0) listenerCount = 0;
        Log.e("Sensor", "Listeners removed. Remaining: " + listenerCount);

        if (listenerCount == 0) {
            stopSensors(); // Stop only when no listeners remain
        }
    }

    @NonNull
    @Override
    public String getName() {
        return "Compass";
    }
}

