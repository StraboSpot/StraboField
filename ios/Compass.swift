  import CoreLocation
  import CoreMotion
  import Foundation
  import React
  import UIKit

  @objc(Compass)
  class Compass: RCTEventEmitter {
    let motionTrue = CMMotionManager()
    let motionMagnetic = CMMotionManager()

    var trueMatrixArray = [CMRotationMatrix]()
    var magneticMatrixArray = [CMRotationMatrix]()
    var hasListeners = false

    override static func requiresMainQueueSetup() -> Bool { true }

    override func supportedEvents() -> [String]! {
      return ["rotationMatrix"]
    }

    override func startObserving() {
      hasListeners = true
    }

    override func stopObserving() {
      hasListeners = false
    }

    @objc
    func startCompass() {
      guard CMMotionManager.availableAttitudeReferenceFrames().contains(.xTrueNorthZVertical),
        CMMotionManager.availableAttitudeReferenceFrames().contains(.xMagneticNorthZVertical)
      else { return }

      let queue = OperationQueue.main
      let orientation = UIDevice.current.orientation

      motionTrue.deviceMotionUpdateInterval = 0.2
      motionMagnetic.deviceMotionUpdateInterval = 0.2

      motionTrue.startDeviceMotionUpdates(using: .xTrueNorthZVertical, to: queue) { data, _ in
        guard let data = data else { return }
        self.trueMatrixArray.append(data.attitude.rotationMatrix)
        if self.trueMatrixArray.count > 5 { self.trueMatrixArray.removeFirst() }
        self.emitHeadingIfReady()
      }

      motionMagnetic.startDeviceMotionUpdates(using: .xMagneticNorthZVertical, to: queue) { data, _ in
        guard let data = data else { return }
        self.magneticMatrixArray.append(data.attitude.rotationMatrix)
        if self.magneticMatrixArray.count > 5 { self.magneticMatrixArray.removeFirst() }
        self.emitHeadingIfReady()
      }
    }

    @objc
    func stopCompass() {
      motionTrue.stopDeviceMotionUpdates()
      motionMagnetic.stopDeviceMotionUpdates()
      trueMatrixArray.removeAll()
      magneticMatrixArray.removeAll()
    }

    private func emitHeadingIfReady() {
      guard hasListeners,
        trueMatrixArray.count >= 5,
        magneticMatrixArray.count >= 5
      else { return }

      let orientation = UIDevice.current.orientation

      let avgTrue = averageMatrix(trueMatrixArray)
      let avgMag = averageMatrix(magneticMatrixArray)

      let trueHeading = headingFromMatrix(avgTrue, orientation: orientation)
      let magneticHeading = headingFromMatrix(avgMag, orientation: orientation)
      let declination = (trueHeading - magneticHeading).normalizeAngle()
      print("True matrix m11: \(avgTrue.m11), Magnetic matrix m11: \(avgMag.m11)")

      sendEvent(
        withName: "rotationMatrix",
        body: [
          "trueHeading": trueHeading.rounded(toPlaces: 1),
          "magneticHeading": magneticHeading.rounded(toPlaces: 1),
          "declination": declination.rounded(toPlaces: 1),
          "matrix": [
            "m11": avgTrue.m11, "m12": avgTrue.m12, "m13": avgTrue.m13,
            "m21": avgTrue.m21, "m22": avgTrue.m22, "m23": avgTrue.m23,
            "m31": avgTrue.m31, "m32": avgTrue.m32, "m33": avgTrue.m33,
          ],
        ])
    }

    private func averageMatrix(_ matrices: [CMRotationMatrix]) -> CMRotationMatrix {
      func avg(_ values: [Double]) -> Double {
        guard !values.isEmpty else { return 0 }
        return values.reduce(0, +) / Double(values.count)
      }

      return CMRotationMatrix(
        m11: avg(matrices.map { $0.m11 }),
        m12: avg(matrices.map { $0.m12 }),
        m13: avg(matrices.map { $0.m13 }),
        m21: avg(matrices.map { $0.m21 }),
        m22: avg(matrices.map { $0.m22 }),
        m23: avg(matrices.map { $0.m23 }),
        m31: avg(matrices.map { $0.m31 }),
        m32: avg(matrices.map { $0.m32 }),
        m33: avg(matrices.map { $0.m33 })
      )
    }

    private func headingFromMatrix(_ m: CMRotationMatrix, orientation: UIDeviceOrientation) -> Double
    {
      var x: Double = -m.m12
      var y: Double = -m.m22

      switch orientation {
      case .landscapeLeft:
        swap(&x, &y)
        y = -y
      case .landscapeRight:
        swap(&x, &y)
        x = -x
      case .portraitUpsideDown:
        x = -x
        y = -y
      default: break
      }

      var headingDegrees = atan2(y, x) * 180.0 / .pi
      if headingDegrees < 0 { headingDegrees += 360 }
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
      return result < 0 ? result + 360 : result
    }
  }
