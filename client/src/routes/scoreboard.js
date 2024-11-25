import { useState, useEffect, useMemo, useCallback } from 'preact/hooks'
import config from '../config'
import withStyles from '../components/jss'
import Pagination from '../components/pagination'
import Graph from '../components/graph'
import NotStarted from '../components/not-started'

import { getScoreboard, getGraph } from '../api/scoreboard'

const PAGESIZE_OPTIONS = [25, 50, 100]

const loadStates = {
  pending: 0,
  notStarted: 1,
  loaded: 2
}

const Scoreboard = withStyles({
  frame: {
    paddingBottom: '1.5em',
    paddingTop: '2.125em',
    background: 'var(--bg-dark)',
    backdropFilter: 'none',
    '& .frame__subtitle': {
      color: '#fff'
    },
    '& button, & select, & option': {
      background: 'var(--bg-darker)',
      color: '#fff'
    }
  },
  tableFrame: {
    paddingTop: '1.5em'
  },
  selected: {
    backgroundColor: 'rgba(216,216,216,.07)',
    '&:hover': {
      backgroundColor: 'rgba(216,216,216,.20) !important'
    }
  },
  table: {
    tableLayout: 'fixed',
    '& tbody td': {
      overflow: 'hidden',
      whiteSpace: 'nowrap'
    },
    '& a': {
      color: 'white',
      '&:hover': {
        textDecoration: 'underline'
      }
    }
  },
  goto: {
    marginTop: '2rem',
    '&:hover': {
      color: 'var(--btn-fg)'
    }
  }
}, ({ classes }) => {
  const scoreboardPageState = useMemo(() => {
    const localStorageState = JSON.parse(localStorage.getItem('scoreboardPageState') || '{}')

    const queryParams = new URLSearchParams(location.search)
    const queryState = {}
    if (queryParams.has('page')) {
      const page = parseInt(queryParams.get('page'))
      if (!isNaN(page)) {
        queryState.page = page
      }
    }
    if (queryParams.has('pageSize')) {
      const pageSize = parseInt(queryParams.get('pageSize'))
      if (!isNaN(pageSize)) {
        queryState.pageSize = pageSize
      }
    }
    if (queryParams.has('division')) {
      queryState.division = queryParams.get('division')
    }

    return { ...localStorageState, ...queryState }
  }, [])
  const [pageSize, _setPageSize] = useState(scoreboardPageState.pageSize || 100)
  const [scores, setScores] = useState([])
  const [graphData, setGraphData] = useState(null)
  const [division, _setDivision] = useState(scoreboardPageState.division || 'all')
  const [page, setPage] = useState(scoreboardPageState.page || 1)
  const [totalItems, setTotalItems] = useState(0)
  const [scoreLoadState, setScoreLoadState] = useState(loadStates.pending)
  const [graphLoadState, setGraphLoadState] = useState(loadStates.pending)
  const [rawScores, setRawScores] = useState(null)

  const setDivision = useCallback((newDivision) => {
    _setDivision(newDivision)
    setPage(1)
  }, [_setDivision, setPage])
  const setPageSize = useCallback((newPageSize) => {
    _setPageSize(newPageSize)
    // Try to switch to the page containing the teams that were previously
    // at the top of the current page
    setPage(Math.floor((page - 1) * pageSize / newPageSize) + 1)
  }, [pageSize, _setPageSize, page, setPage])

  useEffect(() => {
    localStorage.setItem('scoreboardPageState', JSON.stringify({ pageSize, division }))
  }, [pageSize, division])
  useEffect(() => {
    if (page !== 1 || location.search !== '') {
      history.replaceState({}, '', `?page=${page}&division=${encodeURIComponent(division)}&pageSize=${pageSize}`)
    }
  }, [pageSize, division, page])

  const divisionChangeHandler = useCallback((e) => setDivision(e.target.value), [setDivision])
  const pageSizeChangeHandler = useCallback((e) => setPageSize(e.target.value), [setPageSize])

  useEffect(() => { document.title = `Scoreboard | ${config.ctfName}` }, [])

  useEffect(() => {
    (async () => {
      const { kind, data } = await getScoreboard()
      setScoreLoadState(kind === 'badNotStarted' ? loadStates.notStarted : loadStates.loaded)
      if (kind !== 'goodLeaderboard') {
        return
      }
      setRawScores(data.leaderboard)
    })()
  }, [])

  useEffect(() => {
    (async () => {
      if (rawScores !== null) {
        const start = (page - 1) * pageSize
        let filtScores
        if (division !== 'all') {
          filtScores = rawScores.filter((x) => x.division === division)
        } else {
          filtScores = rawScores
        }
        setScores(filtScores.slice(start, start + pageSize).map((entry, i) => ({
          ...entry,
          rank: start + i + 1
        })))
        setTotalItems(filtScores.length)
      }
    })()
  }, [rawScores, page, pageSize, division])

  useEffect(() => {
    (async () => {
      const _division = division === 'all' ? undefined : division
      const { kind, data } = await getGraph({ division: _division })
      setGraphLoadState(kind === 'badNotStarted' ? loadStates.notStarted : loadStates.loaded)
      if (kind !== 'goodLeaderboard') {
        return
      }
      setGraphData(data)
    })()
  }, [division])

  if (scoreLoadState === loadStates.pending || graphLoadState === loadStates.pending) {
    return null
  }

  if (scoreLoadState === loadStates.notStarted || graphLoadState === loadStates.notStarted) {
    return <NotStarted />
  }

  return (
    <div class='row u-center' style='align-items: initial !important'>
      <div class='col-12 u-center'>
        <div class='col-8'>
          <Graph graphData={graphData} />
        </div>
      </div>
      <div class='col-3'>
        <div class={`frame ${classes.frame}`}>
          <div class='frame__body'>
            <div class='frame__subtitle'>Filter by division</div>
            <div class='input-control'>
              <select required class='select' name='division' value={division} onChange={divisionChangeHandler}>
                <option value='all' selected>All</option>
                {
                  Object.entries(config.divisions).map(([code, name]) => {
                    return <option key={code} value={code}>{name}</option>
                  })
                }
              </select>
            </div>
            <div class='frame__subtitle'>Teams per page</div>
            <div class='input-control'>
              <select required class='select' name='pagesize' value={pageSize} onChange={pageSizeChangeHandler}>
                {PAGESIZE_OPTIONS.map(sz => <option value={sz}>{sz}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>
      <div class='col-6'>
        <div class={`frame ${classes.frame} ${classes.tableFrame}`}>
          <div class='frame__body'>
            <table class={`table small ${classes.table}`}>
              <thead>
                <tr>
                  <th style='width: 3.5em'>#</th>
                  <th>Team</th>
                  <th style='width: 5em'>Points</th>
                </tr>
              </thead>
              <tbody>
                {scores.map(({ id, name, score, rank }) => (
                  <tr key={id}>
                    <td>{rank}</td>
                    <td>
                      <a href={`/profile/${id}`}>{name}</a>
                    </td>
                    <td>{score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalItems > pageSize &&
            <Pagination
              {...{ totalItems, pageSize, page, setPage }}
              numVisiblePages={9}
            />}
        </div>
      </div>
    </div>
  )
})

export default Scoreboard
