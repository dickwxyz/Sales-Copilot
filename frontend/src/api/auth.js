import api from './index'

export const authApi = {
  register(data) {
    return api.post('/auth/register', data)
  },
  login(data) {
    return api.post('/auth/login', data)
  },
  me() {
    return api.get('/auth/me')
  },
}
