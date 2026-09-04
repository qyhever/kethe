import { post } from '../utils/request'
import type { AttachUploadResult } from './types'

export function uploadAttach(file: File, onProgress?: (progress: number) => void) {
  const data = new FormData()
  data.append('file', file)

  return post<AttachUploadResult>('/attach/upload', data, {
    onUploadProgress: onProgress
      ? (event) => {
          if (!event.lengthComputable) return
          onProgress(Math.round((event.loaded / event.total) * 100))
        }
      : undefined,
  })
}
