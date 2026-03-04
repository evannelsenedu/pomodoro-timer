import SwiftUI

/// Main timer UI: title, quote picker, logo, timer display, controls, stats.
struct MainTimerView: View {
    @ObservedObject var timerState: TimerState
    @State private var selectedQuote: String = ""
    private let historyService = HistoryService.shared
    private let soundService = SoundService.shared

    private let primaryColor = Color(red: 92/255, green: 107/255, blue: 192/255)
    private let primaryHoverColor = Color(red: 26/255, green: 35/255, blue: 126/255)
    private let quoteColor = Color(red: 107/255, green: 91/255, blue: 115/255)

    var body: some View {
        VStack(spacing: 0) {
            Text(timerState.mode == .work ? "Pomodoro Timer" : "Break Time")
                .font(.system(size: 24, weight: .semibold))
                .foregroundColor(Color(white: 0.2))
                .padding(.bottom, 4)

            HStack(spacing: 4) {
                Text("Do it for")
                    .font(.custom("Georgia", size: 16))
                    .italic()
                    .foregroundColor(quoteColor)
                Picker("", selection: $selectedQuote) {
                    Text("").tag("")
                    Text("Lola").tag("Lola")
                }
                .pickerStyle(.menu)
                .onChange(of: selectedQuote) { newValue in
                    historyService.setQuoteFor(newValue.isEmpty ? nil : newValue)
                }
            }
            .padding(.bottom, 16)

            ZStack(alignment: .center) {
                Image("pommo-logo")
                    .resizable()
                    .scaledToFit()
                    .frame(width: 260, height: 260)

                Text(TimeFormatting.formatTime(seconds: timerState.timeRemaining))
                    .font(.system(size: 40, weight: .heavy))
                    .foregroundColor(Color(white: 0.2))
                    .fontDesign(.monospaced())
                    .shadow(color: .white.opacity(0.8), radius: 1, x: 0, y: 1)
                    .offset(y: 26)
            }
            .frame(width: 260, height: 260)
            .padding(.bottom, 24)

            HStack(spacing: 12) {
                Button(action: {
                    soundService.play(.start)
                    timerState.isPaused ? timerState.startTimer() : timerState.pauseTimer()
                }) {
                    Text(timerState.isPaused ? "Start" : "Pause")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(.white)
                        .frame(minWidth: 100)
                        .padding(.vertical, 14)
                        .background(primaryColor)
                        .cornerRadius(12)
                }
                .buttonStyle(.plain)

                Button(action: {
                    soundService.play(.reset)
                    timerState.resetTimer()
                }) {
                    Text("Reset")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(.white)
                        .frame(minWidth: 100)
                        .padding(.vertical, 14)
                        .background(primaryColor)
                        .cornerRadius(12)
                }
                .buttonStyle(.plain)

                if timerState.mode == .break_ {
                    Button(action: {
                        soundService.play(.start)
                        timerState.skipBreak()
                    }) {
                        Text("Skip Break")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(.white)
                            .frame(minWidth: 100)
                            .padding(.vertical, 14)
                            .background(primaryColor)
                            .cornerRadius(12)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.bottom, 16)

            statsView
                .padding(.bottom, 8)

            HStack(spacing: 12) {
                Button("Reset time stats") {
                    soundService.play(.resetSessions)
                    timerState.resetTimeStats()
                }
                .font(.system(size: 14))
                .foregroundColor(Color(white: 0.33))
                .padding(.vertical, 8)
                .padding(.horizontal, 12)
                .overlay(
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(Color.gray.opacity(0.5), lineWidth: 1)
                )

                Button("Change duration") {
                    soundService.play(.start)
                    timerState.pauseTimer()
                    timerState.showDurationPicker = true
                }
                .font(.system(size: 14))
                .foregroundColor(Color(white: 0.33))
                .padding(.vertical, 8)
                .padding(.horizontal, 12)
                .overlay(
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(Color.gray.opacity(0.5), lineWidth: 1)
                )
            }
        }
        .frame(maxWidth: 360)
        .onAppear {
            selectedQuote = historyService.getQuoteFor() ?? ""
        }
    }

    private var statsView: some View {
        let today = TimeFormatting.formatHoursMinutes(totalMinutes: historyService.getMinutesToday())
        let week = TimeFormatting.formatHoursMinutes(totalMinutes: historyService.getMinutesThisWeek())
        let year = TimeFormatting.formatHoursMinutes(totalMinutes: historyService.getMinutesThisYear())
        let total = TimeFormatting.formatHoursMinutes(totalMinutes: historyService.getTotalMinutes())

        return HStack(spacing: 4) {
            Text("Today: ")
                .foregroundColor(Color(white: 0.33))
            Text(today)
                .fontWeight(.semibold)
                .foregroundColor(Color(white: 0.2))
            Text("| This week: ")
                .foregroundColor(Color(white: 0.33))
            Text(week)
                .fontWeight(.semibold)
                .foregroundColor(Color(white: 0.2))
            Text("| This year: ")
                .foregroundColor(Color(white: 0.33))
            Text(year)
                .fontWeight(.semibold)
                .foregroundColor(Color(white: 0.2))
            Text("| All time: ")
                .foregroundColor(Color(white: 0.33))
            Text(total)
                .fontWeight(.semibold)
                .foregroundColor(Color(white: 0.2))
        }
        .font(.system(size: 16))
        .lineLimit(1)
        .minimumScaleFactor(0.6)
    }
}
