interface FileSystemFileHandle {
  /** Move the file to a new location. */
  move(directoryHandle: FileSystemDirectoryHandle, newName?: string): Promise<void>
  move(newName: string): Promise<void>
}
