export function showOpenFilePicker(options?: OpenFilePickerOptions & { multiple?: false | undefined }) {
  if (!('showOpenFilePicker' in window)) {
    throw new Error('showOpenFilePicker is not supported in this browser.')
  }

  return window.showOpenFilePicker(options)
}

export function showDirectoryPicker(options?: DirectoryPickerOptions) {
  if (!('showDirectoryPicker' in window)) {
    throw new Error('Directory Picker API is not supported in this browser.')
  }

  return window.showDirectoryPicker(options)
}
