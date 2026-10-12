package com.strabospot2;

import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.util.ArrayList;
import java.util.List;

// Orientation comes from the fused TYPE_ROTATION_VECTOR sensor (gyro + accelerometer + magnetometer),
// which is tilt-compensated and far steadier than the old raw accelerometer + magnetometer +
// getRotationMatrix path — that used the accelerometer as a gravity estimate, so any hand motion at the
// moment of capture corrupted the tilt reference (and therefore dip and heading). The rotation vector
// references the same ENU / magnetic-north world frame that getRotationMatrix produced, so the matrix
// convention the JS layer consumes is unchanged. Declination (magnetic -> true north) is still applied
// in JS. The magnetometer is registered separately for its accuracy status only, so a low-accuracy /
// needs-calibration condition can be surfaced to the user the way iOS already does.
public class Compass extends ReactContextBaseJavaModule implements SensorEventListener {
    private static final int AVERAGE_WINDOW = 5; // ~0.1 s at SENSOR_DELAY_GAME (~50 Hz)

    private final ReactApplicationContext context;
    private final SensorManager sensorManager;
    private final Sensor rotationSensor;
    private final Sensor magneticSensor;

    private boolean sensorsRegistered = false;
    private int listenerCount = 0;
    private Boolean lastNeedsCalibration = null; // null until the first accuracy report; only emit on change

    // Rolling buffer of the last few rotation matrices, averaged element-wise before use. Averaging the
    // matrix (rather than the azimuth) is safe across the 0/360 wrap because the elements are continuous
    // through north. Mirrors the native averaging done on iOS, so JS no longer averages for Android.
    private final List<float[]> matrixBuffer = new ArrayList<>();
    private final float[] rotationMatrix = new float[9];
    private final float[] averagedMatrix = new float[9];
    private final float[] orientation = new float[3];

    Compass(ReactApplicationContext context) {
        super(context);
        this.context = context;
        this.sensorManager = (SensorManager) context.getSystemService(Context.SENSOR_SERVICE);

        // Prefer the gyro-fused rotation vector; fall back to the geomagnetic (accel + mag, no gyro)
        // variant on devices without a gyroscope.
        Sensor rotation = sensorManager.getDefaultSensor(Sensor.TYPE_ROTATION_VECTOR);
        if (rotation == null) rotation = sensorManager.getDefaultSensor(Sensor.TYPE_GEOMAGNETIC_ROTATION_VECTOR);
        this.rotationSensor = rotation;
        this.magneticSensor = sensorManager.getDefaultSensor(Sensor.TYPE_MAGNETIC_FIELD);
    }

    @ReactMethod
    public void startSensors() {
        if (sensorsRegistered) {
            Log.d("Compass", "Sensors already registered.");
            return;
        }
        matrixBuffer.clear();
        lastNeedsCalibration = null;

        if (rotationSensor != null) {
            boolean ok = sensorManager.registerListener(this, rotationSensor, SensorManager.SENSOR_DELAY_GAME);
            Log.d("Compass", "Rotation vector registered: " + ok);
        }
        else {
            Log.e("Compass", "No rotation vector sensor available!");
        }

        // Registered for accuracy status only; its values are not fused into the orientation.
        if (magneticSensor != null) {
            sensorManager.registerListener(this, magneticSensor, SensorManager.SENSOR_DELAY_NORMAL);
        }

        sensorsRegistered = true;
    }

    @ReactMethod
    public void stopSensors() {
        if (!sensorsRegistered) {
            Log.d("Compass", "Sensors were not registered or already stopped.");
            return;
        }
        sensorManager.unregisterListener(this);
        sensorsRegistered = false;
        // The buffer is cleared in startSensors() before the listener is (re)registered, so it isn't
        // cleared here — doing so on the module thread could race an in-flight onSensorChanged on the
        // main thread. Leftover samples never bleed across sessions because start clears them first.
        Log.d("Compass", "All sensors unregistered.");
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        if (listenerCount <= 0) return;
        int type = event.sensor.getType();
        if (type != Sensor.TYPE_ROTATION_VECTOR && type != Sensor.TYPE_GEOMAGNETIC_ROTATION_VECTOR) return;

        SensorManager.getRotationMatrixFromVector(rotationMatrix, event.values);

        matrixBuffer.add(rotationMatrix.clone());
        if (matrixBuffer.size() > AVERAGE_WINDOW) matrixBuffer.remove(0);

        for (int i = 0; i < 9; i++) {
            float sum = 0f;
            for (float[] m : matrixBuffer) sum += m[i];
            averagedMatrix[i] = sum / matrixBuffer.size();
        }

        SensorManager.getOrientation(averagedMatrix, orientation);
        float magneticHeading = (float) Math.toDegrees(orientation[0]); // magnetic north; JS adds declination
        magneticHeading = (magneticHeading + 360f) % 360f;

        sendRotationMatrixEvent(magneticHeading);
    }

    private void sendRotationMatrixEvent(float magneticHeading) {
        WritableMap wm = Arguments.createMap();

        // Transposed to match the matrix convention the JS layer expects (unchanged from the previous
        // getRotationMatrix implementation): emitted row i = column i of the Android rotation matrix.
        wm.putDouble("magneticHeading", magneticHeading);
        wm.putDouble("m11", averagedMatrix[0]);
        wm.putDouble("m12", averagedMatrix[3]);
        wm.putDouble("m13", averagedMatrix[6]);
        wm.putDouble("m21", averagedMatrix[1]);
        wm.putDouble("m22", averagedMatrix[4]);
        wm.putDouble("m23", averagedMatrix[7]);
        wm.putDouble("m31", averagedMatrix[2]);
        wm.putDouble("m32", averagedMatrix[5]);
        wm.putDouble("m33", averagedMatrix[8]);

        sendEvent("rotationMatrix", wm);
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {
        if (sensor.getType() != Sensor.TYPE_MAGNETIC_FIELD) return;

        // LOW / UNRELIABLE means the magnetometer needs a figure-8 recalibration or is near magnetic
        // interference; MEDIUM / HIGH are trustworthy. Only emit when the state actually flips so the
        // JS layer isn't spammed on every accuracy report.
        boolean needsCalibration = accuracy == SensorManager.SENSOR_STATUS_UNRELIABLE
                || accuracy == SensorManager.SENSOR_STATUS_ACCURACY_LOW;
        if (lastNeedsCalibration != null && lastNeedsCalibration == needsCalibration) return;
        lastNeedsCalibration = needsCalibration;

        WritableMap wm = Arguments.createMap();
        wm.putBoolean("needsCalibration", needsCalibration);
        sendEvent("compassCalibrationStatus", wm);
    }

    private void sendEvent(String eventName, @Nullable WritableMap params) {
        context
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, params);
    }

    // Required for the RN built-in EventEmitter. Auto start/stop the sensors with listener count.
    @ReactMethod
    public void addListener(String eventName) {
        listenerCount++;
        if (listenerCount == 1) startSensors();
    }

    @ReactMethod
    public void removeListeners(Integer count) {
        listenerCount -= count;
        if (listenerCount < 0) listenerCount = 0;
        if (listenerCount == 0) stopSensors();
    }

    @NonNull
    @Override
    public String getName() {
        return "Compass";
    }
}
