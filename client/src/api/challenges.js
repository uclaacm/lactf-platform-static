import { request, handleResponse } from './util'

export const getChallenges = async () => {
  const resp = await request('GET', '/challs.json')

  if (resp.kind === 'badNotStarted') {
    return {
      notStarted: true
    }
  }

  return handleResponse({ resp, valid: ['goodChallenges'] })
}

export const getSolves = ({ challId }) => {
  return request('GET', `/solves/${encodeURIComponent(challId)}.json`)
}

export const submitFlag = async (id, flag) => {
  if (flag === undefined || flag.length === 0) {
    return Promise.resolve({
      error: "Flag can't be empty"
    })
  }

  const resp = await request('POST', `/challs/${encodeURIComponent(id)}/submit`, {
    flag
  })

  return handleResponse({ resp, valid: ['goodFlag'] })
}
