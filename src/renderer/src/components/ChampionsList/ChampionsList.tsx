import { useState } from 'react'
import { Search } from 'lucide-react'
import { motion } from 'framer-motion'
import './ChampionsList.css'

const ChampionsList = ({ skins, selection, onChampionClick }) => {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredChampions = skins.filter((champion) =>
    champion.championName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <aside className="champions-list">
      <div className="search-wrapper">
        <div className="search-container">
          <Search className="search-icon" size={14} />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>
      <ul className="champions">
        {filteredChampions.map((champion) => (
          <motion.li
            key={champion.championName}
            className={`champion-option ${selection.championName === champion.championName ? 'selected' : ''}`}
            onClick={() => onChampionClick(champion.championName)}
            whileTap={{ scale: 0.95 }}
          >
            <div className="champion-square-holder">
              <img
                className="champion-square"
                src={champion.championSquare}
                alt={champion.championName}
              />
            </div>
            <p id="champion-name">{champion.championName}</p>
          </motion.li>
        ))}
      </ul>
    </aside>
  )
}

export default ChampionsList
