/** Check if browser supports FileSystemFileHandle.move() method */
export function supportsMoveAPI() {
  try {
    return typeof FileSystemFileHandle !== 'undefined' && 'prototype' in FileSystemFileHandle && 'move' in FileSystemFileHandle.prototype
  } catch {
    return false
  }
}
