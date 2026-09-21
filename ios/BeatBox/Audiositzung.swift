import AVFoundation

/// Audiositzung für ein Rhythmusspiel: Ton ist spielentscheidend und soll
/// auch bei eingeschaltetem Stummschalter zu hören sein.
enum Audiositzung {
    static func aktivieren() {
        let sitzung = AVAudioSession.sharedInstance()
        do {
            try sitzung.setCategory(.playback, mode: .default, options: [])
            try sitzung.setActive(true)
        } catch {
            NSLog("BeatBox: Audiositzung nicht aktivierbar: %@", error.localizedDescription)
        }
    }
}
