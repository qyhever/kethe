import { HttpStatus, RequestMethod } from '@nestjs/common'
import {
  HTTP_CODE_METADATA,
  METHOD_METADATA,
  PATH_METADATA,
} from '@nestjs/common/constants'
import { TransactionController } from './transaction.controller'

describe('TransactionController 路由', () => {
  it('使用返回 200 的 POST /transactions/query 查询流水', () => {
    const handler = Object.getOwnPropertyDescriptor(
      TransactionController.prototype,
      'list',
    )!.value as object

    expect(Reflect.getMetadata(PATH_METADATA, TransactionController)).toBe(
      'transactions',
    )
    expect(Reflect.getMetadata(PATH_METADATA, handler)).toBe('query')
    expect(Reflect.getMetadata(METHOD_METADATA, handler)).toBe(
      RequestMethod.POST,
    )
    expect(Reflect.getMetadata(HTTP_CODE_METADATA, handler)).toBe(HttpStatus.OK)
  })

  it('保留创建流水的 POST /transactions 路由', () => {
    const handler = Object.getOwnPropertyDescriptor(
      TransactionController.prototype,
      'create',
    )!.value as object

    expect(Reflect.getMetadata(METHOD_METADATA, handler)).toBe(
      RequestMethod.POST,
    )
    expect(Reflect.getMetadata(PATH_METADATA, handler)).toBe('/')
  })
})
