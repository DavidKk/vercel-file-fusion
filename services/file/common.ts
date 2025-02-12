export function showOpenFilePicker() {
  if (!('showOpenFilePicker' in window)) {
    throw new Error('showOpenFilePicker is not supported in this browser.')
  }

  return window.showOpenFilePicker()
}

export function showDirectoryPicker() {
  if (!('showDirectoryPicker' in window)) {
    throw new Error('Directory Picker API is not supported in this browser.')
  }

  return window.showDirectoryPicker()
}
