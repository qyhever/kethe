import { BadRequestException } from '@nestjs/common'
import { AttachController } from './attach.controller'
import { AttachService } from './attach.service'
import type { AttachUploadFile } from './attach.types'

describe('AttachController', () => {
  it('should reject an upload without a file', () => {
    const upload = jest.fn()
    const service = {
      upload,
    } as unknown as AttachService
    const controller = new AttachController(service)

    expect(() => controller.upload()).toThrow(BadRequestException)
    expect(upload).not.toHaveBeenCalled()
  })

  it('should delegate a file upload to the service', async () => {
    const upload = jest.fn().mockResolvedValue({
      fileName: 'stored.txt',
      originName: 'origin.txt',
      url: 'http://localhost/stored.txt',
    })
    const service = {
      upload,
    } as unknown as AttachService
    const controller = new AttachController(service)
    const file: AttachUploadFile = {
      originalname: 'origin.txt',
      buffer: Buffer.from('content'),
    }

    await expect(controller.upload(file)).resolves.toEqual({
      fileName: 'stored.txt',
      originName: 'origin.txt',
      url: 'http://localhost/stored.txt',
    })
    expect(upload).toHaveBeenCalledWith(file)
  })
})
