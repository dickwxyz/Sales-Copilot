import api from './index'

export const materialsApi = {
  /** 上传 SOP */
  uploadSop(formData) {
    return api.post('/materials/sop', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  /** SOP 列表 */
  listSop() {
    return api.get('/materials/sop')
  },
  /** 删除 SOP */
  deleteSop(id) {
    return api.delete(`/materials/sop/${id}`)
  },
  /** 上传聊天记录 */
  uploadChat(formData) {
    return api.post('/materials/chat', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  /** 聊天记录列表 */
  listChat() {
    return api.get('/materials/chat')
  },
}
