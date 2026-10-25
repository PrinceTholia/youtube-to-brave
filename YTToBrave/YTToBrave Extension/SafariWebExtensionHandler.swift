//
//  SafariWebExtensionHandler.swift
//  YTToBrave Extension
//

import SafariServices
import os.log

class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {

    private let braveBundleID = "com.brave.Browser"

    func beginRequest(with context: NSExtensionContext) {
        let request = context.inputItems.first as? NSExtensionItem

        let message: Any?
        if #available(iOS 15.0, macOS 11.0, *) {
            message = request?.userInfo?[SFExtensionMessageKey]
        } else {
            message = request?.userInfo?["message"]
        }

        // Hand off YouTube URLs to Brave
        if let msg = message as? [String: Any],
           let urlString = msg["url"] as? String,
           let url = URL(string: urlString),
           isYouTube(url) {
            openInBrave(url)
        }

        let response = NSExtensionItem()
        let reply: [String: Any] = ["status": "ok"]
        if #available(iOS 15.0, macOS 11.0, *) {
            response.userInfo = [SFExtensionMessageKey: reply]
        } else {
            response.userInfo = ["message": reply]
        }
        context.completeRequest(returningItems: [response], completionHandler: nil)
    }

    private func isYouTube(_ url: URL) -> Bool {
        let host = url.host?.lowercased().replacingOccurrences(of: "^www\\.", with: "", options: .regularExpression) ?? ""
        return host == "youtube.com" || host == "youtu.be" || host.hasSuffix(".youtube.com")
    }

    private func openInBrave(_ url: URL) {
        guard let braveURL = NSWorkspace.shared.urlForApplication(withBundleIdentifier: braveBundleID) else {
            os_log(.error, "Brave not found for bundle id %@", braveBundleID)
            return
        }
        let config = NSWorkspace.OpenConfiguration()
        config.activates = true
        NSWorkspace.shared.open([url], withApplicationAt: braveURL, configuration: config) { _, error in
            if let error = error {
                os_log(.error, "Brave handoff failed: %{public}@", error.localizedDescription)
            }
        }
    }
}
