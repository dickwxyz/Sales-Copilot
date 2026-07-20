import api from './index'

export const analysisApi = {
  /** 新建分析 */
  create(formData) {
    return api.post('/analysis', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  /** 历史记录列表 */
  list(params = {}) {
    return api.get('/analysis', { params })
  },
  /** 单条详情 */
  get(id) {
    return api.get(`/analysis/${id}`)
  },
  /** 追问 */
  followup(id, formData) {
    return api.post(`/analysis/${id}/followup`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
