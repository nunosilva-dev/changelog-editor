cask "changelog-editor" do
  version "1.0.0"
  sha256 "1d09d04172f50a12f3a18371e1225b91ae7e8ff8261853d04dfc2b4e4ca97468"

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