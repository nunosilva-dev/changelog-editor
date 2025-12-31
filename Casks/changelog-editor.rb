cask "changelog-editor" do
  version "1.0.0"
  sha256 "0019dfc4b32d63c1392aa264aed2253c1e0c2fb09216f8e2cc269bbfb8bb49b5"

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