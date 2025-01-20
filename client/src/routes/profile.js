import { useState, useEffect } from 'preact/hooks'
import { memo } from 'preact/compat'
import config from '../config'
import withStyles from '../components/jss'

import { publicProfile } from '../api/profile'
import { useToast } from '../components/toast'
import { PublicSolvesCard } from '../components/profile/solves-card'
import * as util from '../util'
import Trophy from '../icons/trophy.svg'
import AddressBook from '../icons/address-book.svg'
import Rank from '../icons/rank.svg'
import Ctftime from '../icons/ctftime.svg'

const SummaryCard = memo(withStyles({
  icon: {
    '& svg': {
      verticalAlign: 'middle',
      height: '1.25em',
      fill: '#333'
    },
    marginRight: '1.5em'
  },
  publicHeader: {
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    margin: '0 !important',
    maxWidth: '75vw'
  },
  privateHeader: {
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    margin: '0 !important',
    maxWidth: '30vw'
  },
  '@media (max-width: 804px)': {
    privateHeader: {
      maxWidth: '75vw'
    }
  },
  wrapper: {
    display: 'flex',
    justifyContent: 'space-between',
    paddingTop: '15px',
    paddingBottom: '5px'
  }
}, ({ name, score, division, divisionPlace, globalPlace, ctftimeId, classes, isPrivate }) =>
  <div class='card'>
    <div class='content'>
      <div class={classes.wrapper}>
        <h5
          class={`title ${isPrivate ? classes.privateHeader : classes.publicHeader}`}
          title={name}
        >
          {name}
        </h5>
        {
          ctftimeId &&
            <a href={`https://ctftime.org/team/${ctftimeId}`} target='_blank' rel='noopener noreferrer'>
              <Ctftime style='height: 20px;' />
            </a>
        }
      </div>
      <div class='action-bar'>
        <p>
          <span class={`icon ${classes.icon}`}>
            <Trophy />
          </span>
          {
            score === 0
              ? ('No points earned')
              : (`${score} total points`)
          }
        </p>
        <p>
          <span class={`icon ${classes.icon}`}>
            <Rank />
          </span>
          {
            score === 0 ? 'Unranked' : `${divisionPlace} in the ${division} division`
          }
        </p>
        <p>
          <span class={`icon ${classes.icon}`}>
            <Rank />
          </span>
          {
            score === 0 ? 'Unranked' : `${globalPlace} across all teams`
          }
        </p>
        <p>
          <span class={`icon ${classes.icon}`}>
            <AddressBook />
          </span>
          {division} division
        </p>
      </div>
    </div>
  </div>
))

const Profile = ({ uuid, classes }) => {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(null)
  const [data, setData] = useState({})
  const { toast } = useToast()

  const {
    name,
    score,
    solves,
    ctftimeId
  } = data
  const division = config.divisions[data.division]
  const divisionPlace = util.strings.placementString(data.divisionPlace)
  const globalPlace = util.strings.placementString(data.globalPlace)

  useEffect(() => {
    setLoaded(false)
    publicProfile(uuid)
      .then(({ data, error }) => {
        if (error) {
          setError('Profile not found')
        } else {
          setData(data)
        }
        setLoaded(true)
      })
  }, [uuid, toast])

  useEffect(() => { document.title = `Profile | ${config.ctfName}` }, [])

  if (!loaded) return null

  if (error !== null) {
    return (
      <div class='row u-center'>
        <div class='col-4'>
          <div class={`card ${classes.errorCard}`}>
            <div class='content'>
              <p class='title'>There was an error</p>
              <p class='font-thin'>{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div class={classes.root}>
      <div class={classes.col}>
        <SummaryCard {...{ name, score, division, divisionPlace, globalPlace, ctftimeId }} />
        <PublicSolvesCard solves={solves} />
      </div>
    </div>
  )
}

export default withStyles({
  root: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(384px, 1fr))',
    width: '100%',
    maxWidth: '1500px',
    margin: 'auto',
    '& .card': {
      background: 'var(--bg-dark)',
      backdropFilter: 'none',
      marginBottom: '20px'
    },
    '& input, & select, & option': {
      background: 'var(--bg-darker)',
      color: '#fff !important'
    }
  },
  col: {
    margin: '0 auto',
    width: 'calc(100% - 20px)',
    marginLeft: '10px'
  },
  privateCol: {
    width: 'calc(100% - 20px)',
    marginLeft: '10px'
  },
  errorCard: {
    background: 'var(--bg-dark)',
    backdropFilter: 'none'
  }
}, Profile)
