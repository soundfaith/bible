$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
Push-Location $repoRoot
$downloadPath = Join-Path $repoRoot 'public\downloads\soundfaith.apk'
$downloadBackupPath = Join-Path $env:TEMP ("soundfaith-apk-" + [guid]::NewGuid().ToString('N') + '.tmp')
$downloadWasPresent = $false
$downloadBackedUp = $false
$buildSucceeded = $false

try {
  $downloadWasPresent = Test-Path -LiteralPath $downloadPath
  if ($downloadWasPresent) {
    # Keep Vite from embedding the previous APK into the next native build.
    Move-Item -LiteralPath $downloadPath -Destination $downloadBackupPath
    $downloadBackedUp = $true
  }

  $javaCandidates = @(
    $env:JAVA_HOME,
    (Join-Path $env:ProgramFiles 'Android\Android Studio\jbr'),
    (Join-Path $env:LOCALAPPDATA 'Programs\Android Studio\jbr')
  ) | Where-Object { $_ } | Select-Object -Unique
  foreach ($jdkDirectory in @(
    (Join-Path $env:ProgramFiles 'Java'),
    (Join-Path $env:ProgramFiles 'Eclipse Adoptium'),
    (Join-Path $env:ProgramFiles 'Microsoft')
  )) {
    $javaCandidates += Get-ChildItem -Path $jdkDirectory -Directory -ErrorAction SilentlyContinue |
      Where-Object Name -Match 'jdk-(17|18|19|20|21|22|23|24)' |
      Select-Object -ExpandProperty FullName
  }
  $javaHome = $null
  foreach ($candidate in $javaCandidates) {
    $javaExe = Join-Path $candidate 'bin\java.exe'
    if (-not (Test-Path $javaExe)) { continue }
    $startInfo = New-Object System.Diagnostics.ProcessStartInfo
    $startInfo.FileName = $javaExe
    $startInfo.Arguments = '-version'
    $startInfo.RedirectStandardError = $true
    $startInfo.RedirectStandardOutput = $true
    $startInfo.UseShellExecute = $false
    $versionProcess = New-Object System.Diagnostics.Process
    $versionProcess.StartInfo = $startInfo
    if (-not $versionProcess.Start()) { continue }
    $versionError = $versionProcess.StandardError.ReadToEnd()
    $versionOutput = $versionProcess.StandardOutput.ReadToEnd()
    $versionProcess.WaitForExit()
    $javaVersionOutput = $versionError + $versionOutput
    $versionProcess.Dispose()
    $versionMatch = [regex]::Match($javaVersionOutput, 'version "(?<major>\d+)')
    if ($versionMatch.Success -and [int]$versionMatch.Groups['major'].Value -ge 17 -and [int]$versionMatch.Groups['major'].Value -le 24) {
      $javaHome = $candidate
      break
    }
  }
  if (-not $javaHome) {
    $jdkCache = Join-Path $env:TEMP 'soundfaith-jdk21'
    $javaHome = Get-ChildItem -Path $jdkCache -Directory -ErrorAction SilentlyContinue |
      Where-Object Name -Match '^jdk-21' |
      Select-Object -ExpandProperty FullName -First 1
    if (-not $javaHome) {
      $jdkArchive = Join-Path $env:TEMP 'soundfaith-jdk21.zip'
      $jdkMetadata = Join-Path $env:TEMP 'soundfaith-jdk21-metadata.json'
      curl.exe -L --fail --silent --show-error --output $jdkArchive 'https://api.adoptium.net/v3/binary/latest/21/ga/windows/x64/jdk/hotspot/normal/eclipse'
      if ($LASTEXITCODE -ne 0) { throw 'Could not download Java 21 from Eclipse Adoptium.' }
      curl.exe -L --fail --silent --show-error --output $jdkMetadata 'https://api.adoptium.net/v3/assets/latest/21/hotspot?architecture=x64&image_type=jdk&os=windows'
      if ($LASTEXITCODE -ne 0) { throw 'Could not get the Java 21 archive checksum.' }
      $expectedChecksum = ((Get-Content -Raw $jdkMetadata | ConvertFrom-Json)[0].binary.package.checksum).ToLowerInvariant()
      $actualChecksum = (Get-FileHash $jdkArchive -Algorithm SHA256).Hash.ToLowerInvariant()
      if ($actualChecksum -ne $expectedChecksum) { throw 'Java 21 archive checksum did not match Adoptium metadata.' }
      New-Item -ItemType Directory -Path $jdkCache -Force | Out-Null
      tar.exe -xf $jdkArchive -C $jdkCache
      if ($LASTEXITCODE -ne 0) { throw 'Could not unpack the Java 21 JDK.' }
      $javaHome = Get-ChildItem -Path $jdkCache -Directory |
        Where-Object Name -Match '^jdk-21' |
        Select-Object -ExpandProperty FullName -First 1
    }
  }
  if (-not $javaHome) { throw 'Gradle 8.14.3 needs Java 17–24. Install a JDK in that range and set JAVA_HOME.' }
  $env:JAVA_HOME = $javaHome
  $env:PATH = (Join-Path $javaHome 'bin') + [IO.Path]::PathSeparator + $env:PATH

  if (-not $env:ANDROID_HOME -or -not (Test-Path $env:ANDROID_HOME)) {
    $sdkCandidates = @(
      (Join-Path $env:LOCALAPPDATA 'Android\Sdk'),
      (Join-Path $env:ProgramFiles 'Android\Sdk')
    )
    $androidSdk = $sdkCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
    if ($androidSdk) { $env:ANDROID_HOME = $androidSdk }
  }
  if ($env:ANDROID_HOME -and -not $env:ANDROID_SDK_ROOT) { $env:ANDROID_SDK_ROOT = $env:ANDROID_HOME }
  if (-not $env:GRADLE_USER_HOME) { $env:GRADLE_USER_HOME = Join-Path $env:TEMP 'soundfaith-gradle-v2' }
  if (-not $env:ANDROID_USER_HOME) {
    # A stable location keeps the debug signing key, so new APKs install over the old one.
    $env:ANDROID_USER_HOME = Join-Path $env:USERPROFILE '.soundfaith\android'
    $legacyKeystore = Join-Path $env:TEMP 'soundfaith-android\debug.keystore'
    $stableKeystore = Join-Path $env:ANDROID_USER_HOME 'debug.keystore'
    New-Item -ItemType Directory -Path $env:ANDROID_USER_HOME -Force | Out-Null
    if (-not (Test-Path -LiteralPath $stableKeystore) -and (Test-Path -LiteralPath $legacyKeystore)) {
      Copy-Item -LiteralPath $legacyKeystore -Destination $stableKeystore
    }
  }
  if ($env:USERPROFILE -and $env:JAVA_TOOL_OPTIONS -notmatch '(?:^|\s)-Duser\.home=') {
    $env:JAVA_TOOL_OPTIONS = (($env:JAVA_TOOL_OPTIONS + ' -Duser.home="' + $env:USERPROFILE + '"').Trim())
  }

  $capacitorPackages = @(
    '@capacitor/core@^8',
    '@capacitor/cli@^8',
    '@capacitor/android@^8',
    '@capacitor/assets@3.0.5'
  )

  $missingCapacitorPackages = @(
    'node_modules\@capacitor\core\package.json',
    'node_modules\@capacitor\cli\package.json',
    'node_modules\@capacitor\android\package.json',
    'node_modules\@capacitor\assets\package.json'
  ) | Where-Object { -not (Test-Path $_) }
  if ($missingCapacitorPackages) {
    & npm.cmd install --no-save --package-lock=false --legacy-peer-deps @capacitorPackages
    if ($LASTEXITCODE -ne 0) { throw 'Could not install the Capacitor build tools.' }
  }

  & npm.cmd run build
  if ($LASTEXITCODE -ne 0) { throw 'The web app build failed.' }

  if (-not (Test-Path 'android\settings.gradle')) {
    & npx.cmd cap add android
    if ($LASTEXITCODE -ne 0) { throw 'Could not create the Android project.' }
  }

  $generatedIcon = Join-Path $repoRoot 'android\app\src\main\res\mipmap-xxxhdpi\ic_launcher.png'
  if (-not (Test-Path $generatedIcon) -or (Get-Item $generatedIcon).LastWriteTime -lt (Get-Item 'assets\logo.svg').LastWriteTime) {
    & npx.cmd capacitor-assets generate --android --assetPath assets --iconBackgroundColor '#125B55' --splashBackgroundColor '#F7F6F1'
    if ($LASTEXITCODE -ne 0) { throw 'Could not generate the Android app icon.' }
  }

  & npx.cmd cap sync android
  if ($LASTEXITCODE -ne 0) { throw 'Could not sync the web app into Android.' }

  $buildTime = Get-Date
  $versionCode = [int][math]::Floor(([DateTimeOffset]$buildTime).ToUnixTimeSeconds() / 60)
  $versionName = $buildTime.ToString('yyyy.MM.dd.HHmm')
  & .\android\gradlew.bat -p android assembleDebug "-PsfVersionCode=$versionCode" "-PsfVersionName=$versionName"
  if ($LASTEXITCODE -ne 0) { throw 'Gradle could not build the APK.' }

  $artifactDirectory = Join-Path $repoRoot 'artifacts\android'
  New-Item -ItemType Directory -Path $artifactDirectory -Force | Out-Null
  $apkPath = Join-Path $repoRoot 'android\app\build\outputs\apk\debug\app-debug.apk'
  $artifactPath = Join-Path $artifactDirectory 'soundfaith-debug.apk'
  Copy-Item -LiteralPath $apkPath -Destination $artifactPath -Force
  New-Item -ItemType Directory -Path (Split-Path -Parent $downloadPath) -Force | Out-Null
  Copy-Item -LiteralPath $apkPath -Destination $downloadPath -Force
  $distDownloadPath = Join-Path $repoRoot 'dist\downloads\soundfaith.apk'
  New-Item -ItemType Directory -Path (Split-Path -Parent $distDownloadPath) -Force | Out-Null
  Copy-Item -LiteralPath $apkPath -Destination $distDownloadPath -Force
  # The landing page compares this version with the one a visitor last downloaded to show an "Update" badge.
  $manifestJson = [ordered]@{
    version = $versionName
    versionCode = $versionCode
    builtAt = $buildTime.ToUniversalTime().ToString('o')
    sizeBytes = (Get-Item -LiteralPath $apkPath).Length
  } | ConvertTo-Json
  foreach ($manifestDirectory in @((Split-Path -Parent $downloadPath), (Split-Path -Parent $distDownloadPath))) {
    [IO.File]::WriteAllText((Join-Path $manifestDirectory 'soundfaith-apk.json'), $manifestJson, (New-Object Text.UTF8Encoding($false)))
  }
  $buildSucceeded = $true
  Write-Host "APK ready: $artifactPath"
  Write-Host "Downloadable APK updated: $downloadPath"
}
finally {
  try {
    if ($downloadBackedUp) {
      if ($buildSucceeded) {
        Remove-Item -LiteralPath $downloadBackupPath -Force
      }
      else {
        if (Test-Path -LiteralPath $downloadPath) {
          Remove-Item -LiteralPath $downloadPath -Force
        }
        Move-Item -LiteralPath $downloadBackupPath -Destination $downloadPath
      }
    }
    elseif (-not $downloadWasPresent -and -not $buildSucceeded -and (Test-Path -LiteralPath $downloadPath)) {
      Remove-Item -LiteralPath $downloadPath -Force
    }
  }
  finally {
    Pop-Location
  }
}
