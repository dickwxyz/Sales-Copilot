import api from './index'

export const evaluationsApi = {
  /** 提交评价 */
  submit(data) {
    return api.post('/evaluations', data)
  },
  /** 评价统计 */
  stats() {
    return api.get('/evaluations/stats')
  },
}
