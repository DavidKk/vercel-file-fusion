export const EXCLUDES_FILES = [
  '.DS_Store', // macOS: Stores folder view settings and icon positions.
  'Thumbs.db', // Windows: Stores thumbnail cache for folders.
  'desktop.ini', // Windows: Stores folder custom settings (e.g., icons and folder name).
  '.Trashes', // macOS: Stores files in the Trash (deleted but not permanently removed).
  '.Spotlight-V100', // macOS: Spotlight index database.
  '.fseventsd', // macOS: File system event logs.
  '._*', // macOS: Metadata files created when copying files to non-macOS systems.
  'Icon\r', // macOS: Folder icon file.
  '__MACOSX', // macOS: Stores metadata for macOS applications.
]
