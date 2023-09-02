import { request } from './util'

export const getScoreboard = () => {
  return request('GET', '/leaderboard.json')
}

export const getGraph = async ({ division }) => {
  return request('GET', `/graphs/graph${division !== undefined ? `-${division}` : ''}.json`)
}
