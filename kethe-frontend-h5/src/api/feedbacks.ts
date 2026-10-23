import { post } from '../utils/request'

export const createFeedback = (payload: { content: string }) =>
  post<{ id: number }>('/feedbacks', payload)
