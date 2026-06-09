import api from './axios'

export const roleApi = {
  getAll() {
    return api.get('/roles')
  }
}
