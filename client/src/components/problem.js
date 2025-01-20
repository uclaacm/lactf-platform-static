import withStyles from '../components/jss'
import { useState, useCallback, useRef } from 'preact/hooks'

import { getSolves } from '../api/challenges'
import { useToast } from './toast'
import SolvesDialog from './solves-dialog'
import Markdown from './markdown'

const ExternalLink = (props) => <a {...props} target='_blank' />

const markdownComponents = {
  A: ExternalLink
}

const solvesPageSize = 10

const Problem = ({ classes, problem }) => {
  const { toast } = useToast()

  const hasDownloads = problem.files.length !== 0

  const [rawSolves, setRawSolves] = useState(null)
  const [solves, setSolves] = useState(null)
  const [solvesPending, setSolvesPending] = useState(false)
  const [solvesPage, setSolvesPage] = useState(1)
  const modalBodyRef = useRef(null)
  const handleSetSolvesPage = useCallback(async (newPage) => {
    const start = (newPage - 1) * solvesPageSize
    setSolves(rawSolves.slice(start, start + solvesPageSize))
    setSolvesPage(newPage)
    modalBodyRef.current.scrollTop = 0
  }, [rawSolves])
  const onSolvesClick = useCallback(async (e) => {
    e.preventDefault()
    if (solvesPending) {
      return
    }
    let curSolves
    if (rawSolves === null) {
      setSolvesPending(true)
      const { kind, message, data } = await getSolves({
        challId: problem.id
      })
      if (kind !== 'goodChallengeSolves') {
        toast({ body: message, type: 'error' })
        return
      }
      setRawSolves(data.solves)
      setSolvesPending(false)
      curSolves = data.solves
    } else {
      curSolves = rawSolves
    }
    setSolves(curSolves.slice(0, solvesPageSize))
    setSolvesPage(1)
  }, [problem.id, toast, solvesPending, rawSolves])
  const onSolvesClose = useCallback(() => setSolves(null), [])

  return (
    <div class={`frame ${classes.frame} ${blood != null ? `${classes.blood} ${classes[`blood${blood}`]}` : ''}`}>
      <div class='frame__body'>
        <div class='row u-no-padding'>
          <div class='col-6 u-no-padding'>
            <div class='frame__title title'>{problem.category}/{problem.name}</div>
            <div class='frame__subtitle u-no-margin'>{problem.author}</div>
          </div>
          <div class='col-6 u-no-padding u-text-right'>
            <a
              class={`${classes.points} ${solvesPending ? classes.solvesPending : ''}`}
              onClick={onSolvesClick}
            >
              {problem.solves}
              {problem.solves === 1 ? ' solve / ' : ' solves / '}
              {problem.points}
              {problem.points === 1 ? ' point' : ' points'}
            </a>
          </div>
        </div>

        <div class='content-no-padding u-center'><div class={`divider ${classes.divider}`} /></div>

        <div class={`${classes.description} frame__subtitle`}>
          <Markdown content={problem.description} components={markdownComponents} />
        </div>

        {
          hasDownloads &&
            <div>
              <p class='frame__subtitle u-no-margin'>Downloads</p>
              <div class='tag-container'>
                {
                  problem.files.map(file => {
                    return (
                      <div class={`tag ${classes.tag}`} key={file.url}>
                        <a native download href={`${file.url}`}>
                          {file.name}
                        </a>
                      </div>
                    )
                  })
                }

              </div>
            </div>
        }
      </div>
      <SolvesDialog
        solves={solves}
        challName={problem.name}
        solveCount={problem.solves}
        pageSize={solvesPageSize}
        page={solvesPage}
        setPage={handleSetSolvesPage}
        onClose={onSolvesClose}
        modalBodyRef={modalBodyRef}
      />
    </div>
  )
}

export default withStyles({
  frame: {
    marginBottom: '1em',
    paddingBottom: '0.625em',
    background: 'var(--bg-dark)',
    backdropFilter: 'none'
    /* '& a': {
      color: 'white'
    } */
  },
  // LA CTF: track bloods
  blood: {
    '& a': {
      color: '#fff',
    },
    '& .markup a': {
      textDecoration: 'underline'
    },
    '& input': {
      backgroundColor: 'var(--bg-darker) !important',
    }
  },
  blood1: {
    background: 'var(--blood-gold)',
    filter: 'drop-shadow(0px 0px 8px var(--blood-gold-shadow))'
  },
  blood2: {
    background: 'var(--blood-silver)'
  },
  blood3: {
    background: 'var(--blood-bronze)'
  },
  // --------------------
  description: {
    '& a': {
      display: 'inline',
      padding: 0
    },
    '& p': {
      lineHeight: '1.4em',
      fontSize: '1em',
      marginTop: 0
    },
    '& pre': {
      whiteSpace: 'pre-wrap'
    }
  },
  divider: {
    margin: '0.625em',
    width: '80%'
  },
  points: {
    marginTop: '0.75rem !important',
    marginBottom: '0 !important',
    cursor: 'pointer',
    display: 'inline-block',
    transition: 'opacity ease-in-out 0.2s'
  },
  solvesPending: {
    opacity: '0.6',
    pointerEvents: 'none',
    cursor: 'default'
  },
  tag: {
    background: 'var(--bg-darker)'
  },
  input: {
    background: 'var(--bg-darker)',
    color: '#fff !important'
  },
  submit: {
    background: 'var(--bg-darker)',
    color: '#fff',
    '&:hover': {
      background: '#111',
      borderColor: 'var(--cirrus-primary)'
    },
    // unset the custom lactf button styling used elsewhere
    border: '1px solid var(--btn-border-color)',
    borderRadius: '0rem 0.25rem 0.25rem 0rem !important',
    fontSize: '70%',
    fontWeight: '400'
  }
}, Problem)
