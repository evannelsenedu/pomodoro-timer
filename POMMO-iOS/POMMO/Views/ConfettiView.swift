import SwiftUI

/// Confetti animation on work session completion, using CAEmitterLayer.
struct ConfettiView: UIViewRepresentable {
    func makeUIView(context: Context) -> ConfettiUIView {
        ConfettiUIView()
    }

    func updateUIView(_ uiView: ConfettiUIView, context: Context) {
        uiView.emit()
    }
}

final class ConfettiUIView: UIView {
    private var hasEmitted = false

    override init(frame: CGRect) {
        super.init(frame: frame)
        backgroundColor = .clear
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        backgroundColor = .clear
    }

    func emit() {
        guard !hasEmitted else { return }
        hasEmitted = true

        let emitter = CAEmitterLayer()
        emitter.emitterPosition = CGPoint(x: bounds.midX, y: bounds.height * 0.6)
        emitter.emitterShape = .line
        emitter.emitterSize = CGSize(width: bounds.width, height: 1)

        let colors: [UIColor] = [
            .systemRed, .systemOrange, .systemYellow, .systemGreen,
            .systemBlue, .systemPurple, .systemPink
        ]

        var cells: [CAEmitterCell] = []
        for color in colors {
            let cell = CAEmitterCell()
            cell.birthRate = 20
            cell.lifetime = 3
            cell.velocity = 150
            cell.velocityRange = 50
            cell.emissionLongitude = .pi
            cell.emissionRange = .pi / 2
            cell.spin = 2
            cell.spinRange = 3
            cell.scale = 0.3
            cell.scaleRange = 0.2
            cell.color = color.cgColor
            cell.contents = createParticleImage()?.cgImage
            cells.append(cell)
        }

        emitter.emitterCells = cells
        emitter.birthRate = 1
        emitter.beginTime = CACurrentMediaTime()

        layer.addSublayer(emitter)
        emitter.frame = bounds

        DispatchQueue.main.asyncAfter(deadline: .now() + 2.5) { [weak emitter] in
            emitter?.birthRate = 0
        }
    }

    private func createParticleImage() -> UIImage? {
        let size = CGSize(width: 10, height: 10)
        UIGraphicsBeginImageContextWithOptions(size, false, 0)
        UIColor.white.setFill()
        UIBezierPath(rect: CGRect(origin: .zero, size: size)).fill()
        let image = UIGraphicsGetImageFromCurrentImageContext()
        UIGraphicsEndImageContext()
        return image
    }
}
