cask "changelog-editor" do
  version "1.0.0"
  sha256 "f78e1804f608583abb486349328e17da817b411519677486cbbda3457ee98cd8"

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