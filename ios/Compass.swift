import CoreLocation
import CoreMotion
import Foundation
import React
import UIKit

@objc(Compass) class Compass: RCTEventEmitter {
    let motionTrue = CMMotionManager()
    let motionMagnetic = CMMotionManager()

    var trueMatrixArray = [CMRotationMatrix]()
    var magneticMatrixArray = [CMRotationMatrix]()
    var hasListeners = false
    // Devices without GPS (e.g. Wi-Fi-only iPads) can't resolve true north, so `.xTrueNorthZVertical`
    // errors. We track that and fall back to the magnetic-referenced frame, letting the JS layer apply the
    // project's magnetic declination (manually entered) to convert to true — the same path Android uses.
    var trueNorthAvailable = false
    var trueNorthDetermined = false
    var currentScreenRotation = 0 // 0/90/180/270 — how the device is currently held (see screenRotation)

    override static func requiresMainQueueSetup() -> Bool {
        true
    }

    override func supportedEvents() -> [String]! {
        return ["rotationMatrix", "compassCalibrationStatus"]
    }

    override func startObserving() {
        hasListeners = true
    }

    override func stopObserving() {
        hasListeners = false
    }

    @objc func startCompass() {
        // 20 Hz sampling. Paired with the 5-sample rolling average below this gives a
        // ~0.25 s smoothing window (vs ~1 s at the old 0.2 s interval) — a responsive
        // needle that's still steady enough not to jitter.
        motionTrue.deviceMotionUpdateInterval = 0.05
        motionMagnetic.deviceMotionUpdateInterval = 0.05

        trueNorthAvailable = false
        trueNorthDetermined = false

        motionTrue.startDeviceMotionUpdates(using: .xTrueNorthZVertical, to: .main) {
            data, error in
            if error != nil {
                // No true north right now — no GPS fix (or none at all, e.g. a Wi-Fi-only iPad), or compass
                // calibration is off. Mark it unavailable so the magnetic handler below drives emission in
                // the fallback; JS converts magnetic to true using the project's declination. We keep this
                // frame running (don't stop it) so it recovers to true north on its own if a GPS fix arrives
                // mid-session. The error callbacks are cheap no-ops.
                self.trueNorthAvailable = false
                self.trueNorthDetermined = true
                return
            }
            guard let data = data else {
                return
            }
            self.trueNorthAvailable = true
            self.trueNorthDetermined = true
            // Track the current hold from gravity so trend/plunge follows the edge that's up as the
            // tablet is held (portrait or either landscape), rather than a fixed portrait edge.
            self.currentScreenRotation = Compass.screenRotation(fromGravity: data.gravity)
            self.trueMatrixArray.append(data.attitude.rotationMatrix)
            if self.trueMatrixArray.count > 5 {
                self.trueMatrixArray.removeFirst()
            }
            self.emitHeadingIfReady()
        }

        motionMagnetic.startDeviceMotionUpdates(using: .xMagneticNorthZVertical, to: .main) {
            data, _ in
            guard let data = data else {
                return
            }
            // Also tracked here so the hold is known in the no-true-north fallback, where the true frame
            // above never delivers data.
            self.currentScreenRotation = Compass.screenRotation(fromGravity: data.gravity)
            self.magneticMatrixArray.append(data.attitude.rotationMatrix)
            if self.magneticMatrixArray.count > 5 {
                self.magneticMatrixArray.removeFirst()
            }
            self.emitHeadingIfReady()
        }
    }

    @objc func stopCompass() {
        motionTrue.stopDeviceMotionUpdates()
        motionMagnetic.stopDeviceMotionUpdates()
        trueMatrixArray.removeAll()
        magneticMatrixArray.removeAll()
        trueNorthAvailable = false
        trueNorthDetermined = false
        sendEvent(withName: "compassCalibrationStatus", body: ["needsCalibration": false])
    }

    // Screen-up in the device plane is opposite gravity's in-plane projection; snap it to the nearest of
    // the four interface orientations. Codes match the JS layer's pointingAxisRow:
    //   0 = portrait (+Y up), 90 = -X up, 180 = -Y up (upside down), 270 = +X up.
    // Derived from gravity (not UIInterfaceOrientation) so it's correct even when the UI is orientation
    // locked, and it doesn't depend on the confusable landscapeLeft/landscapeRight enum handedness.
    private static func screenRotation(fromGravity g: CMAcceleration) -> Int {
        if abs(g.y) >= abs(g.x) {
            return g.y <= 0 ? 0 : 180
        }
        return g.x < 0 ? 270 : 90
    }

    private func emitHeadingIfReady() {
        // Wait until we know whether true north is available (first true-frame success or error), then emit
        // as soon as the first samples land (window then grows to 5) so the needle appears quickly instead
        // of after a ~0.25 s dead start; the JS side animates the smoothing. With true north we send that
        // frame as-is (reference "true"); without it we send the magnetic frame (reference "magnetic") so
        // JS applies the declination. Magnetic samples are required in both cases — true north is derived
        // from the same magnetometer, and the fallback needs them.
        guard hasListeners,
        trueNorthDetermined,
        magneticMatrixArray.count >= 1 else {
            return
        }

        let avgMag = averageMatrix(magneticMatrixArray)
        let magneticHeading = headingFromMatrix(avgMag)

        if trueNorthAvailable, trueMatrixArray.count >= 1 {
            let avgTrue = averageMatrix(trueMatrixArray)
            let trueHeading = headingFromMatrix(avgTrue)
            sendEvent(
                withName: "rotationMatrix",
                body: [
                    "reference": "true",
                    "trueHeading": trueHeading.rounded(toPlaces: 1),
                    "magneticHeading": magneticHeading.rounded(toPlaces: 1),
                    "screenRotation": currentScreenRotation,
                    "matrix": matrixBody(avgTrue),
                ])
        }
        else {
            // No true north (e.g. no GPS): emit the magnetic frame. trueHeading is left for JS, which
            // computes it as magneticHeading + declination.
            sendEvent(
                withName: "rotationMatrix",
                body: [
                    "reference": "magnetic",
                    "trueHeading": -1,
                    "magneticHeading": magneticHeading.rounded(toPlaces: 1),
                    "screenRotation": currentScreenRotation,
                    "matrix": matrixBody(avgMag),
                ])
        }
    }

    private func matrixBody(_ m: CMRotationMatrix) -> [String: Double] {
        return [
            "m11": m.m11, "m12": m.m12, "m13": m.m13,
            "m21": m.m21, "m22": m.m22, "m23": m.m23,
            "m31": m.m31, "m32": m.m32, "m33": m.m33,
        ]
    }

    private func averageMatrix(_ matrices: [CMRotationMatrix]) -> CMRotationMatrix {
        func avg(_ values: [Double]) -> Double {
            guard !values.isEmpty else {
                return 0
            }
            return values.reduce(0, +) / Double(values.count)
        }

        return CMRotationMatrix(
            m11: avg(matrices.map {
                $0.m11
            }),
            m12: avg(matrices.map {
                $0.m12
            }),
            m13: avg(matrices.map {
                $0.m13
            }),
            m21: avg(matrices.map {
                $0.m21
            }),
            m22: avg(matrices.map {
                $0.m22
            }),
            m23: avg(matrices.map {
                $0.m23
            }),
            m31: avg(matrices.map {
                $0.m31
            }),
            m32: avg(matrices.map {
                $0.m32
            }),
            m33: avg(matrices.map {
                $0.m33
            })
        )
    }

    // Heading = compass azimuth of the device's top edge (its +Y axis), read straight from the
    // attitude matrix's world frame — the same frame the JS layer uses for strike/dip/trend
    // (row 2 of the matrix is the device Y axis in ENU: East = -m22, North = m21). Because it's
    // derived from the world-referenced matrix, it's correct in any hold and needs no
    // `UIDevice.orientation` correction — the old switch broke when the device was flat/face-up
    // (reported as portrait) or held upright in landscape. Vertical up/down (Up = m23) doesn't
    // affect the horizontal azimuth, so only the projection onto the horizon is used.
    private func headingFromMatrix(_ m: CMRotationMatrix) -> Double {
        let east = -m.m22
        let north = m.m21

        var headingDegrees = atan2(east, north) * 180.0 / .pi
        if headingDegrees < 0 {
            headingDegrees += 360
        }
        return headingDegrees
    }
}

// MARK: - Helpers

extension Double {
    fileprivate func rounded(toPlaces places: Int) -> Double {
        let divisor = pow(10.0, Double(places))
        return (self * divisor).rounded() / divisor
    }

    fileprivate func normalizeAngle() -> Double {
        let result = fmod(self + 360, 360)
        return result < 0 ? result + 360: result
    }
}
