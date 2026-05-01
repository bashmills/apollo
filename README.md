# Apollo

Apollo is a desktop application for downloading music playlists. It uses `yt-dlp` under the hood to fetch audio from online sources. It uses the embedded metadata to fetch matching releases from `MusicBrainz` and attempts to choose a best matching release. It then uses `Cover Art Archive` to download album artwork for each release.

The app itself uses Electron, React, Tailwind and Vite.

## Features

- Electron based cross platform desktop app (Windows, MacOS, Linux)
- Download entire music playlists at the click of a button
- Uses `yt-dlp` for downloading and audio extraction
- Override embdedded metadata for more accurate release matching
- `MusicBrainz` release downloading and tagging
- Select alternate releases from potential `MusicBrainz` matches
- Retrieve album artwork via `Cover Art Archive`
- Add custom releases for more obscur songs

## Installation

Prebuilt installers are available for each platform [here](https://github.com/bashmills/apollo/releases/latest).

## Usage

1. Download and install the appropriate release for your operating system.
2. Launch the application.
3. Make sure `yt-dlp` is downloaded and ready by using `Fetch Latest` in the tools settings.
4. Paste a playlist url and hit the `Download` button.
5. Override metadata, identify correct releases, etc.
6. Click the `Save Downloads` button.
7. Pick a folder to export to.

## Troubleshooting

### Missing Metadata

- Override embedded metadata by clicking on the song and then the `Override Metadata` button. This will allow you to manually input the artist, album and title data.
- If the app has selected an incorrect release for a song you can view the releases matched by clicking the song. You can then view the releases and inspect them further in the list shown. Use the `Select Release` button to choose that release for the song.
- If all else fails you can create a custom release for a song by clicking the song and then the `Add Custom` button. Fill in the metadata and then you can either search for cover art or add the release without art.

### Rate Limits

Apollo uses the GitHub API to download and fetch `yt-dlp` releases. GitHub enforces rate limits on unauthenticated requests. If you experience issues installing or updating `yt-dlp`:

- Use a GitHub Personal Access Token for authenticated requests ([here](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-fine-grained-personal-access-token))
- Ensure your network is not heavily rate-limited or behind a shared network.
- Avoid repeatedly triggering `Fetch Latest` in rapid succession.
- Switch networks if possible.
- Wait a few minutes and try again.

The app queues requests to avoid hitting `MusicBrainz` rate limits. Currently `Cover Art Archive` has no rate limits but we still queue requests to be safe.

## Disclaimer

This application interacts with third-party services and tools such as `MusicBrainz`, `Cover Art Archive` and `yt-dlp`. Ensure you comply with the terms of use of any content you download.

## License

This project is licensed under the [GPL License](LICENSE).
