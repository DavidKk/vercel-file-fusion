'use client'

import { useRef, useState, useEffect } from 'react'
import { useRequest } from 'ahooks'
import { writeFileToDirectory } from '@/services/file/writer'
import Alert, { AlertImperativeHandler } from '@/components/Alert'
import Picker from '@/components/Picker'
import Meta from '@/components/Meta'
import FileProgressBar from '@/components/FileProgressBar'
import PageLoading from '@/components/PageLoading'

export default function Unrar() {
  return <div></div>
  // const [ready, setReady] = useState(false)
  // const [currentRar, setCurrentRar] = useState('')
  // const [currentFile, setCurrentFile] = useState('')
  // const [totalProgress, setTotalProgress] = useState(0)
  // const [password, setPassword] = useState('')
  // const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  // const [addRootFolder, setAddRootFolder] = useState(false)
  // const alertRef = useRef<AlertImperativeHandler>(null)

  // useEffect(() => {
  //   const savedPassword = localStorage.getItem('unrarPassword')
  //   const savedAddRootFolder = localStorage.getItem('unrarAddRootFolder')

  //   if (savedPassword) {
  //     setPassword(savedPassword)
  //   }

  //   if (savedAddRootFolder) {
  //     setAddRootFolder(savedAddRootFolder === 'true')
  //   }

  //   setReady(true)
  // }, [])

  // useEffect(() => {
  //   localStorage.setItem('unrarPassword', password)
  // }, [password])

  // useEffect(() => {
  //   localStorage.setItem('unrarAddRootFolder', addRootFolder.toString())
  // }, [addRootFolder])

  // const { run: startUnrar } = useRequest(
  //   async () => {
  //     const directoryHandle = await showDirectoryPicker()
  //     const totalRars = selectedFiles.length
  //     let processedRars = 0

  //     for await (const file of selectedFiles) {
  //       const rarFileName = file.name
  //       setCurrentRar(rarFileName)

  //       const unrar = new Unrar({
  //         file,
  //         password,
  //       })

  //       const entries = await unrar.getEntries()
  //       const totalFiles = entries.length
  //       let processedFiles = 0

  //       for await (const entry of entries) {
  //         if (entry.isDirectory) {
  //           continue
  //         }

  //         const name = addRootFolder ? `${rarFileName.replace('.rar', '')}/${entry.name}` : entry.name
  //         const content = await entry.readFile()

  //         await writeFileToDirectory(name, content, {
  //           directoryHandle,
  //           onProgress(progress, total) {
  //             setCurrentFile(name)

  //             const writeProgress = (progress / total) * 50
  //             const totalProgress = ((processedRars + (processedFiles + 0.5 + writeProgress / 100) / totalFiles) / totalRars) * 100
  //             setTotalProgress(totalProgress)
  //           },
  //         })

  //         processedFiles += 1
  //       }

  //       processedRars += 1
  //       setTotalProgress((processedRars / totalRars) * 100)
  //     }
  //   },
  //   {
  //     manual: true,
  //     onSuccess: () => {
  //       setTotalProgress(100)
  //       setSelectedFiles([])
  //       setTimeout(() => setTotalProgress(0), 500)
  //     },
  //     onError: (error) => {
  //       setTotalProgress(0)
  //       alertRef.current?.show(error.message, { type: 'error' })
  //     },
  //     onFinally: () => {
  //       setCurrentRar('')
  //       setCurrentFile('')
  //     },
  //   }
  // )

  // if (!ready) {
  //   return <PageLoading />
  // }

  // return (
  //   <div className="w-[100vw] h-[100vh] flex flex-col items-center">
  //     <div className="w-2/3 max-w-3xl mx-auto mt-10">
  //       <Meta
  //         title="Local Unrar"
  //         description="Unrar files directly in your browser. Batch decrypt and unrar. Using unrar.js library."
  //       />

  //       <div className="w-full mb-4">
  //         <input className="w-full p-2 border rounded" type="text" placeholder="Enter password (if any)" value={password} onChange={(e) => setPassword(e.target.value)} />
  //       </div>

  //       <Picker
  //         message="Drag and drop RAR files here, or click to select files"
  //         onSelect={(acceptedFiles) => setSelectedFiles(acceptedFiles)}
  //         accept={{ rar: ['.rar'] }}
  //         disabled={totalProgress > 0}
  //         selectedFiles={selectedFiles}
  //       />

  //       <div className="w-full flex flex-col">
  //         <label className="p-2 text-gray-600 inline-flex items-center cursor-pointer">
  //           <input type="checkbox" checked={addRootFolder} onChange={(e) => setAddRootFolder(e.target.checked)} />
  //           <span className="ml-2">Add root folder for each unrar</span>
  //         </label>
  //       </div>

  //       <button onClick={() => startUnrar()} className="w-full bg-blue-600 text-white p-2 rounded disabled:opacity-50" disabled={selectedFiles.length === 0 || totalProgress > 0}>
  //         Start Unraring
  //       </button>

  //       <div className="mt-4 w-full h-10">
  //         <Alert ref={alertRef} />

  //         {totalProgress > 0 && <FileProgressBar progress={totalProgress} message={totalProgress >= 100 ? 'Finish' : `${currentRar}: extracting ${currentFile}`} />}
  //       </div>
  //     </div>
  //   </div>
  // )
}
