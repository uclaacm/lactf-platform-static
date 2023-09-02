import { request, handleResponse } from './util'

export const publicProfile = async (uuid) => {
  const resp = await request('GET', `/profiles/${encodeURIComponent(uuid)}.json`)

  return handleResponse({ resp, valid: ['goodUserData'] })
}
