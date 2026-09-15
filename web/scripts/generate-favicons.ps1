param(
  [string]$SourceImage = "$PSScriptRoot\..\public\assets\Logo Icon.png",
  [string]$OutAssets = "$PSScriptRoot\..\public\assets",
  [string]$OutRoot = "$PSScriptRoot\..\public",
  [string]$OutApp = "$PSScriptRoot\..\src\app"
)

<#
  Regenerates the favicon set from the master logo asset:
    - centers the (non-square) source on a transparent square canvas
    - writes 48/96/144/192/512 PNGs, 180x180 apple-touch-icon.png
    - writes a PNG-based multi-size favicon.ico (16/32/48) at src/app/favicon.ico
      (Next.js app/ metadata convention - NOT public/, which would shadow it)
    - writes site.webmanifest, removes the legacy public/favicon.ico duplicate
  Requires Windows + System.Drawing (PowerShell).
  Verify with: npm run verify:favicons
#>

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$srcPath = (Resolve-Path $SourceImage).Path
$src = [System.Drawing.Image]::FromFile($srcPath)
$square = $null
try {
  $side = [Math]::Max($src.Width, $src.Height)
  $square = New-Object System.Drawing.Bitmap($side, $side, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($square)
  try {
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $offX = [int](($side - $src.Width) / 2)
    $offY = [int](($side - $src.Height) / 2)
    $g.DrawImage($src, (New-Object System.Drawing.Rectangle($offX, $offY, $src.Width, $src.Height)))
  } finally { $g.Dispose() }

  function New-PngBytes([int]$size, [System.Drawing.Image]$master) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $gg = [System.Drawing.Graphics]::FromImage($bmp)
    try {
      $gg.Clear([System.Drawing.Color]::Transparent)
      $gg.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $gg.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
      $gg.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
      $gg.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
      $gg.DrawImage($master, (New-Object System.Drawing.Rectangle(0, 0, $size, $size)))
    } finally { $gg.Dispose() }
    $ms = New-Object System.IO.MemoryStream
    $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $bytes = $ms.ToArray()
    $ms.Dispose()
    $bmp.Dispose()
    return ,$bytes
  }

  $pngs = @{ }
  foreach ($size in 16, 32, 48, 96, 144, 192, 512, 180) {
    $pngs[$size] = New-PngBytes $size $square
  }

  foreach ($size in 48, 96, 144, 192, 512) {
    [System.IO.File]::WriteAllBytes((Join-Path $OutAssets "favicon-${size}x${size}.png"), $pngs[$size])
  }
  [System.IO.File]::WriteAllBytes((Join-Path $OutAssets "apple-touch-icon.png"), $pngs[180])

  $icoSizes = 16, 32, 48
  $ms = New-Object System.IO.MemoryStream
  $w = New-Object System.IO.BinaryWriter($ms)
  $w.Write([UInt16]0); $w.Write([UInt16]1); $w.Write([UInt16]$icoSizes.Count)
  $offset = 6 + 16 * $icoSizes.Count
  $entries = @()
  foreach ($size in $icoSizes) {
    $blob = $pngs[$size]
    $entries += @{ Size = $size; Blob = $blob; Offset = $offset }
    $offset += $blob.Length
  }
  foreach ($e in $entries) {
    $w.Write([byte]$e.Size); $w.Write([byte]$e.Size)
    $w.Write([byte]0); $w.Write([byte]0)
    $w.Write([UInt16]1); $w.Write([UInt16]32)
    $w.Write([UInt32]$e.Blob.Length); $w.Write([UInt32]$e.Offset)
  }
  foreach ($e in $entries) { $ms.Write($e.Blob, 0, $e.Blob.Length) }
  $w.Dispose()
  $icoBytes = $ms.ToArray()
  $ms.Dispose()
  [System.IO.File]::WriteAllBytes((Join-Path $OutApp "favicon.ico"), $icoBytes)
  Remove-Item (Join-Path $OutRoot "favicon.ico") -ErrorAction SilentlyContinue

  $manifest = @{
    name            = "ShenoDev"
    short_name      = "ShenoDev"
    start_url       = "/"
    display         = "standalone"
    background_color = "#0b1326"
    theme_color     = "#0b1326"
    icons = @(
      @{ src = "/assets/favicon-192x192.png"; sizes = "192x192"; type = "image/png"; purpose = "any" },
      @{ src = "/assets/favicon-512x512.png"; sizes = "512x512"; type = "image/png"; purpose = "any maskable" }
    )
  } | ConvertTo-Json -Depth 4
  $enc = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText((Join-Path $OutRoot "site.webmanifest"), $manifest, $enc)

  Write-Output "Generated:"
  foreach ($size in 48, 96, 144, 192, 512) { Write-Output "  assets/favicon-${size}x${size}.png" }
  Write-Output "  assets/apple-touch-icon.png (180x180)"
  Write-Output "  src/app/favicon.ico (16/32/48 PNG entries)"
  Write-Output "  site.webmanifest"
} finally {
  if ($square) { $square.Dispose() }
  $src.Dispose()
}