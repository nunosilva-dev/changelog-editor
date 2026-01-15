cask "changelog-editor" do
  version "1.1.0"
  sha256 "cbc9aeb5d834d6506fe3c860b47596c2e492f741519566566d0102874ffb0ddc"

  url "https://github.com/nunosilva-dev/changelog-editor/releases/download/release/#{version}/Changelog-Editor-#{version}-arm64.dmg"
  name "Changelog Editor"
  desc "A developer-friendly tool for managing changelogs"
  homepage "https://github.com/nunosilva-dev/changelog-editor"

  app "Changelog Editor.app"

  postflight do
    system_command "xattr",
                   args: ["-cr", "#{appdir}/Changelog Editor.app"],
                   sudo: false
  end

  zap trash: [
    "~/Library/Application Support/changelog-editor",
    "~/Library/Preferences/com.nunosilva.changelogeditor.plist",
  ]
end